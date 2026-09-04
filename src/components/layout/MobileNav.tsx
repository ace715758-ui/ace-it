'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  BookOpen,
  History,
  LayoutDashboard,
  LogOut,
  Menu,
  PlusCircle,
  Settings,
  Target,
  User,
  X,
} from 'lucide-react'
import AceLogo from '@/components/ui/AceLogo'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import type { Profile } from '@/types/database'

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/materials', icon: BookOpen, label: 'Materials' },
  { href: '/quiz/create', icon: PlusCircle, label: 'Create Quiz' },
  { href: '/practice', icon: Target, label: 'Practice Weak Areas' },
  { href: '/history', icon: History, label: 'Quiz History' },
  { href: '/profile', icon: User, label: 'Profile' },
  { href: '/settings', icon: Settings, label: 'Settings' },
]

interface MobileNavProps {
  profile: Profile | null
}

export default function MobileNav({ profile }: MobileNavProps) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    toast.success('Logged out successfully.')
    router.push('/login')
    router.refresh()
    setOpen(false)
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
    <header className="md:hidden border-b border-border bg-background/95 backdrop-blur-md px-4 h-14 flex items-center justify-between sticky top-0 z-40">
      {/* Logo */}
      <Link href="/dashboard" className="flex items-center gap-2.5">
        <AceLogo size={30} />
        <span className="text-base font-bold tracking-tight">Ace-It!</span>
      </Link>

      <Button variant="ghost" size="icon" onClick={() => setOpen(true)} aria-label="Open menu">
        <Menu className="w-5 h-5" />
      </Button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="p-0 w-72">
          <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="p-4 flex items-center justify-between border-b">
              <Link
                href="/dashboard"
                className="flex items-center gap-2.5"
                onClick={() => setOpen(false)}
              >
                <AceLogo size={32} />
                <div>
                  <span className="text-base font-bold">Ace-It!</span>
                  <p className="text-[10px] text-muted-foreground leading-none">Study Smarter. Practice Better.</p>
                </div>
              </Link>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setOpen(false)}
                aria-label="Close menu"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Nav */}
            <nav className="flex-1 p-3 space-y-1" aria-label="Mobile navigation">
              {navItems.map((item, idx) => {
                const isActive =
                  item.href === '/dashboard'
                    ? pathname === '/dashboard'
                    : pathname.startsWith(item.href)

                return (
                  <Link
                    key={`${item.href}-${idx}`}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-indigo-600 text-white font-semibold'
                        : 'text-foreground hover:bg-accent'
                    )}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    <item.icon className="w-4 h-4 shrink-0" />
                    {item.label}
                  </Link>
                )
              })}
            </nav>

            <Separator />

            <div className="p-3">
              <Button
                variant="ghost"
                className="w-full justify-start text-destructive hover:text-destructive hover:bg-rose-50 dark:hover:bg-rose-950/30"
                onClick={handleLogout}
              >
                <LogOut className="w-4 h-4 mr-3" />
                Logout
              </Button>
            </div>

            {/* Profile */}
            <div className="p-3 border-t">
              <Link
                href="/profile"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent transition-colors"
              >
                <Avatar className="w-9 h-9 ring-2 ring-indigo-500/20">
                  {profile?.avatar_url && (
                    <AvatarImage src={profile.avatar_url} alt={displayName} />
                  )}
                  <AvatarFallback className="bg-indigo-600 text-white text-xs font-semibold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate leading-tight">
                    {displayName}
                  </p>
                  <p className="text-xs text-muted-foreground truncate leading-tight mt-0.5">
                    {displayHeadline}
                  </p>
                </div>
              </Link>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </header>
  )
}

