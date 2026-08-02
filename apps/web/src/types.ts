import type { PublicPlayer, PublicRoom } from '@piyonpay/shared'

export type { TransferRequest, Transaction, RoomState } from '@piyonpay/shared'

export { BANK_RECIPIENT_ID, ALL_PLAYERS_RECIPIENT_ID, SOCKET_EVENTS } from '@piyonpay/shared'

/** Client-facing player (no seat token). */
export type Player = PublicPlayer

/** Client-facing room (no PIN). */
export type Room = PublicRoom
