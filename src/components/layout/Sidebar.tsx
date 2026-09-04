'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  BookOpen,
  Brain,
  History,
  LayoutDashboard,
  LogOut,
  Plus,
  Settings,
  User,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import type { Profile } from '@/types/database'

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/materials', icon: BookOpen, label: 'Materials' },
  { href: '/quiz/create', icon: Plus, label: 'Create Quiz' },
  { href: '/history', icon: History, label: 'Quiz History' },
]

const bottomItems = [
  { href: '/profile', icon: User, label: 'Profile' },
  { href: '/settings', icon: Settings, label: 'Settings' },
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
    : '?'

  return (
    <aside className="hidden md:flex flex-col w-64 min-h-screen border-r border-border bg-sidebar">
      {/* Logo */}
      <div className="p-6">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shrink-0">
            <Brain className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold text-sidebar-foreground">Ace It!</span>
        </Link>
      </div>

      {/* Main nav */}
      <nav className="flex-1 px-3 space-y-1" aria-label="Main navigation">
        {navItems.map((item) => {
          const isActive =
            item.href === '/dashboard'
              ? pathname === '/dashboard'
              : pathname.startsWith(item.href)

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-sidebar-accent text-sidebar-primary'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
              )}
              aria-current={isActive ? 'page' : undefined}
            >
              <item.icon className="w-4 h-4 shrink-0" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      <Separator className="mx-3 w-auto" />

      {/* Bottom nav */}
      <div className="px-3 py-3 space-y-1">
        {bottomItems.map((item) => {
          const isActive = pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-sidebar-accent text-sidebar-primary'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
              )}
              aria-current={isActive ? 'page' : undefined}
            >
              <item.icon className="w-4 h-4 shrink-0" />
              {item.label}
            </Link>
          )
        })}

        <Button
          variant="ghost"
          className="w-full justify-start px-3 text-sidebar-foreground hover:bg-sidebar-accent hover:text-destructive"
          onClick={handleLogout}
        >
          <LogOut className="w-4 h-4 mr-3 shrink-0" />
          Logout
        </Button>
      </div>

      {/* Profile footer */}
      <div className="p-3 border-t border-sidebar-border">
        <Link
          href="/profile"
          className="flex items-center gap-3 rounded-lg p-2 hover:bg-sidebar-accent transition-colors"
        >
          <Avatar className="w-8 h-8">
            <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="text-sm font-medium text-sidebar-foreground truncate">
              {profile?.full_name ?? 'Student'}
            </p>
            <p className="text-xs text-muted-foreground truncate">{profile?.email ?? ''}</p>
          </div>
        </Link>
      </div>
    </aside>
  )
}
