import { randomBytes } from 'node:crypto'
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import type {
  AuthDto,
  BankerActionDto,
  CreateRoomDto,
  CreateTransferDto,
  JoinRoomDto,
  ReadyDto,
} from './dto.js'
import { BANK_RECIPIENT_ID, ALL_PLAYERS_RECIPIENT_ID } from './dto.js'
import { sanitizeAvatarId } from './avatars.js'
import type {
  Player,
  PublicPlayer,
  PublicRoom,
  Room,
  RoomState,
  Transaction,
} from './room.types.js'
import type { ClientSession } from 'mongodb'
import { getEnv } from '../config/env.js'
import { MongoService } from '../mongo/mongo.service.js'
import { RoomsRepository } from './rooms.repository.js'

const MAX_PLAYERS = 10
const HISTORY_LIMIT = 100
const ROOM_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

@Injectable()
export class RoomsService {
  /** Hot cache for the single Node process; Mongo is the source of truth across restarts. */
  private readonly rooms = new Map<string, Room>()

  constructor(
    private readonly roomsRepository: RoomsRepository,
    private readonly mongo: MongoService,
  ) {}

  async health() {
    const mongoOk = await this.mongo.ping()
    return { ok: mongoOk, mongo: mongoOk ? 'up' : 'down' }
  }

  async createRoom(dto: CreateRoomDto): Promise<RoomState> {
    const initialBalance = this.sanitizeNumber(dto.initialBalance, 1500, 1, 100000)
    const maxPlayers = this.sanitizeNumber(dto.maxPlayers, MAX_PLAYERS, 2, MAX_PLAYERS)
    const bankBalance = this.sanitizeNumber(dto.bankBalance, 30000, 0, 1000000)
    const pin = this.requirePin(dto.pin)
    const banker: Player = {
      id: this.makeId('player'),
      token: this.makeToken(),
      nickname: this.sanitizeText(dto.nickname, 'Banker', 24),
      avatar: sanitizeAvatarId(dto.avatar),
      balance: initialBalance,
      isBanker: true,
      ready: true,
    }
    const code = await this.makeRoomCode()
    const room: Room = {
      id: this.makeId('room'),
      code,
      name: this.sanitizeText(dto.roomName, 'Game Room', 40),
      pin,
      initialBalance,
      bankBalance,
      maxPlayers,
      started: false,
      closed: false,
      adminHoldUntil: null,
      players: [banker],
      transfers: [],
      transactions: [],
    }

    await this.persist(room, { create: true })
    return {
      ...this.roomState(room),
      playerId: banker.id,
      playerToken: banker.token,
    }
  }

  async getRoomState(code: string, viewerToken?: string): Promise<RoomState> {
    // Full room state requires a seat token (no anonymous balance peeking).
    return this.assertMember(code, viewerToken)
  }

  async joinRoom(code: string, dto: JoinRoomDto): Promise<RoomState> {
    const room = await this.requireRoom(code)
    this.assertRoomOpen(room)
    if (room.players.length >= room.maxPlayers) {
      throw new ConflictException('Room is full.')
    }
    if (room.started) {
      throw new ConflictException('Game already started.')
    }

    const pin = this.requirePin(dto.pin)
    if (room.pin !== pin) {
      throw new ForbiddenException('Incorrect PIN.')
    }

    const player: Player = {
      id: this.makeId('player'),
      token: this.makeToken(),
      nickname: this.sanitizeText(dto.nickname, 'Player', 24),
      avatar: sanitizeAvatarId(dto.avatar),
      balance: room.initialBalance,
      isBanker: false,
      ready: false,
    }

    room.players.push(player)
    await this.persist(room)
    return {
      ...this.roomState(room),
      playerId: player.id,
      playerToken: player.token,
    }
  }

  async setReady(code: string, dto: ReadyDto): Promise<RoomState> {
    const room = await this.requireRoom(code)
    this.assertRoomOpen(room)
    if (room.started) {
      throw new ConflictException('Game already started.')
    }
    const player = this.requireAuth(room, dto.token)
    player.ready = Boolean(dto.ready)
    await this.persist(room)
    return this.roomState(room)
  }

  async startGame(code: string, dto: AuthDto): Promise<RoomState> {
    const room = await this.requireRoom(code)
    this.assertRoomOpen(room)
    this.requireBankerAuth(room, dto.token)
    if (room.players.length < 2 || room.players.some((player) => !player.ready)) {
      throw new ConflictException('At least two ready players are required.')
    }

    room.started = true
    await this.persist(room)
    return this.roomState(room)
  }

