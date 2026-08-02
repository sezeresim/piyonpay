import { useState } from 'react'
import type { FormEvent } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { ArrowLeftRight, Coins, History, Landmark, Minus, Plus, Users, Wallet } from 'lucide-react'
import { Field } from '@/components/field'
import { AvatarBubble, BankArt, MoneyStackArt } from '@/components/illustrations'
import { PageMotion } from '@/components/page-motion'
import { SendMoneyButton } from '@/components/send-money-button'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { formatMoney, formatMoneyValue, formatTime } from '@/lib/format'
import { MoneyAmount } from '@/components/money-amount'
import { useT } from '@/lib/i18n'
import { cn } from '@/lib/utils'
import {
  BANK_RECIPIENT_ID,
  ALL_PLAYERS_RECIPIENT_ID,
  type Player,
  type Room,
  type Transaction,
} from '@/types'

type GameViewProps = {
  room: Room
  players: Player[]
  currentPlayer: Player
  currentPlayerId: string
  otherPlayers: Player[]
  transactions: Transaction[]
  totalMoney: number
  busy: boolean
  recipientId: string
  setRecipientId: (value: string) => void
  bankerTargetId: string
  setBankerTargetId: (value: string) => void
  onRequestTransfer: (amount: number) => void
  onAdjustMoney: (amount: number, mode: 'give' | 'remove') => void
}

const QUICK_AMOUNTS = [50, 100, 500, 1000, 2000]

function isBankTransaction(transaction: Transaction) {
  return transaction.type === 'banker' || transaction.from === 'Bank' || transaction.to === 'Bank'
}

function HistoryTransactionRow({
  transaction,
  t,
}: {
  transaction: Transaction
  t: ReturnType<typeof useT>
}) {
  const bankTx = isBankTransaction(transaction)
  const toVault = bankTx && transaction.to === 'Bank'
  const bankLabel = t('game.bankCardTitle')
  const fromLabel = transaction.from === 'Bank' ? bankLabel : transaction.from
  const toLabel = transaction.to === 'Bank' ? bankLabel : transaction.to

  if (bankTx) {
    return (
      <div className="relative overflow-hidden rounded-2xl border border-amber-400/35 bg-gradient-to-br from-amber-500/15 via-card/90 to-card px-3.5 py-3.5">
        <div className="relative z-10 flex items-start justify-between gap-3">
          <div className="flex gap-3">
            <span
              className={cn(
                'grid size-10 shrink-0 place-items-center rounded-full',
                toVault ? 'bg-amber-500/25 text-amber-200' : 'bg-primary/20 text-primary',
              )}
            >
              <Landmark className="size-5" />
            </span>
            <div className="min-w-0">
              <div className="mb-0.5 flex flex-wrap items-center gap-1.5">
                <Badge className="h-5 border-0 bg-amber-400/20 px-1.5 text-[10px] font-semibold text-amber-200">
                  {t('game.historyBankBadge')}
                </Badge>
                <p className="text-xs font-medium text-amber-100/80">
                  {toVault ? t('game.historyToVault') : t('game.historyFromVault')}
                </p>
              </div>
              <p className="font-medium">
                {fromLabel}
                <span className="mx-1.5 text-muted-foreground">→</span>
                {toLabel}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="font-heading text-lg font-semibold text-amber-200">
              <MoneyAmount value={transaction.amount} iconClassName="text-amber-300" />
            </p>
            <p className="text-xs text-muted-foreground">{formatTime(transaction.createdAt)}</p>
          </div>
        </div>
        <div className="pointer-events-none absolute -right-3 -bottom-4 w-20 opacity-40">
          <BankArt />
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-start justify-between gap-3 rounded-2xl border border-border/50 bg-background/40 px-3 py-3">
      <div className="flex gap-3">
        <AvatarBubble name={transaction.to} size="sm" />
        <div>
          <p className="font-medium">
            {fromLabel} → {toLabel}
          </p>
          <p className="text-sm text-muted-foreground">{t('game.tabTransfer')}</p>
        </div>
      </div>
      <div className="text-right">
        <p className="font-semibold text-primary">
          <MoneyAmount value={transaction.amount} />
        </p>
        <p className="text-xs text-muted-foreground">{formatTime(transaction.createdAt)}</p>
      </div>
    </div>
  )
}

function PlayerPickCards({
  players,
  selectedId,
  currentPlayerId,
  onSelect,
  emptyLabel,
  youLabel,
  hostLabel,
  playerLabel,
}: {
  players: Player[]
  selectedId: string
  currentPlayerId: string
  onSelect: (id: string) => void
  emptyLabel: string
  youLabel: string
  hostLabel: string
  playerLabel: string
}) {
  if (players.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-border px-4 py-5 text-center text-sm text-muted-foreground">
        {emptyLabel}
      </p>
    )
  }

  return (
    <div className="grid gap-2">
      {players.map((player) => {
        const selected = player.id === selectedId
        return (
          <button
            key={player.id}
            type="button"
            onClick={() => onSelect(player.id)}
            className={cn(
              'flex items-center gap-3 rounded-2xl border px-3.5 py-3 text-left transition-colors',
              selected
                ? 'border-primary bg-primary/15 ring-2 ring-primary/25'
                : 'border-border/60 bg-card/70 hover:border-primary/40',
            )}
          >
            <AvatarBubble name={player.nickname} avatar={player.avatar} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">
                {player.nickname}
                {player.id === currentPlayerId ? ` · ${youLabel}` : ''}
              </p>
              <p className="truncate text-[11px] text-muted-foreground">
                {player.isBanker ? hostLabel : playerLabel}
              </p>
            </div>
            <p className="font-heading text-sm font-semibold">
              <MoneyAmount value={player.balance} />
            </p>
            <span
              className={cn(
                'size-4 rounded-full border-2',
                selected ? 'border-primary bg-primary' : 'border-muted-foreground/40',
              )}
            />
          </button>
        )
      })}
    </div>
  )
}

