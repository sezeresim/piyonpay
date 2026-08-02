import { cn } from '@/lib/utils'
import { PRODUCT_ICON_ALT, PRODUCT_ICON_SRC } from '@/lib/brand'
import { getAvatarOption } from '@/lib/avatars'

type BrandMarkProps = {
  className?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  /** Soft float animation for hero placements */
  animated?: boolean
}

const sizeClass = {
  sm: 'size-9',
  md: 'size-11',
  lg: 'size-16',
  xl: 'size-24',
} as const

export function BrandMark({ className, size = 'md', animated = false }: BrandMarkProps) {
  return (
    <span
      className={cn(
        'relative inline-grid shrink-0 place-items-center overflow-hidden rounded-2xl bg-black ring-1 ring-white/10',
        'shadow-[0_8px_28px_oklch(0.75_0.12_85/0.28)]',
        sizeClass[size],
        animated && 'brand-mark-float',
        className,
      )}
    >
      <img
        src={PRODUCT_ICON_SRC}
        alt={PRODUCT_ICON_ALT}
        width={256}
        height={256}
        draggable={false}
        className="size-full object-cover object-center select-none"
      />
    </span>
  )
}

export function MoneyStackArt({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 160 120" fill="none" className={cn('h-auto w-full', className)} aria-hidden>
      <ellipse cx="80" cy="108" rx="54" ry="8" fill="oklch(0.12 0.03 260 / 0.5)" />
      <rect x="28" y="58" width="104" height="36" rx="6" fill="oklch(0.72 0.16 145)" />
      <rect x="34" y="64" width="92" height="24" rx="4" fill="oklch(0.82 0.18 130)" />
      <circle cx="80" cy="76" r="10" fill="oklch(0.9 0.2 120)" />
      <path
        d="M76 76c0-2.2 1.8-4 4-4s4 1.8 4 4-1.8 4-4 4"
        fill="oklch(0.2 0.05 260)"
        opacity="0.35"
      />
      <circle cx="80" cy="76" r="3.5" fill="oklch(0.2 0.05 260)" />
      <rect x="36" y="42" width="88" height="28" rx="5" fill="oklch(0.78 0.15 140)" />
      <rect x="44" y="28" width="72" height="24" rx="5" fill="oklch(0.86 0.17 125)" />
      <circle
        cx="120"
        cy="36"
        r="14"
        fill="oklch(0.88 0.16 95)"
        stroke="oklch(0.75 0.12 85)"
        strokeWidth="2"
      />
      <circle cx="120" cy="36" r="5" fill="oklch(0.35 0.08 85)" />
      <circle
        cx="42"
        cy="48"
        r="10"
        fill="oklch(0.9 0.2 120)"
        stroke="oklch(0.75 0.15 120)"
        strokeWidth="2"
      />
      <circle cx="42" cy="48" r="3.5" fill="oklch(0.25 0.05 260)" />
    </svg>
  )
}

export function ChestArt({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 180 140" fill="none" className={cn('h-auto w-full', className)} aria-hidden>
      <ellipse cx="90" cy="128" rx="60" ry="8" fill="oklch(0.12 0.03 260 / 0.45)" />
      <path d="M30 70h120v48c0 8-6 14-14 14H44c-8 0-14-6-14-14V70Z" fill="oklch(0.55 0.12 55)" />
      <path d="M26 52c0-8 8-16 20-16h88c12 0 20 8 20 16v22H26V52Z" fill="oklch(0.62 0.14 55)" />
      <rect x="78" y="78" width="24" height="20" rx="4" fill="oklch(0.9 0.2 120)" />
      <circle cx="90" cy="88" r="4" fill="oklch(0.25 0.05 260)" />
      <circle cx="58" cy="42" r="12" fill="oklch(0.88 0.16 95)" />
      <circle cx="78" cy="34" r="10" fill="oklch(0.9 0.2 120)" />
      <circle cx="102" cy="38" r="11" fill="oklch(0.85 0.14 85)" />
      <rect
        x="112"
        y="28"
        width="28"
        height="18"
        rx="3"
        fill="oklch(0.78 0.15 145)"
        transform="rotate(12 126 37)"
      />
      <rect
        x="40"
        y="30"
        width="22"
        height="14"
        rx="2"
        fill="oklch(0.82 0.16 130)"
        transform="rotate(-18 51 37)"
      />
    </svg>
  )
}

