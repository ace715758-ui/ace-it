import React from 'react'
import { cn } from '@/lib/utils'

interface AceLogoProps {
  className?: string
  size?: number
  showGlow?: boolean
}

/**
 * Modern, bespoke geometric logo for Ace-It!
 * Features an illuminated Apex / Ace Monogram with multi-layer gradient depth.
 */
export default function AceLogo({
  className,
  size = 36,
  showGlow = false,
}: AceLogoProps) {
  const rawId = React.useId()
  const uid = rawId.replace(/[^a-zA-Z0-9]/g, '')

  return (
    <div
      className={cn('relative inline-flex items-center justify-center shrink-0 select-none', className)}
      style={{ width: size, height: size }}
    >
      {showGlow && (
        <div
          className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-indigo-500 via-primary to-cyan-400 opacity-40 blur-md pointer-events-none"
          aria-hidden="true"
        />
      )}

      <svg
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full relative z-10 transition-transform duration-200 group-hover:scale-105"
      >
        <defs>
          {/* Base Tile Gradient */}
          <linearGradient id={`aceTileGrad_${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1E1B4B" />
            <stop offset="50%" stopColor="#312E81" />
            <stop offset="100%" stopColor="#4338CA" />
          </linearGradient>

          {/* Primary Apex Beam */}
          <linearGradient id={`aceApexGrad1_${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38BDF8" />
            <stop offset="50%" stopColor="#818CF8" />
            <stop offset="100%" stopColor="#C084FC" />
          </linearGradient>

          {/* Secondary Facet Beam */}
          <linearGradient id={`aceApexGrad2_${uid}`} x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#6366F1" />
            <stop offset="100%" stopColor="#4F46E5" />
          </linearGradient>

          {/* Core Sparkle Glow */}
          <radialGradient id={`aceCoreGlow_${uid}`} cx="50%" cy="40%" r="50%">
            <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#38BDF8" stopOpacity="0" />
          </radialGradient>

          {/* Subtle Border Gradient */}
          <linearGradient id={`aceBorderGrad_${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#818CF8" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#38BDF8" stopOpacity="0.2" />
          </linearGradient>
        </defs>

        {/* Squircle Tile Container */}
        <rect
          x="1"
          y="1"
          width="38"
          height="38"
          rx="11"
          fill={`url(#aceTileGrad_${uid})`}
          stroke={`url(#aceBorderGrad_${uid})`}
          strokeWidth="1.2"
        />

        {/* Ambient Core Light */}
        <circle cx="20" cy="18" r="10" fill={`url(#aceCoreGlow_${uid})`} />

        {/* Modern Geometric "A" Apex Monogram */}
        {/* Left Ascent & Top Crest */}
        <path
          d="M20 8.5L9.5 28.5H15.5L18.2 23.2H21.8L24.5 28.5H30.5L20 8.5Z"
          fill={`url(#aceApexGrad1_${uid})`}
          fillRule="evenodd"
          clipRule="evenodd"
        />

        {/* Dynamic Forward Slash / Precision Cross-Bar */}
        <path
          d="M16.5 19.8L20 13L23.5 19.8H16.5Z"
          fill="#0F172A"
          fillOpacity="0.75"
        />

        {/* Radiant Spark Accent at the Apex Peak */}
        <circle cx="20" cy="9" r="1.6" fill="#F8FAFC" />
        <path
          d="M20 6.5V11.5M17.5 9H22.5"
          stroke="#38BDF8"
          strokeWidth="1"
          strokeLinecap="round"
        />
      </svg>
    </div>
  )
}
