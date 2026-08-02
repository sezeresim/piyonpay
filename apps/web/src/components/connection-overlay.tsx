import { WifiOff } from 'lucide-react'
import { useT } from '@/lib/i18n'
import type { ConnectionStatus } from '@/stores/room-store'

type ConnectionOverlayProps = {
  status: ConnectionStatus
}

export function ConnectionOverlay({ status }: ConnectionOverlayProps) {
  const t = useT()
  if (status === 'connected') return null

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-background/70 px-6 backdrop-blur-sm"
      role="alertdialog"
      aria-live="assertive"
      aria-busy="true"
    >
      <div className="flex max-w-sm flex-col items-center gap-3 rounded-3xl border border-border/60 bg-card/95 px-6 py-8 text-center shadow-lg">
        <span className="grid size-12 place-items-center rounded-full bg-amber-500/15 text-amber-200">
          <WifiOff className="size-6" />
        </span>
        <p className="font-heading text-lg font-semibold">{t('room.reconnecting')}</p>
        <p className="text-sm text-muted-foreground">{t('room.reconnectingHint')}</p>
      </div>
    </div>
  )
}
