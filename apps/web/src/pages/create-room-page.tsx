import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { AppShell } from '@/components/app-shell'
import { AvatarPicker } from '@/components/avatar-picker'
import { Field } from '@/components/field'
import { PageMotion } from '@/components/page-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { api } from '@/lib/api'
import { localizeApiError } from '@/lib/api-error'
import type { AvatarId } from '@/lib/avatars'
import { Coins } from 'lucide-react'
import { formatMoneyValue } from '@/lib/format'
import { useT } from '@/lib/i18n'
import { getSavedAvatar, saveAvatar, saveSession } from '@/lib/session'
import { cn } from '@/lib/utils'
import type { RoomState } from '@/types'

const START_CASH_OPTIONS = [1500, 2000, 3000]
const MAX_PLAYER_OPTIONS = [4, 6, 8, 10]

export function CreateRoomPage() {
  const navigate = useNavigate()
  const t = useT()
  const [nickname, setNickname] = useState(() => t('create.defaultNickname'))
  const [avatar, setAvatar] = useState<AvatarId>(() => getSavedAvatar())
  const [roomName, setRoomName] = useState(() => t('create.defaultRoomName'))
  const [pin, setPin] = useState('')
  const [initialBalance, setInitialBalance] = useState(1500)
  const [bankBalance, setBankBalance] = useState(30000)
  const [maxPlayers, setMaxPlayers] = useState(6)
  const [busy, setBusy] = useState(false)

  const createRoom = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (pin.length !== 4) {
      toast.error(t('error.pinFormat'))
      return
    }
    setBusy(true)
    try {
      const state = await api<RoomState>('/api/rooms', {
        method: 'POST',
        body: JSON.stringify({
          nickname,
          avatar,
          roomName,
          pin,
          initialBalance,
          bankBalance,
          maxPlayers,
        }),
      })
      saveAvatar(avatar)
      if (state.playerId && state.playerToken) {
        saveSession(state.playerId, state.room.code, {
          pin,
          token: state.playerToken,
        })
      }
      toast.success(t('create.success'))
      navigate(`/rooms/${state.room.code}`)
    } catch (error) {
      toast.error(error instanceof Error ? localizeApiError(error.message, t) : t('common.error'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <AppShell title={t('create.title')}>
      <PageMotion className="flex flex-1 flex-col gap-5">
        <form onSubmit={createRoom} className="flex flex-1 flex-col gap-4">
          <div className="space-y-4 rounded-[1.5rem] border border-border/50 bg-card/70 p-4">
            <AvatarPicker value={avatar} onChange={setAvatar} />
            <Field label={t('create.nickname')}>
              <Input
                className="h-12 rounded-2xl border-border/60 bg-background/60 text-base"
                value={nickname}
                onChange={(event) => setNickname(event.target.value)}
                required
              />
            </Field>
            <Field label={t('create.roomName')}>
              <Input
                className="h-12 rounded-2xl border-border/60 bg-background/60 text-base"
                value={roomName}
                onChange={(event) => setRoomName(event.target.value)}
                required
              />
            </Field>

            <Field label={t('create.pin')}>
              <Input
                className="h-14 rounded-2xl border-border/60 bg-background/60 text-center font-mono text-2xl tracking-[0.4em]"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={4}
                autoComplete="one-time-code"
                placeholder="••••"
                value={pin}
                onChange={(event) => setPin(event.target.value.replace(/\D/g, '').slice(0, 4))}
                required
              />
              <p className="mt-1.5 text-xs text-muted-foreground">{t('create.pinHint')}</p>
            </Field>

            <Field label={t('create.playerCash')}>
              <div className="flex flex-wrap gap-2">
                {START_CASH_OPTIONS.map((amount) => (
                  <button
                    key={amount}
                    type="button"
                    onClick={() => setInitialBalance(amount)}
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-medium transition-colors',
                      initialBalance === amount
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground hover:text-foreground',
                    )}
                  >
                    <Coins className="size-3.5" />
                    {formatMoneyValue(amount)}
                  </button>
                ))}
              </div>
              <Input
                className="mt-2 h-12 rounded-2xl border-border/60 bg-background/60 text-base"
                min={1}
                type="number"
                value={initialBalance}
                onChange={(event) => setInitialBalance(Number(event.target.value))}
                required
              />
            </Field>

            <Field label={t('create.bankVault')}>
              <Input
                className="h-12 rounded-2xl border-border/60 bg-background/60 text-base"
                min={0}
                type="number"
                value={bankBalance}
                onChange={(event) => setBankBalance(Number(event.target.value))}
                required
              />
            </Field>

            <Field label={t('create.maxPlayers')}>
              <div className="grid grid-cols-4 gap-2">
                {MAX_PLAYER_OPTIONS.map((count) => (
                  <button
                    key={count}
                    type="button"
                    onClick={() => setMaxPlayers(count)}
                    className={cn(
                      'h-12 rounded-2xl text-base font-semibold transition-colors',
                      maxPlayers === count
                        ? 'bg-primary text-primary-foreground shadow-[0_0_20px_oklch(0.9_0.2_120/0.3)]'
                        : 'bg-muted text-muted-foreground hover:text-foreground',
                    )}
                  >
                    {count}
                  </button>
                ))}
              </div>
            </Field>
          </div>

          <Button
            type="submit"
            className="mt-auto h-14 w-full rounded-2xl text-base font-semibold shadow-[0_0_28px_oklch(0.9_0.2_120/0.28)]"
            disabled={busy || pin.length !== 4}
          >
            {t('create.submit')}
          </Button>
        </form>
      </PageMotion>
    </AppShell>
  )
}
