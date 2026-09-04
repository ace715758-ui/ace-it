'use client'

import { useState, useSyncExternalStore } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useTheme } from 'next-themes'
import {
  Bell,
  Check,
  ChevronRight,
  Eye,
  EyeOff,
  GraduationCap,
  KeyRound,
  Laptop,
  Loader2,
  Lock,
  LogOut,
  Moon,
  Paintbrush,
  Shield,
  Sun,
  Trash2,
  User,
  Volume2,
} from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/types/database'

interface SettingsClientProps {
  user: {
    id: string
    email: string
    createdAt?: string
  }
  profile: Profile | null
}

type TabType = 'account' | 'security' | 'notifications' | 'appearance' | 'danger'

const emptySubscribe = () => () => {}

export default function SettingsClient({ user, profile }: SettingsClientProps) {
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  )
  const [activeTab, setActiveTab] = useState<TabType>('account')

  // Password state
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [changingPassword, setChangingPassword] = useState(false)

  // Notification toggles initialized from localStorage if available
  const [studyReminders, setStudyReminders] = useState(() => {
    if (typeof window !== 'undefined') {
      const v = localStorage.getItem('aceit_pref_study_reminders')
      return v !== null ? v === 'true' : true
    }
    return true
  })
  const [quizScoreEmails, setQuizScoreEmails] = useState(() => {
    if (typeof window !== 'undefined') {
      const v = localStorage.getItem('aceit_pref_score_emails')
      return v !== null ? v === 'true' : true
    }
    return true
  })
  const [weeklyDigest, setWeeklyDigest] = useState(() => {
    if (typeof window !== 'undefined') {
      const v = localStorage.getItem('aceit_pref_weekly_digest')
      return v !== null ? v === 'true' : false
    }
    return false
  })
  const [soundEffects, setSoundEffects] = useState(() => {
    if (typeof window !== 'undefined') {
      const v = localStorage.getItem('aceit_pref_sound_effects')
      return v !== null ? v === 'true' : true
    }
    return true
  })

  // Danger zone state
  const [isClearingHistory, setIsClearingHistory] = useState(false)
  const [showConfirmClear, setShowConfirmClear] = useState(false)

  function updateNotificationPref(key: string, value: boolean, setter: (v: boolean) => void) {
    setter(value)
    if (typeof window !== 'undefined') {
      localStorage.setItem(`aceit_pref_${key}`, String(value))
    }
    toast.success('Preference updated')
  }

  // Password strength calculation
  const hasMinLength = newPassword.length >= 8
  const hasNumber = /\d/.test(newPassword)
  const hasMixedCase = /[a-z]/.test(newPassword) && /[A-Z]/.test(newPassword)
  const hasSpecial = /[^A-Za-z0-9]/.test(newPassword)
  const strengthScore = [hasMinLength, hasNumber, hasMixedCase, hasSpecial].filter(Boolean).length

  let strengthLabel = 'Weak'
  let strengthColor = 'bg-rose-500'
  if (strengthScore === 2) {
    strengthLabel = 'Fair'
    strengthColor = 'bg-amber-500'
  } else if (strengthScore === 3) {
    strengthLabel = 'Good'
    strengthColor = 'bg-sky-500'
  } else if (strengthScore === 4) {
    strengthLabel = 'Strong'
    strengthColor = 'bg-emerald-500'
  }

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault()
    if (!hasMinLength) {
      toast.error('Password must be at least 8 characters.')
      return
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords don't match.")
      return
    }
    setChangingPassword(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.updateUser({ password: newPassword })
      if (error) {
        toast.error(error.message)
        return
      }
      toast.success('Password updated successfully!')
      setNewPassword('')
      setConfirmPassword('')
    } catch {
      toast.error('Something went wrong. Please try again.')
    } finally {
      setChangingPassword(false)
    }
  }

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  async function handleClearHistory() {
    setIsClearingHistory(true)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('quiz_attempts')
        .delete()
        .eq('user_id', user.id)

      if (error) {
        toast.error(error.message)
      } else {
        toast.success('Quiz attempt history has been cleared.')
        setShowConfirmClear(false)
        router.refresh()
      }
    } catch {
      toast.error('Failed to clear quiz history.')
    } finally {
      setIsClearingHistory(false)
    }
  }

  let formattedDate = 'Recently'
  try {
    if (user.createdAt) {
      formattedDate = format(new Date(user.createdAt), 'MMMM d, yyyy')
    }
  } catch {
    formattedDate = 'Recently'
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      {/* Page Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-1">
          <GraduationCap className="w-4 h-4" />
          <span>Ace-It! Student Preferences</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
          Settings
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your account preferences, security settings, notifications, and application theme.
        </p>
      </div>

      {/* Tabs Navigation */}
      <div className="flex flex-wrap items-center gap-1.5 p-1.5 bg-muted/60 dark:bg-muted/30 border border-border/50 rounded-2xl">
        <button
          onClick={() => setActiveTab('account')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'account'
              ? 'bg-background text-indigo-600 dark:text-indigo-400 shadow-sm border border-border/60'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <User className="w-3.5 h-3.5" />
          Account
        </button>

        <button
          onClick={() => setActiveTab('security')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'security'
              ? 'bg-background text-indigo-600 dark:text-indigo-400 shadow-sm border border-border/60'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Shield className="w-3.5 h-3.5" />
          Security
        </button>

        <button
          onClick={() => setActiveTab('notifications')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'notifications'
              ? 'bg-background text-indigo-600 dark:text-indigo-400 shadow-sm border border-border/60'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Bell className="w-3.5 h-3.5" />
          Notifications
        </button>

        <button
          onClick={() => setActiveTab('appearance')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'appearance'
              ? 'bg-background text-indigo-600 dark:text-indigo-400 shadow-sm border border-border/60'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Paintbrush className="w-3.5 h-3.5" />
          Appearance
        </button>

        <button
          onClick={() => setActiveTab('danger')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'danger'
              ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50'
              : 'text-muted-foreground hover:text-rose-600'
          }`}
        >
          <Lock className="w-3.5 h-3.5" />
          Danger Zone
        </button>
      </div>

      {/* Tab 1: Account */}
      {activeTab === 'account' && (
        <div className="space-y-6">
          <Card className="rounded-2xl border-border/70 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <User className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                Account Overview
              </CardTitle>
              <CardDescription>Your registered student credentials on Ace-It!</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-muted/40 border border-border/40">
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                    Student Name
                  </div>
                  <div className="text-sm font-bold text-foreground truncate">
                    {profile?.full_name || 'Ace Student'}
                  </div>
                  <p className="text-[11px] text-indigo-600 dark:text-indigo-400 font-medium truncate mt-0.5">
                    {profile?.headline || 'Learner'}
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-muted/40 border border-border/40">
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                    Email Address
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-foreground truncate">{user.email}</span>
                    <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 text-[10px] font-bold">
                      Verified
                    </Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1">Used for signing in.</p>
                </div>

                <div className="p-4 rounded-xl bg-muted/40 border border-border/40">
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                    Student Plan
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
                      Ace-It! All-Access Student Plan
                    </span>
                    <Badge className="bg-indigo-600 text-white text-[10px] font-bold">
                      Active
                    </Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1">Unlimited quizzes & AI practice.</p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-muted/30 border border-border/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-semibold text-muted-foreground">Member Since</div>
                  <div className="text-sm font-medium text-foreground">{formattedDate}</div>
                </div>
                <Link href="/profile">
                  <Button variant="outline" size="sm" className="rounded-xl text-xs h-9 border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40">
                    Edit Profile & Avatar
                    <ChevronRight className="w-3.5 h-3.5 ml-1" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tab 2: Security */}
      {activeTab === 'security' && (
        <div className="space-y-6">
          <Card className="rounded-2xl border-border/70 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                Change Password
              </CardTitle>
              <CardDescription>
                Ensure your Ace-It! account is secured with a strong, unique password.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePasswordChange} className="space-y-5">
                <div className="space-y-1.5">
                  <Label htmlFor="newPassword" className="text-xs font-medium">New Password</Label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter minimum 8 characters"
                      autoComplete="new-password"
                      className="rounded-xl pr-10 text-sm h-11"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Password Strength Meter */}
                {newPassword.length > 0 && (
                  <div className="space-y-2 p-3 rounded-xl bg-muted/40 border border-border/40">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Password strength:</span>
                      <span className="font-bold">{strengthLabel}</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${strengthColor}`}
                        style={{ width: `${(strengthScore / 4) * 100}%` }}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-1.5 pt-1 text-[11px] text-muted-foreground">
                      <div className={`flex items-center gap-1.5 ${hasMinLength ? 'text-emerald-600 dark:text-emerald-400 font-medium' : ''}`}>
                        <Check className="w-3 h-3" /> Min 8 characters
                      </div>
                      <div className={`flex items-center gap-1.5 ${hasNumber ? 'text-emerald-600 dark:text-emerald-400 font-medium' : ''}`}>
                        <Check className="w-3 h-3" /> Contains number
                      </div>
                      <div className={`flex items-center gap-1.5 ${hasMixedCase ? 'text-emerald-600 dark:text-emerald-400 font-medium' : ''}`}>
                        <Check className="w-3 h-3" /> Uppercase & lowercase
                      </div>
                      <div className={`flex items-center gap-1.5 ${hasSpecial ? 'text-emerald-600 dark:text-emerald-400 font-medium' : ''}`}>
                        <Check className="w-3 h-3" /> Special character
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-1.5">
                  <Label htmlFor="confirmPassword" className="text-xs font-medium">Confirm New Password</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm your new password"
                      autoComplete="new-password"
                      className="rounded-xl pr-10 text-sm h-11"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={changingPassword || !newPassword || !confirmPassword}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl h-11 px-6 font-semibold shadow-md shadow-indigo-600/20"
                >
                  {changingPassword && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Update Password
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tab 3: Notifications */}
      {activeTab === 'notifications' && (
        <div className="space-y-6">
          <Card className="rounded-2xl border-border/70 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Bell className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                Study Reminders & Notifications
              </CardTitle>
              <CardDescription>
                Customize how and when Ace-It! notifies you about quizzes and study goals.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <div className="text-sm font-semibold text-foreground">Study Streak Reminders</div>
                  <div className="text-xs text-muted-foreground">
                    Receive gentle prompts to keep up your active practice streak and review weak areas.
                  </div>
                </div>
                <Switch
                  checked={studyReminders}
                  onCheckedChange={(checked) => updateNotificationPref('study_reminders', checked, setStudyReminders)}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <div className="text-sm font-semibold text-foreground">Quiz Completion Summaries</div>
                  <div className="text-xs text-muted-foreground">
                    Get an email summary of your quiz score, time taken, and incorrect answers after each quiz.
                  </div>
                </div>
                <Switch
                  checked={quizScoreEmails}
                  onCheckedChange={(checked) => updateNotificationPref('score_emails', checked, setQuizScoreEmails)}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <div className="text-sm font-semibold text-foreground">Weekly Performance Digest</div>
                  <div className="text-xs text-muted-foreground">
                    A weekly overview of your accuracy trends, mastered materials, and recommended topics.
                  </div>
                </div>
                <Switch
                  checked={weeklyDigest}
                  onCheckedChange={(checked) => updateNotificationPref('weekly_digest', checked, setWeeklyDigest)}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <div className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <Volume2 className="w-4 h-4 text-muted-foreground" />
                    Quiz Timer Sound Effects
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Play subtle audio alerts when the quiz countdown enters the final 10 seconds.
                  </div>
                </div>
                <Switch
                  checked={soundEffects}
                  onCheckedChange={(checked) => updateNotificationPref('sound_effects', checked, setSoundEffects)}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tab 4: Appearance */}
      {activeTab === 'appearance' && (
        <div className="space-y-6">
          <Card className="rounded-2xl border-border/70 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Paintbrush className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                Theme & Interface Appearance
              </CardTitle>
              <CardDescription>
                Choose how Ace-It! looks for your study sessions.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Light Theme Card */}
                <button
                  type="button"
                  onClick={() => setTheme('light')}
                  className={`relative p-4 rounded-2xl border-2 text-left transition-all flex flex-col gap-3 ${
                    mounted && theme === 'light'
                      ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/20 shadow-md ring-2 ring-indigo-500/20'
                      : 'border-border/60 hover:border-indigo-300 dark:hover:border-indigo-800 bg-card'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center">
                      <Sun className="w-4 h-4" />
                    </div>
                    {mounted && theme === 'light' && (
                      <div className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center">
                        <Check className="w-3 h-3" />
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-foreground">Light Mode</div>
                    <div className="text-xs text-muted-foreground mt-0.5">Crisp, high-contrast study style</div>
                  </div>
                </button>

                {/* Dark Theme Card */}
                <button
                  type="button"
                  onClick={() => setTheme('dark')}
                  className={`relative p-4 rounded-2xl border-2 text-left transition-all flex flex-col gap-3 ${
                    mounted && theme === 'dark'
                      ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/20 shadow-md ring-2 ring-indigo-500/20'
                      : 'border-border/60 hover:border-indigo-300 dark:hover:border-indigo-800 bg-card'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="w-8 h-8 rounded-xl bg-indigo-950 text-indigo-400 flex items-center justify-center">
                      <Moon className="w-4 h-4" />
                    </div>
                    {mounted && theme === 'dark' && (
                      <div className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center">
                        <Check className="w-3 h-3" />
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-foreground">Dark Mode</div>
                    <div className="text-xs text-muted-foreground mt-0.5">Low eye-strain for late night study</div>
                  </div>
                </button>

                {/* System Theme Card */}
                <button
                  type="button"
                  onClick={() => setTheme('system')}
                  className={`relative p-4 rounded-2xl border-2 text-left transition-all flex flex-col gap-3 ${
                    mounted && theme === 'system'
                      ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/20 shadow-md ring-2 ring-indigo-500/20'
                      : 'border-border/60 hover:border-indigo-300 dark:hover:border-indigo-800 bg-card'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="w-8 h-8 rounded-xl bg-muted text-muted-foreground flex items-center justify-center">
                      <Laptop className="w-4 h-4" />
                    </div>
                    {mounted && theme === 'system' && (
                      <div className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center">
                        <Check className="w-3 h-3" />
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-foreground">System Match</div>
                    <div className="text-xs text-muted-foreground mt-0.5">Sync with your OS preference</div>
                  </div>
                </button>
              </div>

              <div className="p-4 rounded-xl bg-muted/30 border border-border/40 text-xs text-muted-foreground">
                Tip: The Ace-It! interface dynamically adjusts question cards, radial timer dials, and badge contrast to suit both bright day and dark room environments.
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tab 5: Danger Zone */}
      {activeTab === 'danger' && (
        <div className="space-y-6">
          {/* Sign Out Card */}
          <Card className="rounded-2xl border-border/70 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <LogOut className="w-4 h-4 text-muted-foreground" />
                Sign Out
              </CardTitle>
              <CardDescription>
                Sign out of your active Ace-It! student session on this browser.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant="outline"
                onClick={handleLogout}
                className="rounded-xl font-medium border-border/80 hover:bg-muted"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out of Ace-It!
              </Button>
            </CardContent>
          </Card>

          {/* Clear History Card */}
          <Card className="rounded-2xl border-rose-200 dark:border-rose-900/50 bg-rose-500/[0.02] shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-bold text-rose-600 dark:text-rose-400 flex items-center gap-2">
                <Trash2 className="w-4 h-4" />
                Clear Quiz History
              </CardTitle>
              <CardDescription>
                Delete all your past quiz attempts and answers. Your uploaded materials and saved quizzes will remain intact.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {showConfirmClear ? (
                <div className="p-4 rounded-xl bg-rose-100/80 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 space-y-3">
                  <div className="text-xs font-bold text-rose-800 dark:text-rose-200">
                    Are you sure? This will delete all your recorded scores and attempt timestamps.
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="destructive"
                      size="sm"
                      disabled={isClearingHistory}
                      onClick={handleClearHistory}
                      className="rounded-xl text-xs"
                    >
                      {isClearingHistory && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
                      Yes, Clear All History
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowConfirmClear(false)}
                      className="rounded-xl text-xs"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  variant="outline"
                  onClick={() => setShowConfirmClear(true)}
                  className="rounded-xl font-medium border-rose-300 text-rose-600 hover:bg-rose-50 dark:border-rose-800 dark:text-rose-400 dark:hover:bg-rose-950/30"
                >
                  Clear Quiz Attempts
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