  async createTransfer(code: string, dto: CreateTransferDto): Promise<RoomState> {
    return this.mutateRoomAtomic(code, async (room, session) => {
      this.assertRoomOpen(room)
      if (!room.started) {
        throw new ConflictException('Game has not started.')
      }

      const from = this.requireAuth(room, dto.token)
      const amount = this.sanitizeNumber(dto.amount, 0, 0, 100000)
      const toBank = dto.toPlayerId === BANK_RECIPIENT_ID
      const toAll = dto.toPlayerId === ALL_PLAYERS_RECIPIENT_ID

      if (amount <= 0) {
        throw new BadRequestException('Invalid transfer request.')
      }

      if (toAll) {
        const recipients = room.players.filter((player) => player.id !== from.id)
        if (recipients.length === 0) {
          throw new ConflictException('No other players to pay.')
        }

        const total = amount * recipients.length
        if (from.balance < total) {
          throw new ConflictException('Sender balance is too low.')
        }

        for (const to of recipients) {
          from.balance -= amount
          to.balance += amount
          this.pushTransfer(room, {
            fromPlayerId: from.id,
            toPlayerId: to.id,
            fromName: from.nickname,
            toName: to.nickname,
            amount,
          })
          this.addTransaction(room, {
            type: 'transfer',
            from: from.nickname,
            to: to.nickname,
            amount,
            note: 'Paid every player (joker)',
          })
        }
        await this.persist(room, { session })
        return this.roomState(room)
      }

      if (from.balance < amount) {
        throw new ConflictException('Sender balance is too low.')
      }

      if (toBank) {
        from.balance -= amount
        room.bankBalance += amount
        this.pushTransfer(room, {
          fromPlayerId: from.id,
          toPlayerId: BANK_RECIPIENT_ID,
          fromName: from.nickname,
          toName: 'Bank',
          amount,
        })
        this.addTransaction(room, {
          type: 'transfer',
          from: from.nickname,
          to: 'Bank',
          amount,
          note: 'Paid to bank vault',
        })
        await this.persist(room, { session })
        return this.roomState(room)
      }

      const to = this.requirePlayerById(room, dto.toPlayerId)
      if (from.id === to.id) {
        throw new BadRequestException('Invalid transfer request.')
      }

      from.balance -= amount
      to.balance += amount
      this.pushTransfer(room, {
        fromPlayerId: from.id,
        toPlayerId: to.id,
        fromName: from.nickname,
        toName: to.nickname,
        amount,
      })
      this.addTransaction(room, {
        type: 'transfer',
        from: from.nickname,
        to: to.nickname,
        amount,
        note: from.isBanker ? 'Banker paid directly' : 'Player paid directly',
      })
      await this.persist(room, { session })
      return this.roomState(room)
    })
  }

  async runBankerAction(code: string, dto: BankerActionDto): Promise<RoomState> {
    return this.mutateRoomAtomic(code, async (room, session) => {
      this.assertRoomOpen(room)
      this.requireBankerAuth(room, dto.token)

      const target = this.requirePlayerById(room, dto.targetPlayerId)
      const amount = this.sanitizeNumber(dto.amount, 0, 0, 100000)
      const mode = dto.mode === 'remove' ? 'remove' : 'give'
      if (amount <= 0) {
        throw new BadRequestException('Invalid banker action.')
      }
      if (mode === 'give' && room.bankBalance < amount) {
        throw new ConflictException('Bank vault balance is too low.')
      }
      if (mode === 'remove' && target.balance < amount) {
        throw new ConflictException('Target balance is too low.')
      }

      if (mode === 'give') {
        room.bankBalance -= amount
        target.balance += amount
      } else {
        target.balance -= amount
        room.bankBalance += amount
      }

      this.addTransaction(room, {
        type: 'banker',
        from: mode === 'give' ? 'Bank' : target.nickname,
        to: mode === 'give' ? target.nickname : 'Bank',
        amount,
        note: mode === 'give' ? 'Paid from bank vault' : 'Returned to bank vault',
      })
      await this.persist(room, { session })
      return this.roomState(room)
    })
  }

  /** Socket / membership check — token must belong to a current seat. */
  async assertMember(code: string, token?: string): Promise<RoomState> {
    const room = await this.requireRoom(code)
    const player = this.requireAuth(room, token)
    if (room.closed && !player.isBanker) {
      throw new ForbiddenException('Room is closed.')
    }
    return this.roomState(room)
  }

