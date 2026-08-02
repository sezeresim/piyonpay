import { useEffect, useRef } from 'react'
import { bindMoneySoundUnlock, playMoneyReceivedSound } from '@/lib/money-sound'

/**
 * Plays a cash sound only when this player's personal balance increases.
 * Bank vault changes are ignored (admin bank inflows stay silent).
 */
export function useMoneyReceivedSound(playerId: string | undefined, balance: number | undefined) {
  const previous = useRef<{ playerId: string; balance: number } | null>(null)

  useEffect(() => bindMoneySoundUnlock(), [])

  useEffect(() => {
    if (!playerId || typeof balance !== 'number') return

    const last = previous.current
    if (!last || last.playerId !== playerId) {
      previous.current = { playerId, balance }
      return
    }

    if (balance > last.balance) {
      void playMoneyReceivedSound()
    }

    previous.current = { playerId, balance }
  }, [playerId, balance])
}
