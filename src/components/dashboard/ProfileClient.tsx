'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { BookOpen, Brain, Loader2, Target, TrendingUp, User } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
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

export default function ProfileClient({ profile, stats }: ProfileClientProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<ProfileUpdateInput>({
    resolver: zodResolver(profileUpdateSchema),
    defaultValues: { fullName: profile?.full_name ?? '' },
  })

  const initials = profile?.full_name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) ?? '?'

  async function onSubmit(data: ProfileUpdateInput) {
    setIsLoading(true)
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ full_name: data.fullName }),
      })

      if (!res.ok) {
        toast.error('Failed to update profile.')
        return
      }

      toast.success('Profile updated!')
      router.refresh()
    } catch {
      toast.error('Something went wrong.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">Profile</h1>
        <p className="text-muted-foreground mt-1">Manage your account details</p>
      </div>

      {/* Profile Info */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4 mb-6">
            <Avatar className="w-16 h-16">
              <AvatarFallback className="bg-primary text-primary-foreground text-xl font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-lg font-semibold">{profile?.full_name ?? 'Student'}</h2>
              <p className="text-muted-foreground text-sm">{profile?.email ?? ''}</p>
            </div>
          </div>

          <Separator className="mb-6" />

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                aria-invalid={!!errors.fullName}
                {...register('fullName')}
              />
              {errors.fullName && (
                <p className="text-sm text-destructive" role="alert">
                  {errors.fullName.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input value={profile?.email ?? ''} disabled />
              <p className="text-xs text-muted-foreground">
                Email cannot be changed here.
              </p>
            </div>

            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Your Statistics</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <Stat icon={BookOpen} label="Materials" value={stats.materials} color="text-blue-600" />
          <Stat icon={Brain} label="Quizzes Created" value={stats.quizzes} color="text-violet-600" />
          <Stat icon={Target} label="Quizzes Completed" value={stats.attempts} color="text-green-600" />
          <Stat icon={TrendingUp} label="Average Score" value={`${stats.avgScore}%`} color="text-amber-600" />
        </CardContent>
      </Card>
    </div>
  )
}

function Stat({ icon: Icon, label, value, color }: {
  icon: React.ElementType
  label: string
  value: string | number
  color: string
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center shrink-0">
        <Icon className={`w-5 h-5 ${color}`} />
      </div>
      <div>
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  )
}
