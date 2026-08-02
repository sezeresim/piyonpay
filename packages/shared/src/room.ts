export type Player = {
  id: string
  /** Secret device credential — never included in public RoomState */
  token: string
  nickname: string
  avatar: string
  balance: number
  isBanker: boolean
  ready: boolean
}

/** Player shape returned to clients (no token). */
export type PublicPlayer = Omit<Player, 'token'>

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

export type PublicRoom = {
  id: string
  code: string
  name: string
  initialBalance: number
  bankBalance: number
  maxPlayers: number
  started: boolean
  /** True after banker closes — non-admin players are removed */
  closed: boolean
  /** ISO timestamp until which only the banker may still open the room */
  adminHoldUntil: string | null
}

export type Room = PublicRoom & {
  /** 4-digit numeric PIN — never included in PublicRoom / client payloads */
  pin: string
  players: Player[]
  transfers: TransferRequest[]
  transactions: Transaction[]
}

export type RoomState = {
  room: PublicRoom
  players: PublicPlayer[]
  transfers: TransferRequest[]
  transactions: Transaction[]
  /** Only set on create/join responses for the acting device */
  playerId?: string
  /** Only set on create/join responses — store client-side, never share */
  playerToken?: string
  /** True when the room was deleted (leave/finalize) */
  deleted?: boolean
}

/** Special recipient id for payments into the bank vault. */
export const BANK_RECIPIENT_ID = '__bank__'

/** Special recipient id for paying every other player the same amount. */
export const ALL_PLAYERS_RECIPIENT_ID = '__all__'