  async leaveRoom(code: string, dto: AuthDto): Promise<RoomState> {
    const room = await this.requireRoom(code)
    const player = this.requireAuth(room, dto.token)

    if (player.isBanker) {
      throw new ConflictException('Banker must close the room.')
    }

    room.players = room.players.filter((item) => item.id !== player.id)
    if (room.players.length === 0) {
      await this.deleteRoom(room.code)
      return {
        deleted: true,
        room: this.publicRoom(room),
        players: [],
        transfers: [],
        transactions: [],
      }
    }

    await this.persist(room)
    return this.roomState(room)
  }

  async closeRoom(code: string, dto: AuthDto): Promise<RoomState> {
    const room = await this.requireRoom(code)
    this.requireBankerAuth(room, dto.token)
    if (room.closed) {
      throw new ConflictException('Room is closed.')
    }
    return this.closeRoomInternal(room)
  }

  async finalizeRoom(code: string, dto: AuthDto): Promise<RoomState> {
    const room = await this.requireRoom(code)
    this.requireBankerAuth(room, dto.token)
    if (!room.closed) {
      throw new ConflictException('Room must be closed first.')
    }
    await this.deleteRoom(room.code)
    return {
      deleted: true,
      room: this.publicRoom(room),
      players: [],
      transfers: [],
      transactions: [],
    }
  }

  private async closeRoomInternal(room: Room): Promise<RoomState> {
    const holdMinutes = getEnv().ROOM_ADMIN_HOLD_MINUTES
    room.closed = true
    room.adminHoldUntil = new Date(Date.now() + holdMinutes * 60 * 1000).toISOString()
    room.players = room.players.filter((player) => player.isBanker)
    for (const player of room.players) {
      player.ready = false
    }
    await this.persist(room)
    return this.roomState(room)
  }

  /**
   * Clone room, mutate inside a Mongo transaction, then swap cache on success.
   * On failure the in-memory cache is left unchanged (rollback).
   */
  private async mutateRoomAtomic(
    code: string,
    mutator: (room: Room, session: ClientSession) => Promise<RoomState>,
  ): Promise<RoomState> {
    return this.mongo.withTransaction(async (session) => {
      const base = await this.requireRoom(code)
      const working = this.cloneRoom(base)
      return mutator(working, session)
    })
  }

  private cloneRoom(room: Room): Room {
    return structuredClone(room)
  }

  private async persist(
    room: Room,
    options?: { create?: boolean; session?: ClientSession },
  ): Promise<void> {
    this.trimHistory(room)
    try {
      await this.roomsRepository.save(room, options)
      this.rooms.set(room.code, room)
    } catch (error) {
      if (error instanceof Error && error.message === 'ROOM_EXPIRED') {
        this.rooms.delete(room.code)
        throw new NotFoundException('Room not found.')
      }
      throw error
    }
  }

  private roomState(room: Room): RoomState {
    return {
      room: this.publicRoom(room),
      players: room.players.map((player) => this.publicPlayer(player)),
      transfers: room.transfers,
      transactions: room.transactions,
    }
  }

  private publicPlayer(player: Player): PublicPlayer {
    return {
      id: player.id,
      nickname: player.nickname,
      avatar: player.avatar,
      balance: player.balance,
      isBanker: player.isBanker,
      ready: player.ready,
    }
  }

  private publicRoom(room: Room): PublicRoom {
    return {
      id: room.id,
      code: room.code,
      name: room.name,
      initialBalance: room.initialBalance,
      bankBalance: room.bankBalance,
      maxPlayers: room.maxPlayers,
      started: room.started,
      closed: Boolean(room.closed),
      adminHoldUntil: room.adminHoldUntil ?? null,
    }
  }

  private pushTransfer(
    room: Room,
    transfer: Omit<Room['transfers'][number], 'id' | 'status' | 'createdAt'>,
  ) {
    room.transfers.unshift({
      ...transfer,
      id: this.makeId('request'),
      status: 'approved',
      createdAt: new Date().toISOString(),
    })
  }

  private addTransaction(room: Room, transaction: Omit<Transaction, 'id' | 'createdAt'>) {
    room.transactions.unshift({
      ...transaction,
      id: this.makeId('tx'),
      createdAt: new Date().toISOString(),
    })
  }

  private trimHistory(room: Room) {
    if (room.transfers.length > HISTORY_LIMIT) {
      room.transfers.length = HISTORY_LIMIT
    }
    if (room.transactions.length > HISTORY_LIMIT) {
      room.transactions.length = HISTORY_LIMIT
    }
  }

