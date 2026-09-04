import type { Metadata } from 'next'
import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import QuizTaker from '@/components/quiz/QuizTaker'

export const metadata: Metadata = { title: 'Take Quiz' }

export default async function QuizPage({
  params,
}: {
  params: Promise<{ quizId: string }>
}) {
  const { quizId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: quiz } = await supabase
    .from('quizzes')
    .select('*')
    .eq('id', quizId)
    .eq('user_id', user.id)
    .single()

  if (!quiz) notFound()

  const serviceClient = createServiceClient()
  const { data: questions } = await serviceClient
    .from('questions')
    .select('id, question_text, question_type, options, question_order, difficulty')
    .eq('quiz_id', quizId)
    .order('question_order', { ascending: true })

  if (!questions || questions.length === 0) {
    redirect('/quiz/create')
  }

  return (
    <QuizTaker
      quiz={quiz}
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
