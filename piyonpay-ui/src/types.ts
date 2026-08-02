export type Player = {
  id: string
  nickname: string
  avatar: string
  balance: number
  isBanker: boolean
  ready: boolean
}

export type TransferRequest = {
  id: string
  fromPlayerId: string
  toPlayerId: string
  fromName: string
  toName: string
  amount: number
  status: 'pending' | 'approved' | 'rejected'
  createdAt: string
}

export type Transaction = {
  id: string
  type: 'transfer' | 'banker'
  from: string
  to: string
  amount: number
  note: string
  createdAt: string
}

export type Room = {
  id: string
  code: string
  name: string
  initialBalance: number
  bankBalance: number
  maxPlayers: number
  started: boolean
  closed: boolean
  adminHoldUntil: string | null
}

/** Special recipient id for payments into the bank vault. */
export const BANK_RECIPIENT_ID = '__bank__'

/** Special recipient id for paying every other player the same amount. */
export const ALL_PLAYERS_RECIPIENT_ID = '__all__'

export type RoomState = {
  room: Room
  players: Player[]
  transfers: TransferRequest[]
  transactions: Transaction[]
  playerId?: string
  /** Device secret from create/join — never share */
  playerToken?: string
  deleted?: boolean
}
