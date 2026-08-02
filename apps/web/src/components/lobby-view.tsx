import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { Check, Copy, Play, Share2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { AvatarBubble } from '@/components/illustrations'
import { PageMotion } from '@/components/page-motion'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { MoneyAmount } from '@/components/money-amount'
import { useT } from '@/lib/i18n'
import { getSavedRoomPin } from '@/lib/session'
import type { Player, Room } from '@/types'

type LobbyViewProps = {
  room: Room
  players: Player[]
  currentPlayer: Player
  canStart: boolean
  busy: boolean
  onToggleReady: () => void
  onStartGame: () => void
}

export function LobbyView({
  room,
  players,
  currentPlayer,
  canStart,
  busy,
  onToggleReady,
  onStartGame,
}: LobbyViewProps) {
  const reduceMotion = useReducedMotion()
  const t = useT()
  const [copied, setCopied] = useState(false)
  const savedPin = getSavedRoomPin(room.code)
  const showPin = currentPlayer.isBanker && /^\d{4}$/.test(savedPin)

  const copyCode = async () => {
    try {
      const text = showPin ? `${room.code} · ${savedPin}` : room.code
      await navigator.clipboard.writeText(text)
      setCopied(true)
      toast.success(t('lobby.copied'))
      window.setTimeout(() => setCopied(false), 1500)
    } catch {
      toast.error(t('common.error'))
    }
  }

  const shareInvite = async () => {
    const url = `${window.location.origin}/rooms/join`
    const text = t('lobby.shareText', {
      code: room.code,
      name: room.name,
      pin: showPin ? savedPin : '****',
    })
    try {
      if (navigator.share) {
        await navigator.share({ title: room.name, text, url })
      } else {
        await navigator.clipboard.writeText(`${text}\n${url}`)
        toast.success(t('lobby.copied'))
      }
    } catch {
      /* user cancelled share */
    }
  }

  const emptySlots = Math.max(0, room.maxPlayers - players.length)

  return (
    <PageMotion className="flex flex-1 flex-col gap-5">
      <div>
        <p className="text-sm font-medium text-primary">{t('lobby.title')}</p>
        <h1 className="font-heading text-3xl font-bold tracking-tight">{room.name}</h1>
      </div>

      <div className="rounded-[1.5rem] border border-border/50 bg-card/80 p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              {t('lobby.gameCode')}
            </p>
            <p className="mt-1 font-mono text-2xl font-bold tracking-[0.2em] text-primary">
              {room.code}
            </p>
            {showPin && (
              <p className="mt-2 font-mono text-lg font-semibold tracking-[0.35em] text-amber-300">
                <span className="mr-2 text-xs tracking-wide text-muted-foreground uppercase">
                  {t('lobby.pin')}
                </span>
                {savedPin}
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="secondary"
              size="icon-lg"
              className="size-11 rounded-2xl"
              onClick={() => void copyCode()}
              aria-label={t('lobby.copy')}
            >
              {copied ? <Check className="text-primary" /> : <Copy />}
            </Button>
            <Button
              type="button"
              className="h-11 rounded-2xl px-4"
              onClick={() => void shareInvite()}
            >
              <Share2 data-icon="inline-start" />
              {t('lobby.invite')}
            </Button>
          </div>
        </div>
        <p className="mt-3 text-sm text-muted-foreground">
          {t('lobby.codePlayers', {
            code: room.code,
            count: players.length,
            max: room.maxPlayers,
          })}
        </p>
      </div>

      <div className="space-y-2">
        <h2 className="font-heading text-lg font-semibold">{t('lobby.players')}</h2>
        <div className="grid gap-2">
          <AnimatePresence initial={false}>
            {players.map((player) => (
              <motion.article
                key={player.id}
                layout
                initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96 }}
                className="flex items-center justify-between gap-3 rounded-[1.25rem] border border-border/50 bg-card/90 px-3.5 py-3"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <AvatarBubble name={player.nickname} avatar={player.avatar} />
                  <div className="min-w-0">
                    <p className="truncate font-medium">
                      {player.nickname}
                      {player.id === currentPlayer.id ? ` · ${t('common.you')}` : ''}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {player.isBanker ? t('common.banker') : t('common.player')}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  {room.started === false && (
                    <Badge
                      className={
                        player.ready || player.isBanker
                          ? 'border-0 bg-primary/20 text-primary'
                          : 'border-0 bg-muted text-muted-foreground'
                      }
                    >
                      {(player.ready || player.isBanker) && <Check className="size-3.5" />}
                      {player.isBanker
                        ? t('common.host')
                        : player.ready
                          ? t('lobby.ready')
                          : t('lobby.waiting')}
                    </Badge>
                  )}
                  <p className="font-heading text-sm font-semibold">
                    <MoneyAmount value={player.balance} />
                  </p>
                </div>
              </motion.article>
            ))}
          </AnimatePresence>

          {Array.from({ length: emptySlots }).map((_, index) => (
            <div
              key={`empty-${index}`}
              className="flex items-center gap-3 rounded-[1.25rem] border border-dashed border-border/60 px-3.5 py-3"
            >
              <span className="size-11 rounded-full border border-dashed border-border/80" />
              <p className="text-sm text-muted-foreground">{t('lobby.emptySlot')}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="sticky bottom-0 mt-auto space-y-2 border-t border-border/40 bg-background/90 py-3 backdrop-blur-md">
        {!canStart && currentPlayer.isBanker && (
          <p className="text-center text-sm text-muted-foreground">{t('lobby.needReady')}</p>
        )}
        {!currentPlayer.isBanker && (
          <Button
            type="button"
            className="h-14 w-full rounded-2xl text-base font-semibold"
            variant={currentPlayer.ready ? 'secondary' : 'default'}
            onClick={onToggleReady}
            disabled={busy}
          >
            {currentPlayer.ready ? t('lobby.cancelReady') : t('lobby.imReady')}
          </Button>
        )}
        {currentPlayer.isBanker && (
          <Button
            type="button"
            className="h-14 w-full rounded-2xl text-base font-semibold shadow-[0_0_28px_oklch(0.9_0.2_120/0.28)]"
            onClick={onStartGame}
            disabled={!canStart || busy}
          >
            <Play data-icon="inline-start" />
            {t('lobby.start')}
          </Button>
        )}
      </div>
    </PageMotion>
  )
}
