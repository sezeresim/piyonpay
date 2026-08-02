import { create } from 'zustand'
import { BANK_RECIPIENT_ID, ALL_PLAYERS_RECIPIENT_ID, type Room, type RoomState } from '@/types'

export type ConnectionStatus = 'connected' | 'reconnecting' | 'disconnected'

type RoomSnapshot = {
  room: Room | null
  players: RoomState['players']
  transfers: RoomState['transfers']
  transactions: RoomState['transactions']
}

type RoomStore = RoomSnapshot & {
  connectionStatus: ConnectionStatus
  busy: boolean
  loading: boolean
  error: string
  recipientId: string
  bankerTargetId: string
  currentPlayerId: string
  playerToken: string

  resetForRoom: (playerId: string, playerToken: string) => void
  setLoading: (loading: boolean) => void
  setError: (error: string) => void
  setBusy: (busy: boolean) => void
  setConnectionStatus: (status: ConnectionStatus) => void
  setRecipientId: (id: string) => void
  setBankerTargetId: (id: string) => void
  applyServerState: (state: RoomState, playerId: string) => void
  clearRoom: () => void
  getSnapshot: () => RoomSnapshot
  restoreSnapshot: (snapshot: RoomSnapshot) => void
  applyOptimisticTransfer: (input: {
    fromPlayerId: string
    toPlayerId: string
    amount: number
  }) => void
  applyOptimisticBankerAction: (input: {
    targetPlayerId: string
    amount: number
    mode: 'give' | 'remove'
  }) => void
}

const emptySnapshot = (): RoomSnapshot => ({
  room: null,
  players: [],
  transfers: [],
  transactions: [],
})

export const useRoomStore = create<RoomStore>((set, get) => ({
  ...emptySnapshot(),
  connectionStatus: 'disconnected',
  busy: false,
  loading: true,
  error: '',
  recipientId: '',
  bankerTargetId: '',
  currentPlayerId: '',
  playerToken: '',

  resetForRoom: (playerId, playerToken) =>
    set({
      ...emptySnapshot(),
      currentPlayerId: playerId,
      playerToken,
      loading: true,
      error: '',
      busy: false,
      connectionStatus: 'disconnected',
      recipientId: '',
      bankerTargetId: '',
    }),

  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error, loading: false }),
  setBusy: (busy) => set({ busy }),
  setConnectionStatus: (connectionStatus) => set({ connectionStatus }),
  setRecipientId: (recipientId) => set({ recipientId }),
  setBankerTargetId: (bankerTargetId) => set({ bankerTargetId }),

  clearRoom: () =>
    set({
      ...emptySnapshot(),
      loading: false,
      error: '',
    }),

  getSnapshot: () => {
    const { room, players, transfers, transactions } = get()
    return {
      room: room ? structuredClone(room) : null,
      players: structuredClone(players),
      transfers: structuredClone(transfers),
      transactions: structuredClone(transactions),
    }
  },

  restoreSnapshot: (snapshot) => set({ ...snapshot }),

  applyServerState: (state, playerId) => {
    if (state.deleted) {
      set({
        ...emptySnapshot(),
        loading: false,
        error: '',
      })
      return
    }

    const playerIds = new Set(state.players.map((player) => player.id))
    const { recipientId, bankerTargetId } = get()

    set({
      room: state.room,
      players: state.players,
      transfers: state.transfers,
      transactions: state.transactions,
      error: '',
      loading: false,
      bankerTargetId:
        bankerTargetId && playerIds.has(bankerTargetId)
          ? bankerTargetId
          : (state.players[0]?.id ?? ''),
      recipientId:
        recipientId && (playerIds.has(recipientId) || recipientId.startsWith('__'))
          ? recipientId
          : (state.players.find((player) => player.id !== playerId)?.id ?? ''),
    })
  },

  applyOptimisticTransfer: ({ fromPlayerId, toPlayerId, amount }) => {
    const { room, players } = get()
    if (!room || amount <= 0) return

    const nextPlayers = players.map((player) => ({ ...player }))
    const from = nextPlayers.find((player) => player.id === fromPlayerId)
    if (!from) return

    if (toPlayerId === ALL_PLAYERS_RECIPIENT_ID) {
      const recipients = nextPlayers.filter((player) => player.id !== fromPlayerId)
      const total = amount * recipients.length
      if (from.balance < total) return
      for (const to of recipients) {
        from.balance -= amount
        to.balance += amount
      }
      set({ players: nextPlayers })
      return
    }

    if (from.balance < amount) return

    if (toPlayerId === BANK_RECIPIENT_ID) {
      from.balance -= amount
      set({
        players: nextPlayers,
        room: { ...room, bankBalance: room.bankBalance + amount },
      })
      return
    }

    const to = nextPlayers.find((player) => player.id === toPlayerId)
    if (!to || from.id === to.id) return
    from.balance -= amount
    to.balance += amount
    set({ players: nextPlayers })
  },

  applyOptimisticBankerAction: ({ targetPlayerId, amount, mode }) => {
    const { room, players } = get()
    if (!room || amount <= 0) return

    const nextPlayers = players.map((player) => ({ ...player }))
    const target = nextPlayers.find((player) => player.id === targetPlayerId)
    if (!target) return

    if (mode === 'give') {
      if (room.bankBalance < amount) return
      set({
        room: { ...room, bankBalance: room.bankBalance - amount },
        players: nextPlayers.map((player) =>
          player.id === targetPlayerId ? { ...player, balance: player.balance + amount } : player,
        ),
      })
      return
    }

    if (target.balance < amount) return
    set({
      room: { ...room, bankBalance: room.bankBalance + amount },
      players: nextPlayers.map((player) =>
        player.id === targetPlayerId ? { ...player, balance: player.balance - amount } : player,
      ),
    })
  },
}))
