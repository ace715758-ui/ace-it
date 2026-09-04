'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  BookOpen,
  HelpCircle,
  History,
  LayoutDashboard,
  LogOut,
  PlusCircle,
  Settings,
  Sparkles,
  Target,
} from 'lucide-react'
import AceLogo from '@/components/ui/AceLogo'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import type { Profile } from '@/types/database'

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/materials', icon: BookOpen, label: 'Materials' },
  { href: '/quiz/create', icon: PlusCircle, label: 'Create Quiz' },
  { href: '/practice', icon: Target, label: 'Practice Weak Areas' },
  { href: '/history', icon: History, label: 'Quiz History' },
]

const bottomNavItems = [
  { href: '/settings', icon: Settings, label: 'Settings' },
  { href: '#support', icon: HelpCircle, label: 'Help & Support', isAction: true },
]

interface SidebarProps {
  profile: Profile | null
}

export default function Sidebar({ profile }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()

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
    <aside className="hidden md:flex flex-col w-64 min-h-screen border-r border-border/80 bg-sidebar/95 backdrop-blur-sm select-none">
      {/* Ace-It! Logo & Tagline */}
      <div className="p-5 pb-4 border-b border-border/40">
        <Link href="/dashboard" className="flex items-center gap-3 group">
          <AceLogo size={38} showGlow />
          <div className="min-w-0">
            <span className="text-lg font-bold tracking-tight text-foreground group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
              Ace-It!
            </span>
            <p className="text-[11px] text-muted-foreground leading-tight mt-0.5 font-medium">
              Study Smarter. Practice Better.
            </p>
          </div>
        </Link>
      </div>

      {/* Main navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1.5" aria-label="Main navigation">
        <p className="px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70 mb-2">
          Menu
        </p>

        {navItems.map((item, idx) => {
          const isActive =
            item.href === '/dashboard'
              ? pathname === '/dashboard'
              : pathname.startsWith(item.href)

          return (
            <Link
              key={`${item.href}-${idx}`}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150',
                isActive
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/25 font-semibold'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
              )}
              aria-current={isActive ? 'page' : undefined}
            >
              <item.icon className={cn('w-4 h-4 shrink-0', isActive ? 'text-white' : 'text-muted-foreground')} />
              <span>{item.label}</span>
            </Link>
          )
        })}

        {/* Motivational Card */}
        <div className="pt-4 px-1">
          <div className="relative overflow-hidden rounded-2xl p-4 bg-gradient-to-br from-indigo-50 via-sky-50 to-indigo-100/50 dark:from-indigo-950/40 dark:via-slate-900/40 dark:to-indigo-900/30 border border-indigo-200/60 dark:border-indigo-800/40 shadow-sm">
            <div className="flex items-center gap-2 mb-2 text-indigo-600 dark:text-indigo-400">
              <Sparkles className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-wider">Daily Fuel</span>
            </div>
            <p className="text-xs font-medium text-slate-700 dark:text-slate-300 leading-relaxed italic">
              &ldquo;Small steps every day lead to big results. Keep going!&rdquo;
            </p>
            <div className="mt-3 flex items-center justify-between">
              <span className="text-[10px] font-semibold text-indigo-700 dark:text-indigo-300">Ace-It! Student</span>
              <Sparkles className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
            </div>
          </div>
        </div>
      </nav>

      {/* Bottom section */}
      <div className="px-3 py-2 border-t border-sidebar-border/60 space-y-1">
        {bottomNavItems.map((item) => {
          if (item.isAction) {
            return (
              <button
                key={item.label}
                type="button"
                onClick={() => toast.info('Need help? Contact support at support@ace-it.study or visit our help center.')}
                className="w-full flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
              >
                <item.icon className="w-4 h-4 shrink-0 text-muted-foreground" />
                <span>{item.label}</span>
              </button>
            )
          }

          const isActive = pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-sidebar-accent text-sidebar-primary'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
              )}
            >
              <item.icon className="w-4 h-4 shrink-0 text-muted-foreground" />
              <span>{item.label}</span>
            </Link>
          )
        })}

        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start px-3 text-sidebar-foreground hover:bg-rose-50 dark:hover:bg-rose-950/30 hover:text-destructive rounded-xl"
          onClick={handleLogout}
        >
          <LogOut className="w-4 h-4 mr-3 shrink-0" />
          Logout
        </Button>
      </div>

      {/* Profile footer with live headline */}
      <div className="p-3 border-t border-sidebar-border/60">
        <Link
          href="/profile"
          className="flex items-center gap-3 rounded-xl p-2 hover:bg-sidebar-accent transition-colors group"
        >
          <Avatar className="w-9 h-9 ring-2 ring-indigo-500/20 group-hover:ring-indigo-500/50 transition-all">
            {profile?.avatar_url && (
              <AvatarImage src={profile.avatar_url} alt={displayName} />
            )}
            <AvatarFallback className="bg-indigo-600 text-white text-xs font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-sidebar-foreground truncate leading-tight">
              {displayName}
            </p>
            <p className="text-[11px] text-muted-foreground truncate leading-tight mt-0.5">
              {displayHeadline}
            </p>
          </div>
        </Link>
      </div>
    </aside>
  )
}

