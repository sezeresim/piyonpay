import { Coins } from 'lucide-react'
import { formatMoneyValue } from '@/lib/format'
import { cn } from '@/lib/utils'

export function MoneyAmount({
  value,
  className,
  iconClassName,
}: {
  value: number
  className?: string
  iconClassName?: string
}) {
  return (
    <span className={cn('inline-flex items-center gap-1.5', className)}>
      <Coins className={cn('size-[0.95em] shrink-0 text-amber-300', iconClassName)} aria-hidden />
      <span>{formatMoneyValue(value)}</span>
    </span>
  )
}
