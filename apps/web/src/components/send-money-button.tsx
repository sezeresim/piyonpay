import { useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { Banknote, Sparkles, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const COINS = [
  { x: -48, y: -56, rotate: -28, delay: 0 },
  { x: 8, y: -72, rotate: 12, delay: 0.04 },
  { x: 52, y: -48, rotate: 36, delay: 0.08 },
  { x: -28, y: -36, rotate: -12, delay: 0.06 },
  { x: 36, y: -64, rotate: 22, delay: 0.1 },
  { x: -8, y: -80, rotate: 8, delay: 0.02 },
]

type SendMoneyButtonProps = {
  label: string
  disabled?: boolean
  busy?: boolean
  toBank?: boolean
  toAll?: boolean
}

export function SendMoneyButton({
  label,
  disabled = false,
  busy = false,
  toBank = false,
  toAll = false,
}: SendMoneyButtonProps) {
  const reduceMotion = useReducedMotion()
  const [burstId, setBurstId] = useState(0)
  const locked = disabled || busy

  const fireBurst = () => {
    if (locked || reduceMotion) return
    setBurstId((current) => current + 1)
  }

  const coinClass = toBank
    ? 'bg-amber-400 text-amber-950'
    : toAll
      ? 'bg-[oklch(0.7_0.18_300)] text-[oklch(0.2_0.05_300)]'
      : 'bg-primary text-primary-foreground'

  return (
    <motion.div
      className="relative w-full"
      whileHover={locked || reduceMotion ? undefined : { scale: 1.015 }}
      whileTap={locked || reduceMotion ? undefined : { scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 420, damping: 22 }}
    >
      <AnimatePresence>
        {burstId > 0 &&
          !reduceMotion &&
          COINS.map((coin, index) => (
            <motion.span
              key={`${burstId}-${index}`}
              className={cn(
                'pointer-events-none absolute top-1/2 left-1/2 z-10 grid size-7 place-items-center rounded-full text-xs font-bold shadow-md',
                coinClass,
              )}
              initial={{ opacity: 0, x: 0, y: 0, scale: 0.4, rotate: 0 }}
              animate={{
                opacity: [0, 1, 1, 0],
                x: coin.x,
                y: coin.y,
                scale: [0.4, 1.15, 1, 0.7],
                rotate: coin.rotate,
              }}
              exit={{ opacity: 0 }}
              transition={{
                duration: 0.7,
                delay: coin.delay,
                ease: [0.2, 0.8, 0.2, 1],
              }}
            >
              🪙
            </motion.span>
          ))}
      </AnimatePresence>

      <Button
        type="submit"
        disabled={locked}
        onClick={fireBurst}
        className={cn(
          'relative h-14 w-full overflow-hidden rounded-2xl text-base font-semibold shadow-[0_0_24px_oklch(0.9_0.2_120/0.25)]',
          !locked &&
            (toBank
              ? 'bg-amber-500 text-amber-950 hover:bg-amber-400 shadow-[0_0_24px_oklch(0.8_0.14_85/0.35)]'
              : toAll
                ? 'bg-[oklch(0.55_0.2_300)] text-white hover:bg-[oklch(0.6_0.2_300)] shadow-[0_0_24px_oklch(0.55_0.2_300/0.4)]'
                : undefined),
        )}
      >
        {!locked && !reduceMotion && (
          <motion.span
            aria-hidden
            className="pointer-events-none absolute inset-y-0 w-1/3 -skew-x-12 bg-gradient-to-r from-transparent via-white/25 to-transparent"
            initial={{ left: '-40%' }}
            animate={{ left: ['-40%', '140%'] }}
            transition={{
              duration: 1.6,
              repeat: Infinity,
              repeatDelay: 1.8,
              ease: 'easeInOut',
            }}
          />
        )}

        <motion.span
          className="relative z-10 inline-flex items-center gap-2"
          animate={
            locked || reduceMotion
              ? undefined
              : {
                  y: [0, -1.5, 0],
                }
          }
          transition={{
            duration: 1.4,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          <motion.span
            animate={
              locked || reduceMotion
                ? undefined
                : { rotate: [0, -12, 10, 0], scale: [1, 1.12, 1] }
            }
            transition={{
              duration: 0.9,
              repeat: Infinity,
              repeatDelay: 1.2,
            }}
          >
            {toBank ? (
              <Banknote className="size-4" />
            ) : toAll ? (
              <Users className="size-4" />
            ) : (
              <Sparkles className="size-4" />
            )}
          </motion.span>
          {label}
        </motion.span>
      </Button>
    </motion.div>
  )
}
