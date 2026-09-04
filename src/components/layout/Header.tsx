'use client'

import React, { useSyncExternalStore } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useTheme } from 'next-themes'
import {
  Bell,
  ChevronDown,
  LogOut,
  Moon,
  Plus,
  Settings,
  Sparkles,
  Sun,
  Target,
  User as UserIcon,
} from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/types/database'

interface HeaderProps {
  profile: Profile | null
}

const emptySubscribe = () => () => {}

export default function Header({ profile }: HeaderProps) {
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  )

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    toast.success('Logged out successfully.')
    router.push('/login')
    router.refresh()
  }

  const initials = profile?.full_name
    ? profile.full_name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'AM'

  const displayName = profile?.full_name || 'Ace Magbanua'
  const displayHeadline = profile?.headline || 'BSIT Student'

  return (
    <header className="hidden md:flex sticky top-0 z-30 h-16 items-center justify-between gap-4 border-b border-border/80 bg-background/90 px-6 backdrop-blur-md">
      {/* Left Contextual Breadcrumb & Status */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Study Workspace
          </span>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {/* Quick Action: New Quiz */}
        <Link href="/quiz/create">
          <Button
            size="sm"
            className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs h-9 px-4 shadow-sm shadow-indigo-600/25 transition-all hover:scale-[1.02]"
          >
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            Create Quiz
          </Button>
        </Link>

        {/* Instant Theme Toggle Button */}
        {mounted && (
          <button
            type="button"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors border border-border/60"
            aria-label="Toggle theme"
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-indigo-600" />
            )}
          </button>
        )}

        {/* Notification Bell */}
        <button
          type="button"
          onClick={() => toast.info('You are all caught up! No unread study reminders.')}
          className="relative p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors border border-border/60"
          aria-label="Notifications"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-background" />
        </button>

        {/* Vertical Separator */}
        <div className="h-6 w-px bg-border/80 mx-1" />

        {/* User Profile Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2.5 p-1.5 pr-2.5 rounded-xl hover:bg-muted/60 transition-colors outline-none cursor-pointer border border-transparent hover:border-border/60">
            <Avatar className="w-8 h-8 ring-2 ring-indigo-500/30">
              {profile?.avatar_url && (
                <AvatarImage src={profile.avatar_url} alt={displayName} />
              )}
              <AvatarFallback className="bg-indigo-600 text-white font-semibold text-xs">
                {initials}
              </AvatarFallback>
            </Avatar>

            <div className="text-left min-w-0">
              <p className="text-xs font-semibold text-foreground leading-tight truncate">
                {displayName}
              </p>
              <p className="text-[10px] text-muted-foreground leading-tight truncate">
                {displayHeadline}
              </p>
            </div>

            <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-56 p-1.5 rounded-2xl shadow-lg border-border/80">
            <DropdownMenuLabel className="font-normal px-2.5 py-2">
              <p className="text-sm font-bold text-foreground">{displayName}</p>
              <p className="text-xs text-muted-foreground truncate">{profile?.email || 'Student Account'}</p>
              <div className="flex items-center gap-1.5 mt-1">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 truncate">
                  {displayHeadline}
                </span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />

            <DropdownMenuItem
              onClick={() => router.push('/profile')}
              className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-medium cursor-pointer"
            >
              <UserIcon className="w-4 h-4 text-indigo-500" />
              <span>My Profile & Student ID</span>
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={() => router.push('/practice')}
              className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-medium cursor-pointer"
            >
              <Target className="w-4 h-4 text-sky-500" />
              <span>Practice Weak Areas</span>
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={() => router.push('/materials')}
              className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-medium cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>My Study Materials</span>
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={() => router.push('/settings')}
              className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-medium cursor-pointer"
            >
              <Settings className="w-4 h-4 text-slate-500" />
              <span>Account & Preferences</span>
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem
              onClick={handleLogout}
              className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-medium text-rose-600 dark:text-rose-400 cursor-pointer focus:text-rose-600 focus:bg-rose-50 dark:focus:bg-rose-950/40"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
