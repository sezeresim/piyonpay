import { useCallback, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { io } from 'socket.io-client'
import { toast } from 'sonner'
import { useShallow } from 'zustand/react/shallow'
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
import { useRoomStore } from '@/stores/room-store'
import { SOCKET_EVENTS, type RoomState } from '@/types'

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
  const socketToastAt = useRef(0)
  const wasReconnecting = useRef(false)

  const {
    room,
    players,
    transfers,
    transactions,
    currentPlayerId,
    playerToken,
    busy,
    loading,
    error,
    recipientId,
    bankerTargetId,
    connectionStatus,
    setRecipientId,
    setBankerTargetId,
  } = useRoomStore(
    useShallow((state) => ({
      room: state.room,
      players: state.players,
      transfers: state.transfers,
      transactions: state.transactions,
      currentPlayerId: state.currentPlayerId,
      playerToken: state.playerToken,
      busy: state.busy,
      loading: state.loading,
      error: state.error,
      recipientId: state.recipientId,
      bankerTargetId: state.bankerTargetId,
      connectionStatus: state.connectionStatus,
      setRecipientId: state.setRecipientId,
      setBankerTargetId: state.setBankerTargetId,
    })),
  )

  const applyState = useCallback(
    (state: RoomState, playerId = useRoomStore.getState().currentPlayerId) => {
      if (state.deleted) {
        clearSession()
        useRoomStore.getState().clearRoom()
        return
      }

      useRoomStore.getState().applyServerState(state, playerId)

      const inRoom = Boolean(playerId && state.players.some((player) => player.id === playerId))
      const savedCode = getSavedRoomCode()
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
      }
    },
    [navigate, t],
  )

  const submit = useCallback(
    async (
      action: () => Promise<RoomState>,
      success: string,
      options?: { optimistic?: () => void },
    ) => {
      const store = useRoomStore.getState()
      if (store.connectionStatus !== 'connected') {
        toast.message(t('room.reconnecting'))
        throw new Error(t('room.reconnecting'))
      }

      const snapshot = store.getSnapshot()
      options?.optimistic?.()
      store.setBusy(true)
      try {
        const state = await action()
        applyState(state, store.currentPlayerId)
        if (state.deleted) {
          toast.success(success)
          navigate('/', { replace: true })
          return state
        }
        toast.success(success)
        return state
      } catch (err) {
        useRoomStore.getState().restoreSnapshot(snapshot)
        toast.error(err instanceof Error ? localizeApiError(err.message, t) : t('common.error'))
        throw err
      } finally {
        useRoomStore.getState().setBusy(false)
      }
    },
    [applyState, navigate, t],
  )

  useEffect(() => {
    if (!code) return

    let stopped = false
    const playerId = getSavedPlayerId()
    const token = getSavedPlayerToken()
    useRoomStore.getState().resetForRoom(playerId, token)

    if (!token) {
      useRoomStore.getState().setError(t('room.notInRoom', { code }))
      return
    }

    const savedCode = getSavedRoomCode()
    if (savedCode && savedCode !== code) {
      useRoomStore.getState().setError(t('room.notInRoom', { code }))
      return
    }

    const sync = async () => {
      try {
        const state = await api<RoomState>(`/api/rooms/${code}?token=${encodeURIComponent(token)}`)
        if (!stopped) applyState(state, playerId)
      } catch (err) {
        if (stopped) return
        const message = err instanceof Error ? err.message : t('room.notFoundShort')
        useRoomStore.getState().setError(localizeApiError(message, t))
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
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 800,
      reconnectionDelayMax: 5000,
    })

    const onRoomState = (state: RoomState) => {
      if (!stopped) applyState(state, playerId)
    }

    socket.on('connect', () => {
      if (stopped) return
      const store = useRoomStore.getState()
      store.setConnectionStatus('connected')
      if (wasReconnecting.current) {
        toast.success(t('room.reconnected'))
        wasReconnecting.current = false
      }
      socket.emit(SOCKET_EVENTS.ROOM_JOIN, { code, token })
    })

    socket.on('disconnect', () => {
      if (stopped) return
      wasReconnecting.current = true
      useRoomStore.getState().setConnectionStatus('reconnecting')
    })

    socket.on('reconnect_attempt', () => {
      if (stopped) return
      useRoomStore.getState().setConnectionStatus('reconnecting')
    })

    const stateEvents = [
      SOCKET_EVENTS.ROOM_UPDATED,
      SOCKET_EVENTS.PLAYER_JOINED,
      SOCKET_EVENTS.PLAYER_LEFT,
      SOCKET_EVENTS.PLAYER_READY,
      SOCKET_EVENTS.GAME_STARTED,
      SOCKET_EVENTS.TRANSFER_CREATED,
      SOCKET_EVENTS.BANK_UPDATED,
      SOCKET_EVENTS.ROOM_CLOSED,
      SOCKET_EVENTS.ROOM_DELETED,
    ] as const

    for (const event of stateEvents) {
      socket.on(event, onRoomState)
    }

    socket.on('connect_error', () => {
      if (stopped) return
      useRoomStore.getState().setConnectionStatus('reconnecting')
      const now = Date.now()
      if (now - socketToastAt.current < 8000) return
      socketToastAt.current = now
      toast.message(t('room.socketLost'))
    })

    return () => {
      stopped = true
      socket.disconnect()
      useRoomStore.getState().setConnectionStatus('disconnected')
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
  const actionsBlocked = busy || connectionStatus !== 'connected'

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
    busy: actionsBlocked,
    loading,
    error,
    recipientId,
    setRecipientId,
    bankerTargetId,
    setBankerTargetId,
    connectionStatus,
    submit,
  }
}
