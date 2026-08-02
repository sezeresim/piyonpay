let sharedContext: AudioContext | null = null
let unlockBound = false

function getAudioContext() {
  if (typeof window === 'undefined') return null
  const AudioCtx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!AudioCtx) return null
  if (!sharedContext || sharedContext.state === 'closed') {
    sharedContext = new AudioCtx()
  }
  return sharedContext
}

/** Call once after a user gesture so later money sounds can play (Safari/Chrome autoplay). */
export function unlockMoneySound() {
  const ctx = getAudioContext()
  if (!ctx) return

  void ctx.resume()

  // iOS often needs a real buffer kick to fully unlock audio.
  try {
    const buffer = ctx.createBuffer(1, 1, 22050)
    const source = ctx.createBufferSource()
    source.buffer = buffer
    source.connect(ctx.destination)
    source.start(0)
  } catch {
    // ignore
  }
}

export function bindMoneySoundUnlock() {
  if (typeof window === 'undefined' || unlockBound) return () => undefined
  unlockBound = true

  const unlock = () => {
    unlockMoneySound()
    window.removeEventListener('pointerdown', unlock)
    window.removeEventListener('touchstart', unlock)
    window.removeEventListener('keydown', unlock)
  }

  window.addEventListener('pointerdown', unlock, { passive: true })
  window.addEventListener('touchstart', unlock, { passive: true })
  window.addEventListener('keydown', unlock)

  return () => {
    window.removeEventListener('pointerdown', unlock)
    window.removeEventListener('touchstart', unlock)
    window.removeEventListener('keydown', unlock)
    unlockBound = false
  }
}

/** Short cash / coin chime for money received on this device. */
export async function playMoneyReceivedSound() {
  try {
    const ctx = getAudioContext()
    if (!ctx) return

    if (ctx.state === 'suspended') {
      await ctx.resume()
    }
    if (ctx.state !== 'running') return

    const now = ctx.currentTime
    const master = ctx.createGain()
    master.gain.setValueAtTime(0.001, now)
    master.gain.exponentialRampToValueAtTime(0.45, now + 0.02)
    master.gain.exponentialRampToValueAtTime(0.001, now + 0.55)
    master.connect(ctx.destination)

    const notes = [
      { freq: 987.8, type: 'triangle' as OscillatorType, at: 0 },
      { freq: 1318.5, type: 'sine' as OscillatorType, at: 0.08 },
      { freq: 1568, type: 'sine' as OscillatorType, at: 0.16 },
    ]

    for (const note of notes) {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      const start = now + note.at

      osc.type = note.type
      osc.frequency.setValueAtTime(note.freq, start)
      gain.gain.setValueAtTime(0.001, start)
      gain.gain.exponentialRampToValueAtTime(0.5, start + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.28)

      osc.connect(gain)
      gain.connect(master)
      osc.start(start)
      osc.stop(start + 0.3)
    }
  } catch {
    // Autoplay / audio restrictions — fail silently.
  }
}
