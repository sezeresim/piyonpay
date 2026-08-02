import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { io } from 'socket.io-client'
import { toast } from 'sonner'
import { api, SOCKET_BASE } from '@/lib/api'
import { localizeApiError } from '@/lib/api-error'
import { useT } from '@/lib/i18n'
import {
  clearSession,
  getSavedPlayerId,
  getSavedPlayerToken,
  getSavedRoomCode,
  saveSession,
} from '@/lib/session'
import type { Room, RoomState } from '@/types'

function isGoneError(message: string) {
  return (
    message === 'Room not found.' ||
    message === 'Room is closed.' ||
    message === 'Player not in room.'
  )
}

export function useRoomSession(roomCode: string) {
  const t = useT()
  const navigate = useNavigate()
  const code = roomCode.trim().toUpperCase()
  const [room, setRoom] = useState<Room | null>(null)
  const [players, setPlayers] = useState<RoomState['players']>([])
  const [transfers, setTransfers] = useState<RoomState['transfers']>([])
  const [transactions, setTransactions] = useState<RoomState['transactions']>([])
  const [currentPlayerId] = useState(() => getSavedPlayerId())
  const [playerToken] = useState(() => getSavedPlayerToken())
  const [busy, setBusy] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [recipientId, setRecipientId] = useState('')
  const [bankerTargetId, setBankerTargetId] = useState('')
  const socketToastAt = useRef(0)

  const applyState = useCallback(
    (state: RoomState, playerId = currentPlayerId) => {
      if (state.deleted) {
        clearSession()
        setRoom(null)
        setPlayers([])
        setLoading(false)
        return
      }

      setRoom(state.room)
      setPlayers(state.players)
      setTransfers(state.transfers)
      setTransactions(state.transactions)
      setError('')
      setLoading(false)

      const inRoom = Boolean(playerId && state.players.some((player) => player.id === playerId))
      const savedCode = getSavedRoomCode()
      // Only refresh session when we are a member of this exact room.
      if (inRoom && (!savedCode || savedCode === state.room.code)) {
        saveSession(playerId, state.room.code)
      }

      if (
        state.room.closed &&
        playerId &&
        !state.players.some((player) => player.id === playerId)
      ) {
        clearSession()
        toast.message(t('close.kicked'))
        navigate('/', { replace: true })
        return
      }

      const playerIds = new Set(state.players.map((player) => player.id))
      setBankerTargetId((current) =>
        current && playerIds.has(current) ? current : state.players[0]?.id || '',
      )
      setRecipientId((current) => {
        if (current && (playerIds.has(current) || current.startsWith('__'))) return current
        return state.players.find((player) => player.id !== playerId)?.id ?? ''
      })
    },
    [currentPlayerId, navigate, t],
  )

  const submit = useCallback(
    async (action: () => Promise<RoomState>, success: string) => {
      setBusy(true)
      try {
        const state = await action()
        applyState(state, currentPlayerId)
        if (state.deleted) {
          toast.success(success)
          navigate('/', { replace: true })
          return state
        }
        toast.success(success)
        return state
      } catch (err) {
        toast.error(
          err instanceof Error ? localizeApiError(err.message, t) : t('common.error'),
        )
        throw err
      } finally {
        setBusy(false)
      }
    },
    [applyState, currentPlayerId, navigate, t],
  )

  useEffect(() => {
    if (!code) return

    let stopped = false
    setLoading(true)
    const token = getSavedPlayerToken()

    if (!token) {
      setLoading(false)
      setError(t('room.notInRoom', { code }))
      return
    }

    // Wrong saved room — do not overwrite session with another code.
    const savedCode = getSavedRoomCode()
    if (savedCode && savedCode !== code) {
      setLoading(false)
      setError(t('room.notInRoom', { code }))
      return
    }

    const sync = async () => {
      try {
        const state = await api<RoomState>(
          `/api/rooms/${code}?token=${encodeURIComponent(token)}`,
        )
        if (!stopped) applyState(state)
      } catch (err) {
        if (stopped) return
        const message =
          err instanceof Error ? err.message : t('room.notFoundShort')
        setLoading(false)
        setError(localizeApiError(message, t))
        if (isGoneError(message)) {
          clearSession()
        }
      }
    }

    void sync()

    const socket = io(SOCKET_BASE || undefined, {
      path: '/socket.io',
      transports: ['polling', 'websocket'],
      withCredentials: false,
    })

    socket.on('connect', () => {
      socket.emit('room:join', { code, token })
    })
    socket.on('room:updated', (state: RoomState) => {
      if (!stopped) applyState(state)
    })
    socket.on('connect_error', () => {
      if (stopped) return
      const now = Date.now()
      if (now - socketToastAt.current < 8000) return
      socketToastAt.current = now
      toast.message(t('room.socketLost'))
    })

    return () => {
      stopped = true
      socket.disconnect()
    }
  }, [applyState, code, t])

  const currentPlayer = players.find((player) => player.id === currentPlayerId)
  const otherPlayers = players.filter((player) => player.id !== currentPlayerId)
  const totalMoney = players.reduce((sum, player) => sum + player.balance, 0)
  const canStart =
    Boolean(currentPlayer?.isBanker) &&
    !room?.closed &&
    players.length >= 2 &&
    players.every((player) => player.ready)

  return {
    room,
    players,
    transfers,
    transactions,
    currentPlayerId,
    playerToken,
    currentPlayer,
    otherPlayers,
    totalMoney,
    canStart,
    busy,
    loading,
    error,
    recipientId,
    setRecipientId,
    bankerTargetId,
    setBankerTargetId,
    submit,
  }
}
