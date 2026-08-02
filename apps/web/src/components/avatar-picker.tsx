import { AVATAR_OPTIONS, type AvatarId } from '@/lib/avatars'
import { useT } from '@/lib/i18n'
import { cn } from '@/lib/utils'

type AvatarPickerProps = {
  value: AvatarId
  onChange: (id: AvatarId) => void
}

export function AvatarPicker({ value, onChange }: AvatarPickerProps) {
  const t = useT()

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">{t('avatar.label')}</p>
      <p className="text-xs text-muted-foreground">{t('avatar.hint')}</p>
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
        {AVATAR_OPTIONS.map((option) => {
          const selected = option.id === value
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => onChange(option.id)}
              aria-pressed={selected}
              aria-label={option.id}
              className={cn(
                'grid aspect-square place-items-center rounded-2xl border p-1 text-5xl leading-none transition-all sm:p-1.5 sm:text-6xl',
                selected
                  ? 'border-primary bg-primary/20 ring-2 ring-primary/40 scale-[1.03]'
                  : 'border-border/60 bg-background/50 hover:border-primary/40 hover:bg-muted/60',
              )}
              style={
                selected
                  ? { boxShadow: `0 0 20px oklch(0.7 0.12 ${option.hue} / 0.35)` }
                  : undefined
              }
            >
              <span aria-hidden className="leading-none">
                {option.emoji}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
