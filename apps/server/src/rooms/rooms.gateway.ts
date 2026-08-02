import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets'
import type { Server, Socket } from 'socket.io'
import { RoomsService } from './rooms.service.js'
import type { RoomState } from './room.types.js'

type JoinRoomMessage = {
  code?: string
  token?: string
}

@WebSocketGateway({
  cors: {
    origin: true,
  },
})
export class RoomsGateway {
  @WebSocketServer()
  private server!: Server

  constructor(private readonly roomsService: RoomsService) {}

  @SubscribeMessage('room:join')
  async joinRoom(
    @MessageBody() body: JoinRoomMessage,
    @ConnectedSocket() socket: Socket,
  ) {
    const code = String(body.code ?? '').toUpperCase()
    const state = await this.roomsService.assertMember(code, body.token)
    void socket.join(code)
    socket.emit('room:updated', this.stripSecrets(state))
    return { ok: true }
  }

  broadcastRoom(code: string, state: RoomState) {
    const roomCode = code.toUpperCase()
    this.server.to(roomCode).emit('room:updated', this.stripSecrets(state))
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
