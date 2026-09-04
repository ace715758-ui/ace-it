import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ProfileClient from '@/components/dashboard/ProfileClient'

export const metadata: Metadata = { title: 'Profile' }

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const [{ count: materialCount }, { count: quizCount }, { data: attempts }] = await Promise.all([
    supabase.from('materials').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
    supabase.from('quizzes').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
    supabase
      .from('quiz_attempts')
      .select('percentage')
      .eq('user_id', user.id)
      .not('completed_at', 'is', null),
  ])

  const avgScore =
    attempts && attempts.length > 0
      ? Math.round(attempts.reduce((s, a) => s + a.percentage, 0) / attempts.length)
      : 0

  return (
    <ProfileClient
      profile={profile}
      stats={{
        materials: materialCount ?? 0,
        quizzes: quizCount ?? 0,
        attempts: attempts?.length ?? 0,
        avgScore,
      }}
    />
  )
}
