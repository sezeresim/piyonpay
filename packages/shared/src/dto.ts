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

export type BankerActionDto = AuthDto & {
  targetPlayerId?: string
  amount?: number
  mode?: 'give' | 'remove'
}
