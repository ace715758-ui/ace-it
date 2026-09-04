import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import HistoryClient from '@/components/quiz/HistoryClient'

export const metadata: Metadata = { title: 'Quiz History | Ace-It!' }

export default async function HistoryPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const serviceClient = createServiceClient()
  const { data: attempts } = await serviceClient
    .from('quiz_attempts')
    .select(`
      *,
      quizzes(id, title, difficulty, question_count, question_type)
    `)
    .eq('user_id', user.id)
    .not('completed_at', 'is', null)
    .order('completed_at', { ascending: false })
    .limit(100)

  const normalizedAttempts = (attempts ?? []).map((attempt) => {
    const rawQuiz = attempt.quizzes
    const quiz = (Array.isArray(rawQuiz) ? rawQuiz[0] : rawQuiz) ?? null
    return {
      ...attempt,
      percentage: Number(attempt.percentage) || 0,
      quizzes: quiz,
    }
  })

  return <HistoryClient attempts={normalizedAttempts} />
}