  private async requireRoom(code: string): Promise<Room> {
    const key = String(code ?? '').toUpperCase()

    const cached = this.rooms.get(key)
    if (cached) {
      // Drop stale cache if Mongo TTL already removed the document.
      const stillThere = await this.roomsRepository.findByCode(key)
      if (!stillThere) {
        this.rooms.delete(key)
        throw new NotFoundException('Room not found.')
      }
      // Prefer freshest Mongo snapshot for players/tokens while keeping mutations in-process.
      this.syncCacheFromStored(cached, stillThere)
      this.ensureRoomDefaults(cached)
      if (await this.expireClosedRoomIfNeeded(cached)) {
        throw new NotFoundException('Room not found.')
      }
      return cached
    }

    const stored = await this.roomsRepository.findByCode(key)
    if (!stored) {
      throw new NotFoundException('Room not found.')
    }

    this.ensureRoomDefaults(stored)
    if (await this.expireClosedRoomIfNeeded(stored)) {
      throw new NotFoundException('Room not found.')
    }
    this.rooms.set(key, stored)
    return stored
  }

  /**
   * Keep the in-memory object identity (callers hold the same Room ref) but
   * refresh fields when Mongo is ahead after a process that only wrote to DB.
   * For single-process MVP the cache is authoritative between persists; we only
   * use stored when cache was empty. This helper mainly repairs token backfill.
   */
  private syncCacheFromStored(cached: Room, stored: Room) {
    for (const player of cached.players) {
      if (!player.token) {
        const match = stored.players.find((item) => item.id === player.id)
        if (match?.token) player.token = match.token
      }
    }
  }

  private async expireClosedRoomIfNeeded(room: Room): Promise<boolean> {
    if (!room.closed || !room.adminHoldUntil) return false
    if (Date.now() < new Date(room.adminHoldUntil).getTime()) return false
    await this.deleteRoom(room.code)
    return true
  }

  private async deleteRoom(code: string) {
    const key = code.toUpperCase()
    this.rooms.delete(key)
    await this.roomsRepository.deleteByCode(key)
  }

  private assertRoomOpen(room: Room) {
    if (room.closed) {
      throw new ConflictException('Room is closed.')
    }
  }

  /** Backfill older Mongo docs that predate avatar / pin / token / close fields. */
  private ensureRoomDefaults(room: Room) {
    for (const player of room.players) {
      player.avatar = sanitizeAvatarId(player.avatar)
      if (!player.token || typeof player.token !== 'string') {
        player.token = this.makeToken()
      }
    }
    if (!room.pin || !/^\d{4}$/.test(room.pin)) {
      // Invalid legacy PIN: joins fail until the room is recreated.
      room.pin = ''
    }
    room.closed = Boolean(room.closed)
    room.adminHoldUntil = room.adminHoldUntil ?? null
  }

  private requirePin(value: unknown): string {
    const digits = String(value ?? '')
      .replace(/\D/g, '')
      .slice(0, 4)
    if (digits.length !== 4) {
      throw new BadRequestException('PIN must be 4 digits.')
    }
    return digits
  }

  private requireAuth(room: Room, token?: string): Player {
    const value = typeof token === 'string' ? token.trim() : ''
    if (!value) {
      throw new ForbiddenException('Player not in room.')
    }
    const player = room.players.find((item) => item.token === value)
    if (!player) {
      throw new ForbiddenException('Player not in room.')
    }
    return player
  }

  private requireBankerAuth(room: Room, token?: string): Player {
    const player = this.requireAuth(room, token)
    if (!player.isBanker) {
      throw new ForbiddenException('Only banker can perform this action.')
    }
    return player
  }

  private requirePlayerById(room: Room, playerId?: string): Player {
    const player = room.players.find((item) => item.id === playerId)
    if (!player) {
      throw new ForbiddenException('Player not in room.')
    }
    return player
  }

  private async makeRoomCode(): Promise<string> {
    for (let attempt = 0; attempt < 20; attempt += 1) {
      let code = ''
      const bytes = randomBytes(6)
      for (let i = 0; i < 6; i += 1) {
        code += ROOM_CODE_ALPHABET[bytes[i]! % ROOM_CODE_ALPHABET.length]
      }
      if (!this.rooms.has(code) && !(await this.roomsRepository.codeExists(code))) {
        return code
      }
    }
    throw new ConflictException('Could not allocate a room code.')
  }

  private makeId(prefix: string): string {
    return `${prefix}-${randomBytes(6).toString('hex')}`
  }

  private makeToken(): string {
    return randomBytes(24).toString('base64url')
  }

  private sanitizeText(value: unknown, fallback: string, maxLength: number): string {
    const text = typeof value === 'string' ? value.trim() : ''
    return (text || fallback).slice(0, maxLength)
  }

  private sanitizeNumber(value: unknown, fallback: number, min: number, max: number): number {
    const number = Number(value)
    if (!Number.isFinite(number)) return fallback
    return Math.min(max, Math.max(min, Math.round(number)))
  }
}
