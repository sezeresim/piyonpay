import { Link, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { AppShell } from '@/components/app-shell'
import { GameView } from '@/components/game-view'
import { LobbyView } from '@/components/lobby-view'
import { PageMotion } from '@/components/page-motion'
import { Button } from '@/components/ui/button'
import { MoneyAmount } from '@/components/money-amount'
import { useMoneyReceivedSound } from '@/hooks/use-money-received-sound'
import { useRoomSession } from '@/hooks/use-room-session'
import { api } from '@/lib/api'
import { formatMoneyValue } from '@/lib/format'
import { useT } from '@/lib/i18n'
import { clearSession } from '@/lib/session'
import { BANK_RECIPIENT_ID, ALL_PLAYERS_RECIPIENT_ID, type RoomState } from '@/types'

function holdRemainingLabel(adminHoldUntil: string | null, label: string) {
  if (!adminHoldUntil) return label
  const ms = new Date(adminHoldUntil).getTime() - Date.now()
  if (ms <= 0) return label
  const minutes = Math.max(1, Math.ceil(ms / 60000))
  return `${label}: ~${minutes}m`
}

export function RoomPage() {
  const { code = '' } = useParams()
  const navigate = useNavigate()
  const t = useT()
  const session = useRoomSession(code)

  const {
    room,
    players,
    currentPlayer,
    currentPlayerId,
    playerToken,
    otherPlayers,
    transactions,
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
  } = session

  useMoneyReceivedSound(currentPlayer?.id, currentPlayer?.balance)

  const authBody = () => JSON.stringify({ token: playerToken })

  const leaveRoom = () => {
    if (!room || !playerToken) {
      clearSession()
      navigate('/', { replace: true })
      return
    }
    if (currentPlayer?.isBanker) {
      toast.error(t('error.bankerMustClose'))
      return
    }
    void submit(
      () =>
        api<RoomState>(`/api/rooms/${room.code}/leave`, {
          method: 'POST',
          body: authBody(),
        }),
      t('nav.leftRoom'),
    )
      .then(() => {
        clearSession()
        navigate('/', { replace: true })
      })
      .catch(() => {
        /* toast already shown */
      })
  }

  const closeGame = () => {
    if (!room || !playerToken) return
    if (!window.confirm(`${t('close.confirmTitle')}\n\n${t('close.confirmDesc')}`)) return
    void submit(
      () =>
        api<RoomState>(`/api/rooms/${room.code}/close`, {
          method: 'POST',
          body: authBody(),
        }),
      t('close.success'),
    )
  }

  const finalizeRoom = () => {
    if (!room || !playerToken) return
    if (!window.confirm(`${t('close.finalizeTitle')}\n\n${t('close.finalizeDesc')}`)) return
    void submit(
      () =>
        api<RoomState>(`/api/rooms/${room.code}/finalize`, {
          method: 'POST',
          body: authBody(),
        }),
      t('close.finalized'),
    ).then(() => {
      clearSession()
    })
  }

  if (loading) {
    return (
      <AppShell roomCode={code.toUpperCase()}>
        <PageMotion className="flex flex-1 items-center justify-center">
          <p className="text-muted-foreground">{t('room.loading')}</p>
        </PageMotion>
      </AppShell>
    )
  }

  if (error || !room) {
    return (
      <AppShell>
        <PageMotion className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
          <h1 className="font-heading text-2xl font-bold">{t('room.unavailable')}</h1>
          <p className="text-muted-foreground">{error || t('room.notFound')}</p>
          <div className="flex gap-2">
            <Button asChild variant="secondary">
              <Link to="/rooms/join" state={{ code: code.toUpperCase() }}>
                {t('room.joinThis')}
              </Link>
            </Button>
            <Button asChild>
              <Link to="/">{t('nav.home')}</Link>
            </Button>
          </div>
        </PageMotion>
      </AppShell>
    )
  }

  if (room.closed && currentPlayer?.isBanker) {
    return (
      <AppShell
        roomCode={room.code}
        onLeaveRoom={leaveRoom}
        onCloseGame={undefined}
        onFinalizeRoom={finalizeRoom}
        isBanker
        roomClosed
      >
        <PageMotion className="flex flex-1 flex-col gap-5">
          <div>
            <p className="text-sm font-medium text-amber-300">{t('close.banner')}</p>
            <h1 className="font-heading text-3xl font-bold tracking-tight">{room.name}</h1>
            <p className="mt-2 text-sm text-muted-foreground">{t('close.adminOnlyHint')}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {holdRemainingLabel(room.adminHoldUntil, t('close.holdRemaining'))}
            </p>
          </div>
          <div className="rounded-[1.5rem] border border-border/50 bg-card/80 p-4">
            <p className="text-sm text-muted-foreground">
              {t('close.summary', {
                balance: formatMoneyValue(currentPlayer.balance),
                vault: formatMoneyValue(room.bankBalance),
              })}
            </p>
            <p className="mt-3 font-heading text-2xl font-bold">
              <MoneyAmount value={currentPlayer.balance} />
            </p>
          </div>
          <Button
            type="button"
            variant="destructive"
            className="mt-auto h-14 w-full rounded-2xl"
            disabled={busy}
            onClick={finalizeRoom}
          >
            {t('close.finalize')}
          </Button>
        </PageMotion>
      </AppShell>
    )
  }

  if (!currentPlayer || room.closed) {
    return (
      <AppShell>
        <PageMotion className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
          <h1 className="font-heading text-2xl font-bold">
            {room.closed ? t('close.kickedTitle') : t('room.joinContinue')}
          </h1>
          <p className="text-muted-foreground">
            {room.closed ? t('close.kicked') : t('room.notInRoom', { code: room.code })}
          </p>
          <div className="flex gap-2">
            {!room.closed && (
              <Button asChild variant="secondary">
                <Link to="/rooms/join" state={{ code: room.code }}>
                  {t('room.joinThis')}
                </Link>
              </Button>
            )}
            <Button asChild>
              <Link to="/">{t('nav.home')}</Link>
            </Button>
          </div>
        </PageMotion>
      </AppShell>
    )
  }

  const toggleReady = () => {
    void submit(
      () =>
        api<RoomState>(`/api/rooms/${room.code}/ready`, {
          method: 'POST',
          body: JSON.stringify({
            token: playerToken,
            ready: !currentPlayer.ready,
          }),
        }),
      currentPlayer.ready ? t('room.readyOff') : t('room.readyOn'),
    )
  }

  const startGame = () => {
    void submit(
      () =>
        api<RoomState>(`/api/rooms/${room.code}/start`, {
          method: 'POST',
          body: authBody(),
        }),
      t('room.started'),
    )
  }

  return (
    <AppShell
      roomCode={room.code}
      onLeaveRoom={leaveRoom}
      onCloseGame={currentPlayer.isBanker ? closeGame : undefined}
      isBanker={currentPlayer.isBanker}
    >
      {!room.started ? (
        <LobbyView
          room={room}
          players={players}
          currentPlayer={currentPlayer}
          canStart={canStart}
          busy={busy}
          onToggleReady={toggleReady}
          onStartGame={startGame}
        />
      ) : (
        <GameView
          room={room}
          players={players}
          currentPlayer={currentPlayer}
          currentPlayerId={currentPlayerId}
          otherPlayers={otherPlayers}
          transactions={transactions}
          totalMoney={totalMoney}
          busy={busy}
          recipientId={recipientId}
          setRecipientId={setRecipientId}
          bankerTargetId={bankerTargetId}
          setBankerTargetId={setBankerTargetId}
          onRequestTransfer={(amount) => {
            if (!recipientId) return
            const toBank = recipientId === BANK_RECIPIENT_ID
            const toAll = recipientId === ALL_PLAYERS_RECIPIENT_ID
            void submit(
              () =>
                api<RoomState>(`/api/rooms/${room.code}/transfers`, {
                  method: 'POST',
                  body: JSON.stringify({
                    token: playerToken,
                    toPlayerId: recipientId,
                    amount,
                  }),
                }),
              toAll
                ? t('game.allPaid')
                : toBank
                  ? t('game.bankPaid')
                  : t('room.paymentSent'),
            )
          }}
          onAdjustMoney={(amount, mode) => {
            if (!bankerTargetId) return
            void submit(
              () =>
                api<RoomState>(`/api/rooms/${room.code}/banker-actions`, {
                  method: 'POST',
                  body: JSON.stringify({
                    token: playerToken,
                    targetPlayerId: bankerTargetId,
                    amount,
                    mode,
                  }),
                }),
              mode === 'give' ? t('room.moneyIssued') : t('room.moneyRemoved'),
            )
          }}
        />
      )}
    </AppShell>
  )
}