export function CityArt({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 110" fill="none" className={cn('h-auto w-full', className)} aria-hidden>
      <ellipse cx="100" cy="102" rx="70" ry="6" fill="oklch(0.12 0.03 260 / 0.4)" />
      <rect x="30" y="48" width="36" height="50" rx="4" fill="oklch(0.45 0.08 250)" />
      <rect x="38" y="56" width="8" height="8" rx="1" fill="oklch(0.9 0.2 120 / 0.7)" />
      <rect x="50" y="56" width="8" height="8" rx="1" fill="oklch(0.9 0.2 120 / 0.45)" />
      <rect x="38" y="70" width="8" height="8" rx="1" fill="oklch(0.9 0.2 120 / 0.45)" />
      <rect x="50" y="70" width="8" height="8" rx="1" fill="oklch(0.9 0.2 120 / 0.7)" />
      <rect x="72" y="28" width="44" height="70" rx="4" fill="oklch(0.5 0.1 280)" />
      <rect x="82" y="38" width="10" height="10" rx="1" fill="oklch(0.9 0.2 120 / 0.8)" />
      <rect x="96" y="38" width="10" height="10" rx="1" fill="oklch(0.9 0.2 120 / 0.5)" />
      <rect x="82" y="54" width="10" height="10" rx="1" fill="oklch(0.9 0.2 120 / 0.5)" />
      <rect x="96" y="54" width="10" height="10" rx="1" fill="oklch(0.9 0.2 120 / 0.8)" />
      <rect x="82" y="70" width="10" height="10" rx="1" fill="oklch(0.9 0.2 120 / 0.65)" />
      <rect x="96" y="70" width="10" height="10" rx="1" fill="oklch(0.9 0.2 120 / 0.4)" />
      <rect x="124" y="42" width="40" height="56" rx="4" fill="oklch(0.42 0.09 230)" />
      <rect x="132" y="50" width="10" height="10" rx="1" fill="oklch(0.85 0.14 95 / 0.7)" />
      <rect x="146" y="50" width="10" height="10" rx="1" fill="oklch(0.85 0.14 95 / 0.45)" />
      <rect x="132" y="66" width="10" height="10" rx="1" fill="oklch(0.85 0.14 95 / 0.45)" />
      <rect x="146" y="66" width="10" height="10" rx="1" fill="oklch(0.85 0.14 95 / 0.7)" />
      <path d="M88 18h12l6 10H82l6-10Z" fill="oklch(0.9 0.2 120)" />
    </svg>
  )
}

export function BankArt({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 140 100" fill="none" className={cn('h-auto w-full', className)} aria-hidden>
      <ellipse cx="70" cy="92" rx="48" ry="6" fill="oklch(0.12 0.03 260 / 0.4)" />
      <path d="M20 40h100L70 18 20 40Z" fill="oklch(0.9 0.2 120)" />
      <rect x="28" y="40" width="84" height="44" rx="3" fill="oklch(0.55 0.06 260)" />
      <rect x="36" y="48" width="12" height="36" rx="2" fill="oklch(0.75 0.04 260)" />
      <rect x="56" y="48" width="12" height="36" rx="2" fill="oklch(0.75 0.04 260)" />
      <rect x="76" y="48" width="12" height="36" rx="2" fill="oklch(0.75 0.04 260)" />
      <rect x="96" y="48" width="12" height="36" rx="2" fill="oklch(0.75 0.04 260)" />
      <rect x="24" y="84" width="92" height="8" rx="2" fill="oklch(0.9 0.2 120)" />
    </svg>
  )
}

export function AvatarBubble({
  name,
  avatar,
  className,
  size = 'md',
}: {
  name: string
  avatar?: string | null
  className?: string
  size?: 'sm' | 'md' | 'lg'
}) {
  const option = getAvatarOption(avatar)
  const initial = name.trim().charAt(0).toUpperCase() || '?'
  const sizeClass =
    size === 'sm' ? 'size-9 text-base' : size === 'lg' ? 'size-14 text-2xl' : 'size-11 text-xl'

  return (
    <span
      className={cn(
        'inline-grid shrink-0 place-items-center rounded-full ring-2 ring-background',
        sizeClass,
        className,
      )}
      style={{ background: `oklch(0.42 0.08 ${option.hue})` }}
      title={name || option.id}
      aria-label={name || option.id}
    >
      <span className="leading-none" aria-hidden>
        {option.emoji}
      </span>
      <span className="sr-only">{initial}</span>
    </span>
  )
}
