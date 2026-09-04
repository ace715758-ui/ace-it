'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Pause, Play } from 'lucide-react'

interface TimerDialProps {
  initialSeconds: number
  onTimeout?: () => void
  size?: number
  showControls?: boolean
}

const RADIUS = 48
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

export default function TimerDial({
  initialSeconds,
  onTimeout,
  size = 110,
  showControls = true,
}: TimerDialProps) {
  const [timeLeft, setTimeLeft] = useState<number>(initialSeconds)
  const [isPaused, setIsPaused] = useState<boolean>(false)
  const timeoutCalledRef = useRef<boolean>(false)

  useEffect(() => {
    if (initialSeconds <= 0) return

    timeoutCalledRef.current = false
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (isPaused) return prev
        const next = Math.max(0, prev - 0.1)
        if (next <= 0) {
          clearInterval(interval)
          if (!timeoutCalledRef.current && onTimeout) {
            timeoutCalledRef.current = true
            onTimeout()
          }
          return 0
        }
        return next
      })
    }, 100)

    return () => clearInterval(interval)
  }, [initialSeconds, isPaused, onTimeout])

  const fraction = initialSeconds > 0 ? Math.max(0, Math.min(1, timeLeft / initialSeconds)) : 0
  const strokeDashoffset = CIRCUMFERENCE * (1 - fraction)

  // Gradient & color logic matching the Ace-It! modern palette
  let strokeGradientStart = '#6366F1' // Indigo
  let strokeGradientEnd = '#8B5CF6' // Violet
  let badgeColor = 'text-primary'
  let isCritical = false

  if (timeLeft <= 5) {
    strokeGradientStart = '#EF4444' // Red
    strokeGradientEnd = '#F43F5E' // Rose
    badgeColor = 'text-rose-500'
    isCritical = true
  } else if (timeLeft <= 10) {
    strokeGradientStart = '#F59E0B' // Amber
    strokeGradientEnd = '#F97316' // Orange
    badgeColor = 'text-amber-500'
  }

  const displaySeconds = Math.ceil(timeLeft)

  return (
    <div className="flex flex-col items-center justify-center select-none">
      <div
        className={`relative flex items-center justify-center transition-transform ${
          isCritical && !isPaused ? 'animate-pulse scale-105' : ''
        }`}
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
            <linearGradient id="timerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={strokeGradientStart} />
              <stop offset="100%" stopColor={strokeGradientEnd} />
            </linearGradient>
            <filter id="timerGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Background Track */}
          <circle
            cx="54"
            cy="54"
            r={RADIUS}
            fill="none"
            stroke="currentColor"
            strokeWidth="6"
            className="text-muted/30 dark:text-slate-800"
          />
          {/* Animated Countdown Progress */}
          <circle
            cx="54"
            cy="54"
            r={RADIUS}
            fill="none"
            stroke="url(#timerGradient)"
            strokeWidth="6"
            strokeLinecap="round"
            filter="url(#timerGlow)"
            style={{
              strokeDasharray: CIRCUMFERENCE,
              strokeDashoffset,
              transition: 'stroke-dashoffset 0.1s linear, stroke 0.3s ease',
            }}
          />
        </svg>

        {/* Center Countdown Display */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span
            className={`text-2xl font-black tracking-tight transition-colors ${badgeColor}`}
          >
            {displaySeconds}
          </span>
          <span className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase -mt-0.5">
            {isPaused ? 'PAUSED' : 'SEC'}
          </span>
        </div>
      </div>

      {/* Quick Pause/Resume Button */}
      {showControls && (
        <button
          type="button"
          onClick={() => setIsPaused((p) => !p)}
          className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-all px-2.5 py-1 rounded-full bg-muted/40 hover:bg-muted border border-border/60 hover:border-border"
          aria-label={isPaused ? 'Resume timer' : 'Pause timer'}
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
      )}
    </div>
  )
}
