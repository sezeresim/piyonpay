import type { RoomState } from './room'

/** Client → server: join a socket room after HTTP create/join. */
export const SOCKET_EVENTS = {
  ROOM_JOIN: 'room:join',
  ROOM_UPDATED: 'room:updated',
  PLAYER_JOINED: 'player:joined',
  PLAYER_LEFT: 'player:left',
  PLAYER_READY: 'player:ready',
  GAME_STARTED: 'game:started',
  TRANSFER_CREATED: 'transfer:created',
  BANK_UPDATED: 'bank:updated',
  ROOM_CLOSED: 'room:closed',
  ROOM_DELETED: 'room:deleted',
} as const

export type SocketEventName = (typeof SOCKET_EVENTS)[keyof typeof SOCKET_EVENTS]

/** Server → client event payloads (full public snapshot for each mutation). */
export type ServerSocketEvents = {
  [SOCKET_EVENTS.ROOM_UPDATED]: RoomState
  [SOCKET_EVENTS.PLAYER_JOINED]: RoomState
  [SOCKET_EVENTS.PLAYER_LEFT]: RoomState
  [SOCKET_EVENTS.PLAYER_READY]: RoomState
  [SOCKET_EVENTS.GAME_STARTED]: RoomState
  [SOCKET_EVENTS.TRANSFER_CREATED]: RoomState
  [SOCKET_EVENTS.BANK_UPDATED]: RoomState
  [SOCKET_EVENTS.ROOM_CLOSED]: RoomState
  [SOCKET_EVENTS.ROOM_DELETED]: RoomState
}

export type JoinRoomMessage = {
  code?: string
  token?: string
}

/** Mutation kinds used when broadcasting after HTTP actions. */
export type RoomBroadcastKind =
  | 'player:joined'
  | 'player:left'
  | 'player:ready'
  | 'game:started'
  | 'transfer:created'
  | 'bank:updated'
  | 'room:closed'
  | 'room:deleted'
  | 'room:updated'