function TransferPanel({
  room,
  currentPlayer,
  otherPlayers,
  recipientId,
  setRecipientId,
  transferAmount,
  setTransferAmount,
  busy,
  onSubmit,
  t,
}: {
  room: Room
  currentPlayer: Player
  otherPlayers: Player[]
  recipientId: string
  setRecipientId: (value: string) => void
  transferAmount: number
  setTransferAmount: (value: number) => void
  busy: boolean
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  t: ReturnType<typeof useT>
}) {
  const payingEveryone = recipientId === ALL_PLAYERS_RECIPIENT_ID
  const everyoneTotal = transferAmount * otherPlayers.length
  const sendToBank = recipientId === BANK_RECIPIENT_ID

  return (
    <form
      className="space-y-4 rounded-[1.5rem] border border-border/50 bg-card/80 p-4"
      onSubmit={onSubmit}
    >
      <div>
        <h3 className="flex items-center gap-2 font-heading text-lg font-semibold">
          <ArrowLeftRight className="size-4 text-primary" />
          {t('game.sendMoney')}
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">{t('game.transferHintPay')}</p>
      </div>

      <div className="grid grid-cols-2 gap-2 rounded-2xl bg-muted/80 p-1.5">
        <button
          type="button"
          onClick={() => {
            if (
              sendToBank ||
              recipientId === BANK_RECIPIENT_ID ||
              recipientId === ALL_PLAYERS_RECIPIENT_ID
            ) {
              setRecipientId(otherPlayers[0]?.id ?? '')
            }
          }}
          className={cn(
            'h-11 rounded-xl text-sm font-semibold transition-colors',
            !sendToBank ? 'bg-primary text-primary-foreground' : 'text-muted-foreground',
          )}
        >
          {t('game.sendToPlayer')}
        </button>
        <button
          type="button"
          onClick={() => setRecipientId(BANK_RECIPIENT_ID)}
          className={cn(
            'h-11 rounded-xl text-sm font-semibold transition-colors',
            sendToBank ? 'bg-primary text-primary-foreground' : 'text-muted-foreground',
          )}
        >
          {t('game.sendToBankTab')}
        </button>
      </div>

      {!sendToBank && (
        <div className="space-y-2">
          {otherPlayers.length > 0 && (
            <button
              type="button"
              onClick={() => setRecipientId(ALL_PLAYERS_RECIPIENT_ID)}
              className={cn(
                'flex w-full items-center gap-3 rounded-2xl border px-3.5 py-3 text-left transition-colors',
                payingEveryone
                  ? 'border-[oklch(0.65_0.18_300)] bg-[oklch(0.35_0.12_300/0.35)] ring-2 ring-[oklch(0.65_0.18_300/0.35)]'
                  : 'border-border/60 bg-background/40 hover:border-[oklch(0.65_0.18_300/0.5)]',
              )}
            >
              <span className="grid size-11 place-items-center rounded-full bg-[oklch(0.45_0.16_300)]">
                <Users className="size-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-medium">{t('game.allCardTitle')}</p>
                <p className="text-xs text-muted-foreground">{t('game.allCardHint')}</p>
              </div>
              <p className="font-heading text-sm font-semibold">×{otherPlayers.length}</p>
            </button>
          )}
          <PlayerPickCards
            players={otherPlayers}
            selectedId={payingEveryone ? '' : recipientId}
            currentPlayerId={currentPlayer.id}
            onSelect={setRecipientId}
            emptyLabel={t('game.noOtherPlayers')}
            youLabel={t('common.you')}
            hostLabel={t('common.host')}
            playerLabel={t('common.player')}
          />
        </div>
      )}

      {sendToBank && (
        <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-primary/10 p-4">
          <div className="relative z-10">
            <p className="text-sm text-muted-foreground">{t('game.bankCardHint')}</p>
            <p className="font-heading text-2xl font-bold">
              <MoneyAmount value={room.bankBalance} />
            </p>
          </div>
          <div className="pointer-events-none absolute -right-2 -bottom-3 w-24 opacity-80">
            <BankArt />
          </div>
        </div>
      )}

      <Field label={t('game.amount')}>
        <Input
          className="h-14 rounded-2xl border-border/60 bg-background/60 text-center font-heading text-2xl font-bold"
          min={1}
          type="number"
          value={transferAmount}
          onChange={(event) => setTransferAmount(Number(event.target.value))}
        />
        <div className="mt-2 flex flex-wrap gap-2">
          {QUICK_AMOUNTS.map((amount) => (
            <button
              key={amount}
              type="button"
              onClick={() => setTransferAmount(amount)}
              className={cn(
                'inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors',
                transferAmount === amount
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground',
              )}
            >
              <Coins className="size-3" />
              {formatMoneyValue(amount)}
            </button>
          ))}
        </div>
      </Field>

      {payingEveryone && otherPlayers.length > 0 && (
        <p className="text-sm text-muted-foreground">
          {t('game.allTotalHint', {
            total: formatMoney(everyoneTotal),
            count: otherPlayers.length,
            amount: formatMoney(transferAmount),
          })}
        </p>
      )}

      <SendMoneyButton
        label={
          sendToBank ? t('game.payToBank') : payingEveryone ? t('game.payToAll') : t('game.payNow')
        }
        disabled={!recipientId || busy || (payingEveryone && otherPlayers.length === 0)}
        busy={busy}
        toBank={sendToBank}
        toAll={payingEveryone}
      />
    </form>
  )
}

