'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Award,
  BookOpen,
  Brain,
  Check,
  CheckCircle2,
  GraduationCap,
  Image as ImageIcon,
  Loader2,
  Target,
  TrendingUp,
  User,
} from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { profileUpdateSchema, type ProfileUpdateInput } from '@/lib/validation/quiz'
import type { Profile } from '@/types/database'

interface ProfileClientProps {
  profile: Profile | null
  stats: {
    materials: number
    quizzes: number
    attempts: number
    avgScore: number
  }
}

const PRESET_AVATARS = [
  { label: 'Ace (Default)', url: 'https://api.dicebear.com/7.x/notionists/svg?seed=Ace' },
  { label: 'Alex', url: 'https://api.dicebear.com/7.x/notionists/svg?seed=Alex' },
  { label: 'Sophia', url: 'https://api.dicebear.com/7.x/notionists/svg?seed=Sophia' },
  { label: 'Marcus', url: 'https://api.dicebear.com/7.x/notionists/svg?seed=Marcus' },
  { label: 'Elena', url: 'https://api.dicebear.com/7.x/notionists/svg?seed=Elena' },
  { label: 'Robot Scholar', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=Scholar' },
]

const POPULAR_HEADLINES = [
  'BSIT Student',
  'Computer Science Major',
  'Engineering Student',
  'Pre-Med / Biology Major',
  'Business Administration',
  'High School Senior',
]

export default function ProfileClient({ profile, stats }: ProfileClientProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [selectedAvatar, setSelectedAvatar] = useState<string>(profile?.avatar_url || '')

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ProfileUpdateInput>({
    resolver: zodResolver(profileUpdateSchema),
    defaultValues: {
      fullName: profile?.full_name ?? 'Ace Magbanua',
      headline: profile?.headline ?? 'BSIT Student',
      avatarUrl: profile?.avatar_url ?? '',
    },
  })

  const watchedFullName = watch('fullName') || profile?.full_name || 'Ace Magbanua'
  const watchedHeadline = watch('headline') || profile?.headline || 'BSIT Student'

  const initials = watchedFullName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'AM'

  function handleSelectPreset(url: string) {
    setSelectedAvatar(url)
    setValue('avatarUrl', url)
  }

  function handleClearAvatar() {
    setSelectedAvatar('')
    setValue('avatarUrl', '')
  }

  async function onSubmit(data: ProfileUpdateInput) {
    setIsLoading(true)
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: data.fullName.trim(),
          headline: (data.headline || '').trim() || 'BSIT Student',
          avatar_url: selectedAvatar || null,
        }),
      })

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        toast.error(errData.error || 'Failed to update profile.')
        return
      }

      toast.success('Profile updated successfully! Header and sidebar refreshed.')
      router.refresh()
    } catch {
      toast.error('Something went wrong. Please check your network.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12 animate-in fade-in duration-300">
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/60 dark:border-indigo-800/40 text-xs font-semibold text-indigo-600 dark:text-indigo-400 mb-2">
          <GraduationCap className="w-3.5 h-3.5" />
          <span>Student Account Settings</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
          My Profile & Student ID
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Customize your student display name, academic course/headline, and avatar.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Columns: Edit Form & Avatar Selection */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="rounded-2xl border-border/80 shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <User className="w-5 h-5 text-indigo-600" />
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                {/* Full Name */}
                <div className="space-y-2">
                  <Label htmlFor="fullName" className="text-sm font-semibold">
                    Full Name <span className="text-rose-500">*</span>
                  </Label>
                  <Input
                    id="fullName"
                    placeholder="e.g. Ace S. Magbanua"
                    className="rounded-xl h-11"
                    aria-invalid={!!errors.fullName}
                    {...register('fullName')}
                  />
                  {errors.fullName && (
                    <p className="text-xs font-medium text-destructive" role="alert">
                      {errors.fullName.message}
                    </p>
                  )}
                </div>

                {/* Student Headline / Major */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="headline" className="text-sm font-semibold">
                      Student Headline / Course
                    </Label>
                    <span className="text-xs text-muted-foreground">Appears on Header & Sidebar</span>
                  </div>
                  <Input
                    id="headline"
                    placeholder="e.g. BSIT Student"
                    className="rounded-xl h-11"
                    {...register('headline')}
                  />

                  {/* Quick Select Tags */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {POPULAR_HEADLINES.map((h) => (
                      <button
                        key={h}
                        type="button"
                        onClick={() => setValue('headline', h)}
                        className="px-2.5 py-1 rounded-full text-xs font-medium bg-muted hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-950/60 dark:hover:text-indigo-300 border border-border/60 transition-colors"
                      >
                        {h}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Email (Read only) */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-muted-foreground">Email Address</Label>
                  <Input
                    value={profile?.email ?? ''}
                    disabled
                    className="rounded-xl h-11 bg-muted/50 cursor-not-allowed text-muted-foreground"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Connected with your authentication account.
                  </p>
                </div>

                <Separator />

                {/* Avatar Selection */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-semibold flex items-center gap-2">
                      <ImageIcon className="w-4 h-4 text-indigo-500" />
                      Choose Avatar
                    </Label>
                    {selectedAvatar && (
                      <button
                        type="button"
                        onClick={handleClearAvatar}
                        className="text-xs text-rose-600 hover:underline font-medium"
                      >
                        Use Initials Instead
                      </button>
                    )}
                  </div>

                  {/* Preset Avatar Grid */}
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                    {PRESET_AVATARS.map((preset) => {
                      const isSelected = selectedAvatar === preset.url
                      return (
                        <button
                          key={preset.label}
                          type="button"
                          onClick={() => handleSelectPreset(preset.url)}
                          className={`relative p-1.5 rounded-2xl border-2 transition-all flex flex-col items-center gap-1.5 group ${
                            isSelected
                              ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 shadow-sm'
                              : 'border-border/70 hover:border-indigo-300 hover:bg-muted/40'
                          }`}
                        >
                          <Avatar className="w-12 h-12">
                            <AvatarImage src={preset.url} alt={preset.label} />
                            <AvatarFallback>{preset.label[0]}</AvatarFallback>
                          </Avatar>
                          <span className="text-[10px] font-medium text-muted-foreground truncate w-full text-center">
                            {preset.label.split(' ')[0]}
                          </span>
                          {isSelected && (
                            <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-indigo-600 text-white flex items-center justify-center">
                              <Check className="w-2.5 h-2.5" />
                            </div>
                          )}
                        </button>
                      )
                    })}
                  </div>

                  {/* Custom URL Option */}
                  <div className="pt-2">
                    <Label htmlFor="customAvatarUrl" className="text-xs text-muted-foreground">
                      Or paste a custom image URL:
                    </Label>
                    <div className="flex gap-2 mt-1">
                      <Input
                        id="customAvatarUrl"
                        placeholder="https://example.com/my-photo.jpg"
                        value={selectedAvatar}
                        onChange={(e) => {
                          setSelectedAvatar(e.target.value)
                          setValue('avatarUrl', e.target.value)
                        }}
                        className="rounded-xl text-xs h-9"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-4">
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl px-8 h-11 shadow-md shadow-indigo-600/20"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving changes...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        Save Profile Changes
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Live Student ID Card Preview & Stats */}
        <div className="space-y-6">
          {/* Live Student Card Preview */}
          <div className="rounded-3xl border border-indigo-200/80 dark:border-indigo-800/60 bg-gradient-to-br from-indigo-500/10 via-background to-sky-500/10 p-6 shadow-md relative overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                <GraduationCap className="w-4 h-4" />
                <span>Ace-It! Student ID</span>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                Verified Student
              </span>
            </div>

            <div className="flex items-center gap-4 py-2">
              <Avatar className="w-16 h-16 ring-4 ring-indigo-500/30 shadow-md">
                {selectedAvatar ? (
                  <AvatarImage src={selectedAvatar} alt={watchedFullName} />
                ) : null}
                <AvatarFallback className="bg-gradient-to-tr from-indigo-600 to-sky-500 text-white text-xl font-extrabold">
                  {initials}
                </AvatarFallback>
              </Avatar>

              <div className="min-w-0">
                <h3 className="text-lg font-bold text-foreground truncate leading-tight">
                  {watchedFullName}
                </h3>
                <p className="text-xs font-medium text-indigo-600 dark:text-indigo-400 truncate mt-0.5">
                  {watchedHeadline}
                </p>
                <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                  {profile?.email}
                </p>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-border/60 grid grid-cols-2 gap-2 text-center text-xs">
              <div className="p-2 rounded-xl bg-background/60 backdrop-blur-sm border border-border/40">
                <p className="font-bold text-base text-foreground">{stats.attempts}</p>
                <p className="text-[10px] text-muted-foreground">Quizzes Taken</p>
              </div>
              <div className="p-2 rounded-xl bg-background/60 backdrop-blur-sm border border-border/40">
                <p className="font-bold text-base text-foreground">{stats.avgScore}%</p>
                <p className="text-[10px] text-muted-foreground">Avg Accuracy</p>
              </div>
            </div>

            <div className="mt-3 text-center">
              <p className="text-[10px] text-muted-foreground font-mono">
                ID: {profile?.id?.slice(0, 13) || 'STUDENT-ACADEMY'}
              </p>
            </div>
          </div>

          {/* Academic Stats Card */}
          <Card className="rounded-2xl border-border/80 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-500" />
                Academic Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <StatRow icon={BookOpen} label="Learning Materials" value={stats.materials} color="text-blue-500" />
              <StatRow icon={Brain} label="Quizzes Created" value={stats.quizzes} color="text-indigo-500" />
              <StatRow icon={Target} label="Completed Sets" value={stats.attempts} color="text-emerald-500" />
              <StatRow icon={TrendingUp} label="Average Mastery" value={`${stats.avgScore}%`} color="text-amber-500" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

function StatRow({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ElementType
  label: string
  value: string | number
  color: string
}) {
  return (
    <div className="flex items-center justify-between p-2.5 rounded-xl bg-muted/30">
      <div className="flex items-center gap-2.5">
        <Icon className={`w-4 h-4 ${color}`} />
        <span className="text-xs font-medium text-foreground">{label}</span>
      </div>
      <span className="text-sm font-bold text-foreground">{value}</span>
    </div>
  )
}

