import { SkipThrottle } from '@nestjs/throttler'
import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsException,
} from '@nestjs/websockets'
import {
  joinRoomMessageSchema,
  SOCKET_EVENTS,
  type JoinRoomMessage,
  type RoomBroadcastKind,
  type RoomState,
} from '@piyonpay/shared'
import type { Server, Socket } from 'socket.io'
import { getEnv } from '../config/env.js'
import { ZodValidationPipe } from '../common/zod-validation.pipe.js'
import { RoomsService } from './rooms.service.js'
import { WsRateLimit } from './ws-rate-limit.js'

@SkipThrottle()
@WebSocketGateway({
  cors: {
    origin: true,
  },
})
export class RoomsGateway {
  @WebSocketServer()
  private server!: Server

  private readonly joinLimit = new WsRateLimit(getEnv().THROTTLE_LIMIT, getEnv().THROTTLE_TTL_MS)

  constructor(private readonly roomsService: RoomsService) { }

  @SubscribeMessage(SOCKET_EVENTS.ROOM_JOIN)
  async joinRoom(
    @MessageBody(new ZodValidationPipe(joinRoomMessageSchema, 'ws')) body: JoinRoomMessage,
    @ConnectedSocket() socket: Socket,
  ) {
    const key = socket.handshake?.address || socket.id
    if (!this.joinLimit.allow(key)) {
      throw new WsException('Too many join attempts. Please wait.')
    }

    const code = String(body.code ?? '').toUpperCase()
    const state = await this.roomsService.assertMember(code, body.token)
    void socket.join(code)
    // Full snapshot on (re)connect
    socket.emit(SOCKET_EVENTS.ROOM_UPDATED, this.stripSecrets(state))
    return { ok: true }
  }

  /**
   * Broadcast a granular mutation event (full public RoomState payload).
   * Clients also receive `room:updated` on (re)connect via `room:join`.
   */
  broadcastRoom(code: string, state: RoomState, kind: RoomBroadcastKind = 'room:updated') {
    const roomCode = code.toUpperCase()
    const payload = this.stripSecrets(state)
    this.server.to(roomCode).emit(this.eventForKind(kind), payload)
  }

  private eventForKind(kind: RoomBroadcastKind): string {
    switch (kind) {
      case 'player:joined':
        return SOCKET_EVENTS.PLAYER_JOINED
      case 'player:left':
        return SOCKET_EVENTS.PLAYER_LEFT
      case 'player:ready':
        return SOCKET_EVENTS.PLAYER_READY
      case 'game:started':
        return SOCKET_EVENTS.GAME_STARTED
      case 'transfer:created':
        return SOCKET_EVENTS.TRANSFER_CREATED
      case 'bank:updated':
        return SOCKET_EVENTS.BANK_UPDATED
      case 'room:closed':
        return SOCKET_EVENTS.ROOM_CLOSED
      case 'room:deleted':
        return SOCKET_EVENTS.ROOM_DELETED
      default:
        return SOCKET_EVENTS.ROOM_UPDATED
    }
  }

  private stripSecrets(state: RoomState): RoomState {
    return {
      room: state.room,
      players: state.players,
      transfers: state.transfers,
      transactions: state.transactions,
      ...(state.deleted ? { deleted: true } : {}),
    }
  }
}