export function GameView({
  room,
  players,
  currentPlayer,
  currentPlayerId,
  otherPlayers,
  transactions,
  totalMoney,
  busy,
  recipientId,
  setRecipientId,
  bankerTargetId,
  setBankerTargetId,
  onRequestTransfer,
  onAdjustMoney,
}: GameViewProps) {
  const reduceMotion = useReducedMotion()
  const t = useT()
  const [transferAmount, setTransferAmount] = useState(500)
  const [bankerAmount, setBankerAmount] = useState(100)
  const [bankerMode, setBankerMode] = useState<'give' | 'remove'>('give')
  const [historyFilter, setHistoryFilter] = useState<'all' | 'players' | 'bank'>('all')

  const requestTransfer = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    onRequestTransfer(transferAmount)
  }

  const adjustMoney = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    onAdjustMoney(bankerAmount, bankerMode)
  }

  const filteredHistory = transactions.filter((transaction) => {
    if (historyFilter === 'all') return true
    const bankTx = isBankTransaction(transaction)
    return historyFilter === 'bank' ? bankTx : !bankTx
  })

  const historyEmptyLabel =
    historyFilter === 'bank'
      ? t('game.historyBankEmpty')
      : historyFilter === 'players'
        ? t('game.historyPlayersEmpty')
        : t('game.noHistory')

  return (
    <PageMotion className="flex flex-1 flex-col gap-5">
      <section className="relative overflow-hidden rounded-[1.75rem] border border-primary/25 bg-gradient-to-br from-primary/20 via-card to-card p-5 shadow-[0_0_40px_oklch(0.9_0.2_120/0.12)]">
        <div className="relative z-10 flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <AvatarBubble name={currentPlayer.nickname} avatar={currentPlayer.avatar} size="lg" />
            <div>
              <p className="text-sm font-medium text-primary">{t('game.yourCash')}</p>
              <motion.p
                key={currentPlayer.balance}
                className="font-heading text-4xl font-bold tracking-tight sm:text-5xl"
                initial={reduceMotion ? false : { y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 320, damping: 24 }}
              >
                <MoneyAmount value={currentPlayer.balance} iconClassName="text-amber-300" />
              </motion.p>
              <p className="mt-1 text-sm text-muted-foreground">
                {currentPlayer.nickname}
                {currentPlayer.isBanker ? ` · ${t('common.host')}` : ''} · {room.code}
              </p>
            </div>
          </div>
          <Wallet className="size-8 text-primary/70" />
        </div>
        <div className="pointer-events-none absolute -right-3 -bottom-6 w-32 opacity-70">
          <MoneyStackArt />
        </div>

        {currentPlayer.isBanker && (
          <div className="relative z-10 mt-4 flex items-center justify-between rounded-2xl border border-border/40 bg-background/40 px-4 py-3 backdrop-blur-sm">
            <div>
              <p className="text-sm text-muted-foreground">{t('game.bankVault')}</p>
              <motion.p
                key={room.bankBalance}
                className="font-heading text-2xl font-semibold tracking-tight"
                initial={reduceMotion ? false : { y: 6, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
              >
                <MoneyAmount value={room.bankBalance} />
              </motion.p>
            </div>
            <Landmark className="size-6 text-primary/70" />
          </div>
        )}
      </section>

      <div className="flex gap-2">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="secondary" className="h-12 flex-1 rounded-2xl text-sm">
              <History data-icon="inline-start" />
              {t('game.history', { count: transactions.length })}
            </Button>
          </SheetTrigger>
          <SheetContent
            side="bottom"
            className="gap-0 overflow-hidden rounded-t-3xl border-border/60 bg-card p-0"
          >
            <SheetHeader className="shrink-0 border-b border-border/60 pr-12">
              <SheetTitle>{t('game.historyTitle')}</SheetTitle>
              <SheetDescription>{t('game.historyDesc')}</SheetDescription>
            </SheetHeader>
            <div className="shrink-0 border-b border-border/50 px-4 py-3">
              <div className="grid grid-cols-3 gap-1 rounded-2xl bg-muted/80 p-1">
                {(
                  [
                    ['all', t('game.historyFilterAll')],
                    ['players', t('game.historyFilterPlayers')],
                    ['bank', t('game.historyFilterBank')],
                  ] as const
                ).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setHistoryFilter(value)}
                    className={cn(
                      'h-9 rounded-xl text-xs font-semibold transition-colors',
                      historyFilter === value
                        ? value === 'bank'
                          ? 'bg-amber-400 text-amber-950'
                          : 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground',
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div className="max-h-[min(55dvh,26rem)] overflow-y-auto overscroll-contain px-4 py-4">
              <div className="space-y-3 pb-2">
                {filteredHistory.length === 0 && (
                  <p className="rounded-2xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
                    {historyEmptyLabel}
                  </p>
                )}
                {filteredHistory.map((transaction) => (
                  <HistoryTransactionRow key={transaction.id} transaction={transaction} t={t} />
                ))}
              </div>
            </div>
          </SheetContent>
        </Sheet>

        <Badge
          variant="outline"
          className="h-12 gap-1.5 rounded-2xl border-border/60 px-3 text-sm text-muted-foreground"
        >
          <Coins className="size-3.5 text-amber-300" />
          {t('game.total', { amount: formatMoneyValue(totalMoney) })}
        </Badge>
      </div>

      {currentPlayer.isBanker ? (
        <Tabs defaultValue="transfer" className="gap-4">
          <TabsList className="h-auto min-h-16 w-full gap-1 rounded-2xl bg-muted/80 p-1.5">
            <TabsTrigger
              value="transfer"
              className="h-auto flex-1 flex-col gap-1 rounded-xl px-1.5 py-2.5 text-[11px] leading-tight font-semibold data-active:bg-primary data-active:text-primary-foreground"
            >
              <ArrowLeftRight className="size-5 shrink-0" />
              {t('game.tabTransfer')}
            </TabsTrigger>
            <TabsTrigger
              value="bank"
              className="h-auto flex-1 flex-col gap-1 rounded-xl px-1.5 py-2.5 text-[11px] leading-tight font-semibold data-active:bg-primary data-active:text-primary-foreground"
            >
              <Landmark className="size-5 shrink-0" />
              {t('game.tabBank')}
            </TabsTrigger>
            <TabsTrigger
              value="players"
              className="h-auto flex-1 flex-col gap-1 rounded-xl px-1.5 py-2.5 text-[11px] leading-tight font-semibold data-active:bg-primary data-active:text-primary-foreground"
            >
              <Users className="size-5 shrink-0" />
              {t('game.tabPlayers')}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="transfer">
            <TransferPanel
              room={room}
              currentPlayer={currentPlayer}
              otherPlayers={otherPlayers}
              recipientId={recipientId}
              setRecipientId={setRecipientId}
              transferAmount={transferAmount}
              setTransferAmount={setTransferAmount}
              busy={busy}
              onSubmit={requestTransfer}
              t={t}
            />
          </TabsContent>

          <TabsContent value="bank">
            <form
              className="space-y-4 rounded-[1.5rem] border border-border/50 bg-card/80 p-4"
              onSubmit={adjustMoney}
            >
              <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-primary/10 p-4">
                <div className="relative z-10">
                  <p className="text-sm text-muted-foreground">{t('game.bankTitle')}</p>
                  <p className="font-heading text-3xl font-bold">
                    <MoneyAmount value={room.bankBalance} />
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {t('game.bankHint', { amount: formatMoney(room.bankBalance) })}
                  </p>
                </div>
                <div className="pointer-events-none absolute -right-2 -bottom-4 w-28 opacity-80">
                  <BankArt />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 rounded-2xl bg-muted/80 p-1.5">
                <Button
                  type="button"
                  variant={bankerMode === 'give' ? 'default' : 'ghost'}
                  className="h-11 rounded-xl"
                  onClick={() => setBankerMode('give')}
                >
                  <Plus data-icon="inline-start" />
                  {t('game.fromVault')}
                </Button>
                <Button
                  type="button"
                  variant={bankerMode === 'remove' ? 'default' : 'ghost'}
                  className="h-11 rounded-xl"
                  onClick={() => setBankerMode('remove')}
                >
                  <Minus data-icon="inline-start" />
                  {t('game.toVault')}
                </Button>
              </div>

              <PlayerPickCards
                players={players}
                selectedId={bankerTargetId}
                currentPlayerId={currentPlayerId}
                onSelect={setBankerTargetId}
                emptyLabel={t('game.noPlayers')}
                youLabel={t('common.you')}
                hostLabel={t('common.host')}
                playerLabel={t('common.player')}
              />

              <Field label={t('game.amount')}>
                <Input
                  className="h-12 rounded-2xl border-border/60 bg-background/60 text-base"
                  min={1}
                  type="number"
                  value={bankerAmount}
                  onChange={(event) => setBankerAmount(Number(event.target.value))}
                />
              </Field>

              <Button
                type="submit"
                className="h-14 w-full rounded-2xl text-base font-semibold"
                disabled={!bankerTargetId || busy}
              >
                {t('game.apply')}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="players" className="space-y-2">
            {players.map((player) => (
              <div
                key={player.id}
                className={cn(
                  'flex items-center justify-between rounded-2xl border border-border/50 bg-card/90 px-3.5 py-3',
                  player.id === currentPlayerId && 'ring-2 ring-primary/30',
                )}
              >
                <div className="flex items-center gap-3">
                  <AvatarBubble name={player.nickname} avatar={player.avatar} />
                  <p className="font-medium">
                    {player.nickname}
                    {player.isBanker ? ` · ${t('common.host')}` : ''}
                  </p>
                </div>
                <motion.strong
                  key={`${player.id}-${player.balance}`}
                  className="font-heading text-lg text-primary"
                  initial={reduceMotion ? false : { scale: 1.08 }}
                  animate={{ scale: 1 }}
                >
                  <MoneyAmount value={player.balance} />
                </motion.strong>
              </div>
            ))}
          </TabsContent>
        </Tabs>
      ) : (
        <TransferPanel
          room={room}
          currentPlayer={currentPlayer}
          otherPlayers={otherPlayers}
          recipientId={recipientId}
          setRecipientId={setRecipientId}
          transferAmount={transferAmount}
          setTransferAmount={setTransferAmount}
          busy={busy}
          onSubmit={requestTransfer}
          t={t}
        />
      )}
    </PageMotion>
  )
}
