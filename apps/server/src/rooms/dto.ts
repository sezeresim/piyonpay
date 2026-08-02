export type CreateRoomDto = {
  nickname?: string
  avatar?: string
  roomName?: string
  /** 4-digit numeric PIN */
  pin?: string
  initialBalance?: number
  bankBalance?: number
  maxPlayers?: number
}

export type JoinRoomDto = {
  nickname?: string
  avatar?: string
  /** 4-digit numeric PIN */
  pin?: string
}

/** Auth for mutating actions — token identifies the player. */
export type AuthDto = {
  token?: string
}

export type ReadyDto = AuthDto & {
  ready?: boolean
}

export type CreateTransferDto = AuthDto & {
  toPlayerId?: string
  amount?: number
}

/** Special recipient id for payments into the bank vault. */
export const BANK_RECIPIENT_ID = '__bank__'

/** Special recipient id for paying every other player the same amount. */
export const ALL_PLAYERS_RECIPIENT_ID = '__all__'

export type BankerActionDto = AuthDto & {
  targetPlayerId?: string
  amount?: number
  mode?: 'give' | 'remove'
}
