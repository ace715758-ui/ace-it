'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Pause, Play, RotateCcw, Volume2, VolumeX } from 'lucide-react'
import { cn } from '@/lib/utils'
import { timerAudio } from '@/lib/audio/timer-sounds'

interface TimerDialProps {
  initialSeconds: number
  onTimeout?: () => void
  size?: number
  showControls?: boolean
  compact?: boolean
  className?: string
  onReset?: () => void
}

const RADIUS = 48
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

export default function TimerDial({
  initialSeconds,
  onTimeout,
  size = 40,
  showControls = true,
  compact = true,
  className,
  onReset,
}: TimerDialProps) {
  const [timeLeft, setTimeLeft] = useState<number>(initialSeconds)
  const [isPaused, setIsPaused] = useState<boolean>(false)
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true
    try {
      const saved = localStorage.getItem('ace_timer_sound')
      return saved !== null ? saved === 'true' : true
    } catch {
      return true
    }
  })

  const timeoutCalledRef = useRef<boolean>(false)
  const onTimeoutRef = useRef(onTimeout)
  const soundEnabledRef = useRef<boolean>(true)
  const prevSecondRef = useRef<number>(Math.ceil(initialSeconds))

  // Keep sound ref synced
  useEffect(() => {
    soundEnabledRef.current = soundEnabled
  }, [soundEnabled])

  // Keep ref up to date with latest onTimeout callback
  useEffect(() => {
    onTimeoutRef.current = onTimeout
  }, [onTimeout])

  // Unique ID for SVG definitions to prevent conflicts
  const rawId = React.useId()
  const uid = rawId.replace(/[^a-zA-Z0-9]/g, '')

  // Countdown timer interval
  useEffect(() => {
    if (initialSeconds <= 0) return

    timeoutCalledRef.current = false
    prevSecondRef.current = Math.ceil(initialSeconds)

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (isPaused) return prev
        const next = Math.max(0, prev - 0.1)
        if (next <= 0) {
          clearInterval(interval)
          if (!timeoutCalledRef.current) {
            timeoutCalledRef.current = true
            // Play time up chime if sound is enabled
            if (soundEnabledRef.current) {
              timerAudio.playTimeUpChime()
            }
            // Run onTimeout outside React's render/state-updater cycle to avoid setState during render
            setTimeout(() => {
              onTimeoutRef.current?.()
            }, 0)
          }
          return 0
        }
        return next
      })
    }, 100)

    return () => clearInterval(interval)
  }, [initialSeconds, isPaused])

  // Play audio tick during countdown: soft tick from 10s-6s, urgent tick from 5s-1s
  useEffect(() => {
    const currentSec = Math.ceil(timeLeft)
    if (currentSec !== prevSecondRef.current) {
      prevSecondRef.current = currentSec
      if (soundEnabled && !isPaused && currentSec > 0) {
        if (currentSec <= 5) {
          timerAudio.playTick(true)
        } else if (currentSec <= 10) {
          timerAudio.playTick(false)
        }
      }
    }
  }, [timeLeft, soundEnabled, isPaused])

  function toggleSound() {
    setSoundEnabled((prev) => {
      const next = !prev
      try {
        localStorage.setItem('ace_timer_sound', String(next))
      } catch {
        // Ignore
      }
      if (next) {
        timerAudio.playToggleSound()
      }
      return next
    })
  }

  const fraction = initialSeconds > 0 ? Math.max(0, Math.min(1, timeLeft / initialSeconds)) : 0
  const strokeDashoffset = CIRCUMFERENCE * (1 - fraction)

  // Dynamic gradient and alert colors
  let strokeGradientStart = '#6366F1' // Indigo
  let strokeGradientEnd = '#8B5CF6' // Violet
  let badgeTextColor = 'text-indigo-600 dark:text-indigo-400'
  let badgeBg = 'bg-indigo-50/80 dark:bg-indigo-950/40 border-indigo-200/80 dark:border-indigo-800/60'
  let isCritical = false

  if (timeLeft <= 5) {
    strokeGradientStart = '#EF4444' // Red
    strokeGradientEnd = '#F43F5E' // Rose
    badgeTextColor = 'text-rose-600 dark:text-rose-400'
    badgeBg = 'bg-rose-50 dark:bg-rose-950/50 border-rose-300 dark:border-rose-800/80'
    isCritical = true
  } else if (timeLeft <= 10) {
    strokeGradientStart = '#F59E0B' // Amber
    strokeGradientEnd = '#F97316' // Orange
    badgeTextColor = 'text-amber-600 dark:text-amber-400'
    badgeBg = 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800/60'
  }

  const displaySeconds = Math.ceil(timeLeft)

  // 1. Compact View (Inline Header Pill - Zero vertical overhead)
  if (compact) {
    return (
      <div
        className={cn(
          'inline-flex items-center gap-2 px-3 py-1.5 rounded-full border shadow-xs transition-all duration-300 select-none',
          badgeBg,
          isCritical && !isPaused ? 'animate-pulse' : '',
          className
        )}
        role="timer"
        aria-label={`Time remaining: ${displaySeconds} seconds`}
      >
        {/* Mini SVG Ring Indicator */}
        <div className="relative w-6 h-6 flex items-center justify-center shrink-0">
          <svg viewBox="0 0 108 108" className="w-full h-full -rotate-90 transform">
            <defs>
              <linearGradient id={`timerGradCompact_${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={strokeGradientStart} />
                <stop offset="100%" stopColor={strokeGradientEnd} />
              </linearGradient>
            </defs>
            <circle
              cx="54"
              cy="54"
              r={RADIUS}
              fill="none"
              stroke="currentColor"
              strokeWidth="14"
              className="text-slate-300 dark:text-slate-700/60"
            />
            <circle
              cx="54"
              cy="54"
              r={RADIUS}
              fill="none"
              stroke={`url(#timerGradCompact_${uid})`}
              strokeWidth="14"
              strokeLinecap="round"
              style={{
                strokeDasharray: CIRCUMFERENCE,
                strokeDashoffset,
                transition: 'stroke-dashoffset 0.1s linear',
              }}
            />
          </svg>
        </div>

        {/* Live Seconds Countdown */}
        <div className="flex items-baseline gap-1 font-mono">
          <span className={cn('text-sm font-extrabold tracking-tight', badgeTextColor)}>
            {displaySeconds}
          </span>
          <span className="text-[10px] font-semibold text-muted-foreground uppercase">
            {isPaused ? 'PAUSED' : 's'}
          </span>
        </div>

        {/* Quick Controls */}
        {showControls && (
          <div className="flex items-center gap-1 pl-1 border-l border-border/60">
            {/* Audio Toggle */}
            <button
              type="button"
              onClick={toggleSound}
              className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
              title={soundEnabled ? 'Mute timer sound' : 'Enable timer countdown & chime sounds'}
              aria-label={soundEnabled ? 'Mute timer sound' : 'Enable timer countdown & chime sounds'}
            >
              {soundEnabled ? (
                <Volume2 className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              ) : (
                <VolumeX className="w-3.5 h-3.5 text-muted-foreground/60" />
              )}
            </button>

            {/* Pause / Play */}
            <button
              type="button"
              onClick={() => setIsPaused((p) => !p)}
              className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
              title={isPaused ? 'Resume timer' : 'Pause timer'}
              aria-label={isPaused ? 'Resume timer' : 'Pause timer'}
            >
              {isPaused ? (
                <Play className="w-3.5 h-3.5 text-primary fill-primary" />
              ) : (
                <Pause className="w-3.5 h-3.5" />
              )}
            </button>

            {/* Reset */}
            {onReset && (
              <button
                type="button"
                onClick={() => {
                  setTimeLeft(initialSeconds)
                  timeoutCalledRef.current = false
                  onReset()
                }}
                className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                title="Reset timer for this question"
                aria-label="Reset timer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}
      </div>
    )
  }

  // 2. Large Dial View (If explicitly chosen)
  return (
    <div className={cn('flex flex-col items-center justify-center select-none', className)}>
      <div
        className={cn(
          'relative flex items-center justify-center transition-transform',
          isCritical && !isPaused ? 'animate-pulse scale-105' : ''
        )}
        style={{ width: size, height: size }}
        role="timer"
        aria-live="polite"
        aria-label={`Time remaining: ${displaySeconds} seconds`}
      >
        <svg
          viewBox="0 0 108 108"
          className="w-full h-full -rotate-90 transform transition-transform filter drop-shadow-sm"
        >
          <defs>
            <linearGradient id={`timerGradLarge_${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={strokeGradientStart} />
              <stop offset="100%" stopColor={strokeGradientEnd} />
            </linearGradient>
          </defs>

          <circle
            cx="54"
            cy="54"
            r={RADIUS}
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            className="text-muted/30 dark:text-slate-800"
          />
          <circle
            cx="54"
            cy="54"
            r={RADIUS}
            fill="none"
            stroke={`url(#timerGradLarge_${uid})`}
            strokeWidth="8"
            strokeLinecap="round"
            style={{
              strokeDasharray: CIRCUMFERENCE,
              strokeDashoffset,
              transition: 'stroke-dashoffset 0.1s linear, stroke 0.3s ease',
            }}
          />
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className={cn('text-xl font-black tracking-tight', badgeTextColor)}>
            {displaySeconds}
          </span>
          <span className="text-[9px] font-bold tracking-widest text-muted-foreground uppercase -mt-0.5">
            {isPaused ? 'PAUSED' : 'SEC'}
          </span>
        </div>
      </div>

      {showControls && (
        <div className="mt-2 flex items-center gap-1.5">
          <button
            type="button"
            onClick={toggleSound}
            className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground hover:text-foreground transition-all px-2.5 py-0.5 rounded-full bg-muted/40 hover:bg-muted border border-border/60"
            title={soundEnabled ? 'Mute timer sound' : 'Enable timer sound'}
          >
            {soundEnabled ? (
              <Volume2 className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
            ) : (
              <VolumeX className="w-3 h-3 text-muted-foreground" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setIsPaused((p) => !p)}
            className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground hover:text-foreground transition-all px-2.5 py-0.5 rounded-full bg-muted/40 hover:bg-muted border border-border/60"
          >
            {isPaused ? (
              <>
                <Play className="w-3 h-3 text-primary fill-primary" />
                <span>Resume</span>
              </>
            ) : (
              <>
                <Pause className="w-3 h-3 text-amber-500 fill-amber-500" />
                <span>Pause</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  )
}
