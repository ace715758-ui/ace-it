import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import HistoryClient from '@/components/quiz/HistoryClient'

export const metadata: Metadata = { title: 'Quiz History' }

export default async function HistoryPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: attempts } = await supabase
    .from('quiz_attempts')
    .select(`
      *,
      quizzes(id, title, difficulty, question_count, question_type)
    `)
    .eq('user_id', user.id)
    .not('completed_at', 'is', null)
    .order('completed_at', { ascending: false })
    .limit(50)

  return <HistoryClient attempts={attempts ?? []} />
}
