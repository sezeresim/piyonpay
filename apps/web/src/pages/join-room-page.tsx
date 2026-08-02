import { useState } from 'react'
import type { FormEvent } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { AppShell } from '@/components/app-shell'
import { AvatarPicker } from '@/components/avatar-picker'
import { Field } from '@/components/field'
import { ChestArt } from '@/components/illustrations'
import { PageMotion } from '@/components/page-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { api } from '@/lib/api'
import { localizeApiError } from '@/lib/api-error'
import type { AvatarId } from '@/lib/avatars'
import { useT } from '@/lib/i18n'
import { getSavedAvatar, saveAvatar, saveSession } from '@/lib/session'
import type { RoomState } from '@/types'

export function JoinRoomPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const t = useT()
  const presetCode =
    typeof location.state === 'object' &&
    location.state &&
    'code' in location.state &&
    typeof location.state.code === 'string'
      ? location.state.code
      : ''
  const [nickname, setNickname] = useState(() => t('join.defaultNickname'))
  const [avatar, setAvatar] = useState<AvatarId>(() => getSavedAvatar())
  const [joinCode, setJoinCode] = useState(presetCode)
  const [pin, setPin] = useState('')
  const [busy, setBusy] = useState(false)

  const joinRoom = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const code = joinCode.trim().toUpperCase()
    if (pin.length !== 4) {
      toast.error(t('error.pinFormat'))
      return
    }
    setBusy(true)
    try {
      const state = await api<RoomState>(`/api/rooms/${code}/join`, {
        method: 'POST',
        body: JSON.stringify({ nickname, avatar, pin }),
      })
      saveAvatar(avatar)
      if (state.playerId && state.playerToken) {
        saveSession(state.playerId, state.room.code, {
          pin,
          token: state.playerToken,
        })
      }
      toast.success(t('join.success'))
      navigate(`/rooms/${state.room.code}`)
    } catch (error) {
      toast.error(error instanceof Error ? localizeApiError(error.message, t) : t('common.error'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <AppShell title={t('join.title')}>
      <PageMotion className="flex flex-1 flex-col gap-5">
        <form onSubmit={joinRoom} className="flex flex-1 flex-col gap-5">
          <div className="space-y-4 rounded-[1.5rem] border border-border/50 bg-card/70 p-4">
            <AvatarPicker value={avatar} onChange={setAvatar} />
            <Field label={t('join.nickname')}>
              <Input
                className="h-12 rounded-2xl border-border/60 bg-background/60 text-base"
                value={nickname}
                onChange={(event) => setNickname(event.target.value)}
                required
              />
            </Field>
            <Field label={t('join.code')}>
              <Input
                className="h-16 rounded-2xl border-border/60 bg-background/60 text-center font-mono text-3xl tracking-[0.35em] uppercase"
                maxLength={6}
                value={joinCode}
                onChange={(event) => setJoinCode(event.target.value.toUpperCase())}
                placeholder="7X2K9B"
                required
              />
            </Field>
            <Field label={t('join.pin')}>
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
              <p className="mt-1.5 text-xs text-muted-foreground">{t('join.pinHint')}</p>
            </Field>
          </div>

          <div className="mx-auto w-full max-w-[220px] py-2">
            <ChestArt />
          </div>

          <Button
            type="submit"
            className="mt-auto h-14 w-full rounded-2xl text-base font-semibold shadow-[0_0_28px_oklch(0.9_0.2_120/0.28)]"
            disabled={busy || joinCode.trim().length < 6 || pin.length !== 4}
          >
            {t('join.submit')}
          </Button>
        </form>
      </PageMotion>
    </AppShell>
  )
}
