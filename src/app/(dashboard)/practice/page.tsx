import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import PracticeWeakAreasClient from '@/components/quiz/PracticeWeakAreasClient'

export const metadata: Metadata = {
  title: 'Practice Weak Areas',
  description: 'Target your weak topics and improve test performance with Ace-It! AI diagnostics.',
}

export default async function PracticePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch materials
  const { data: materials } = await supabase
    .from('materials')
    .select('id, original_filename, file_type, uploaded_at, processing_status')
    .eq('user_id', user.id)
    .order('uploaded_at', { ascending: false })

  // Fetch quiz attempts with quizzes and quiz_materials
  const { data: attempts } = await supabase
    .from('quiz_attempts')
    .select(`
      id,
      quiz_id,
      score,
      total_questions,
      percentage,
      completed_at,
      quizzes (
        id,
        title,
        difficulty,
        quiz_materials (
          material_id
        )
      )
    `)
    .eq('user_id', user.id)
    .order('completed_at', { ascending: false })

  // Fetch recent incorrect answers to show specific missed questions
  const { data: wrongAnswers } = await supabase
    .from('answers')
    .select(`
      id,
      question_id,
      selected_answer,
      is_correct,
      answered_at,
      questions (
        id,
        question_text,
        question_type,
        correct_answer,
        explanation,
        quiz_id,
        quizzes (
          title
        )
      )
    `)
    .eq('is_correct', false)
    .order('answered_at', { ascending: false })
    .limit(10)

  return (
    <PracticeWeakAreasClient
      materials={materials ?? []}
      attempts={(attempts ?? []) as unknown as Parameters<typeof PracticeWeakAreasClient>[0]['attempts']}
      wrongAnswers={(wrongAnswers ?? []) as unknown as Parameters<typeof PracticeWeakAreasClient>[0]['wrongAnswers']}
    />
  )
}
