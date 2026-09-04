/**
 * Synthesized Web Audio sound effects for the Ace-It! Quiz Timer.
 * Uses zero external audio files, works offline with zero latency.
 */

class TimerAudio {
  private ctx: AudioContext | null = null

  constructor() {
    if (typeof window !== 'undefined') {
      const unlockAudio = () => {
        const ctx = this.getContext()
        if (ctx && ctx.state === 'suspended') {
          ctx.resume().catch(() => {})
        }
        window.removeEventListener('pointerdown', unlockAudio)
        window.removeEventListener('keydown', unlockAudio)
      }
      window.addEventListener('pointerdown', unlockAudio, { passive: true })
      window.addEventListener('keydown', unlockAudio, { passive: true })
    }
  }

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null
    if (!this.ctx || this.ctx.state === 'closed') {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      if (AudioCtx) {
        this.ctx = new AudioCtx()
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {})
    }
    return this.ctx
  }

  /**
   * Subtle modern tick sound during countdown
   */
  public playTick(isUrgent = false) {
    try {
      const ctx = this.getContext()
      if (!ctx) return

      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.type = isUrgent ? 'sine' : 'triangle'
      // 960Hz for urgent last 5 seconds countdown, 620Hz for standard soft tick
      const now = ctx.currentTime
      osc.frequency.setValueAtTime(isUrgent ? 960 : 620, now)

      const volume = isUrgent ? 0.12 : 0.05
      gain.gain.setValueAtTime(volume, now)
      gain.gain.exponentialRampToValueAtTime(0.001, now + (isUrgent ? 0.08 : 0.05))

      osc.connect(gain)
      gain.connect(ctx.destination)

      osc.start(now)
      osc.stop(now + (isUrgent ? 0.09 : 0.06))
    } catch {
      // Audio autoplay policy or not supported
    }
  }

  /**
   * Multi-tone harmonic chime when timer reaches 0
   */
  public playTimeUpChime() {
    try {
      const ctx = this.getContext()
      if (!ctx) return

      const now = ctx.currentTime
      // Descending warning chime: E5 (659Hz) -> C5 (523Hz) -> A4 (440Hz)
      const notes = [
        { freq: 659.25, time: 0, dur: 0.18, vol: 0.18 },
        { freq: 523.25, time: 0.12, dur: 0.22, vol: 0.16 },
        { freq: 440.0, time: 0.24, dur: 0.45, vol: 0.2 },
      ]

      notes.forEach(({ freq, time, dur, vol }) => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()

        osc.type = 'triangle'
        osc.frequency.setValueAtTime(freq, now + time)

        gain.gain.setValueAtTime(vol, now + time)
        gain.gain.exponentialRampToValueAtTime(0.001, now + time + dur)

        osc.connect(gain)
        gain.connect(ctx.destination)

        osc.start(now + time)
        osc.stop(now + time + dur)
      })
    } catch {
      // Audio autoplay policy or not supported
    }
  }

  /**
   * Gentle confirmation blip when toggling sound ON
   */
  public playToggleSound() {
    try {
      const ctx = this.getContext()
      if (!ctx) return
      const now = ctx.currentTime
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.type = 'sine'
      osc.frequency.setValueAtTime(784, now) // G5

      gain.gain.setValueAtTime(0.1, now)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12)

      osc.connect(gain)
      gain.connect(ctx.destination)

      osc.start(now)
      osc.stop(now + 0.13)
    } catch {
      // Ignore
    }
  }
}

export const timerAudio = new TimerAudio()
