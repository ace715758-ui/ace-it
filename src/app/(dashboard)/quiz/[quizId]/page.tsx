import type { Metadata } from 'next'
import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import QuizTaker from '@/components/quiz/QuizTaker'

export const metadata: Metadata = { title: 'Take Quiz' }

export default async function QuizPage({
  params,
  searchParams,
}: {
  params: Promise<{ quizId: string }>
  searchParams?: Promise<{ timer?: string }>
}) {
  const { quizId } = await params
  const resolvedSearchParams = (await searchParams) ?? {}
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const serviceClient = createServiceClient()
  const { data: quiz } = await serviceClient
    .from('quizzes')
    .select('*')
    .eq('id', quizId)
    .single()

  if (!quiz || quiz.user_id !== user.id) notFound()

  const { data: questions } = await serviceClient
    .from('questions')
    .select('id, question_text, question_type, options, question_order, difficulty')
    .eq('quiz_id', quizId)
    .order('question_order', { ascending: true })

  if (!questions || questions.length === 0) {
    redirect('/quiz/create')
  }

  const timerParam = resolvedSearchParams.timer ? parseInt(resolvedSearchParams.timer, 10) : undefined
  const initialTimerSeconds = !isNaN(timerParam ?? NaN) ? timerParam : (quiz.time_limit_per_question ?? 20)

  return (
    <QuizTaker
      quiz={quiz}
      initialTimerSeconds={initialTimerSeconds}
      questions={questions as Array<{
        id: string
        question_text: string
        question_type: string
        options: string[] | null
        question_order: number
        difficulty: string
      }>}
    />
  )
}
