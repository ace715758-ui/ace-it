import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import ProfileClient from '@/components/dashboard/ProfileClient'
import type { Profile } from '@/types/database'

export const metadata: Metadata = { title: 'Profile' }

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const serviceClient = createServiceClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const [{ count: materialCount }, { count: quizCount }, { data: attempts }] = await Promise.all([
    supabase.from('materials').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
    supabase.from('quizzes').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
    serviceClient
      .from('quiz_attempts')
      .select('percentage')
      .eq('user_id', user.id)
      .not('completed_at', 'is', null),
  ])

  const avgScore =
    attempts && attempts.length > 0
      ? Math.round(attempts.reduce((s, a) => s + (Number(a.percentage) || 0), 0) / attempts.length)
      : 0

  const userProfile: Profile = profile
    ? {
        ...profile,
        headline: profile.headline || user.user_metadata?.headline || 'BSIT Student',
        avatar_url: profile.avatar_url || user.user_metadata?.avatar_url || null,
      }
    : {
        id: user.id,
        email: user.email ?? '',
        full_name: user.user_metadata?.full_name ?? user.email?.split('@')[0] ?? 'Ace Magbanua',
        headline: user.user_metadata?.headline ?? 'BSIT Student',
        avatar_url: user.user_metadata?.avatar_url ?? null,
        created_at: user.created_at ?? new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

  return (
    <ProfileClient
      profile={userProfile}
      stats={{
        materials: materialCount ?? 0,
        quizzes: quizCount ?? 0,
        attempts: attempts?.length ?? 0,
        avgScore,
      }}
    />
  )
}
