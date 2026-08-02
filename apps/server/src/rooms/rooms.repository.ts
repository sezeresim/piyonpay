import { Injectable, Logger, OnModuleInit } from '@nestjs/common'
import type { ClientSession, Collection } from 'mongodb'
import { getEnv } from '../config/env.js'
import { MongoService } from '../mongo/mongo.service.js'
import type { Room } from './room.types.js'

export type RoomDocument = Room & {
  createdAt: Date
  updatedAt: Date
  /** Sliding TTL — Mongo deletes the doc when this date is reached */
  expiresAt: Date
}

export type SaveOptions = {
  create?: boolean
  session?: ClientSession
}

const COLLECTION = 'rooms'

@Injectable()
export class RoomsRepository implements OnModuleInit {
  private readonly logger = new Logger(RoomsRepository.name)
  private collection!: Collection<RoomDocument>

  constructor(private readonly mongo: MongoService) {}

  async onModuleInit() {
    this.collection = this.mongo.getDb().collection<RoomDocument>(COLLECTION)
    await this.collection.createIndexes([
      { key: { code: 1 }, name: 'rooms_code_unique', unique: true },
      {
        key: { expiresAt: 1 },
        name: 'rooms_expires_ttl',
        expireAfterSeconds: 0,
      },
    ])
    this.logger.log('Room indexes ready (unique code + TTL on expiresAt)')
  }

  private ttlMs(): number {
    return getEnv().ROOM_TTL_HOURS * 60 * 60 * 1000
  }

  private withTtl(room: Room, existing?: RoomDocument | null): RoomDocument {
    const now = new Date()
    return {
      ...room,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
      expiresAt: new Date(now.getTime() + this.ttlMs()),
    }
  }

  async findByCode(code: string, session?: ClientSession): Promise<Room | null> {
    const doc = await this.collection.findOne({ code: code.toUpperCase() }, { session })
    if (!doc) return null
    // Treat expired docs as gone even if Mongo TTL sweeper has not run yet.
    if (doc.expiresAt && doc.expiresAt.getTime() <= Date.now()) {
      await this.deleteByCode(code, session)
      return null
    }
    return this.toRoom(doc)
  }

  async codeExists(code: string): Promise<boolean> {
    const room = await this.findByCode(code)
    return room !== null
  }

  async save(room: Room, options?: SaveOptions): Promise<void> {
    const session = options?.session
    if (options?.create) {
      await this.collection.insertOne(this.withTtl(room, null), { session })
      return
    }

    const existing = await this.collection.findOne({ code: room.code }, { session })
    if (!existing || (existing.expiresAt && existing.expiresAt.getTime() <= Date.now())) {
      if (existing) await this.deleteByCode(room.code, session)
      // Never upsert — avoids resurrecting TTL-deleted rooms from a stale cache.
      throw new Error('ROOM_EXPIRED')
    }
    const doc = this.withTtl(room, existing)
    await this.collection.replaceOne({ code: room.code }, doc, { session })
  }

  async deleteByCode(code: string, session?: ClientSession): Promise<void> {
    await this.collection.deleteOne({ code: code.toUpperCase() }, { session })
  }

  private toRoom(doc: RoomDocument): Room {
    return {
      id: doc.id,
      code: doc.code,
      name: doc.name,
      pin: typeof doc.pin === 'string' && /^\d{4}$/.test(doc.pin) ? doc.pin : '',
      initialBalance: doc.initialBalance,
      bankBalance: doc.bankBalance,
      maxPlayers: doc.maxPlayers,
      started: doc.started,
      closed: Boolean(doc.closed),
      adminHoldUntil: doc.adminHoldUntil ?? null,
      players: Array.isArray(doc.players) ? doc.players : [],
      transfers: Array.isArray(doc.transfers) ? doc.transfers : [],
      transactions: Array.isArray(doc.transactions) ? doc.transactions : [],
    }
  }
}
