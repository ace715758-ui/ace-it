import type { Metadata } from 'next'
import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import ResultsClient from '@/components/quiz/ResultsClient'

export const metadata: Metadata = { title: 'Quiz Results' }

export default async function ResultsPage({
  params,
}: {
  params: Promise<{ quizId: string; attemptId: string }>
}) {
  const { quizId, attemptId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const serviceClient = createServiceClient()

  const { data: attempt, error: attemptError } = await serviceClient
    .from('quiz_attempts')
    .select('*')
    .eq('id', attemptId)
    .eq('quiz_id', quizId)
    .single()

  if (attemptError || !attempt || attempt.user_id !== user.id) {
    console.error('ResultsPage: attempt not found or does not belong to user:', {
      attemptError,
      attemptId,
      quizId,
      userId: user.id,
    })
    notFound()
  }

  const [{ data: quiz }, { data: answers }] = await Promise.all([
    serviceClient.from('quizzes').select('*').eq('id', quizId).single(),
    serviceClient
      .from('answers')
      .select(`
        *,
        questions(
          id, question_text, question_type, options,
          correct_answer, explanation, source_chunk_id, difficulty
        )
      `)
      .eq('attempt_id', attemptId),
  ])

  // Get source info
  const sourceChunkIds = answers
    ?.map((a) => (a.questions as { source_chunk_id: string | null } | null)?.source_chunk_id)
    .filter((id): id is string => !!id) ?? []

  const sourceMap: Record<string, { materialName: string; pageNumber: number | null; sectionTitle: string | null }> = {}

  if (sourceChunkIds.length > 0) {
    const { data: chunks } = await serviceClient
      .from('document_chunks')
      .select('id, page_number, section_title, materials(original_filename)')
      .in('id', sourceChunkIds)

    if (chunks) {
      for (const chunk of chunks) {
        const mat = (Array.isArray(chunk.materials) ? chunk.materials[0] : chunk.materials) as { original_filename: string } | null
        sourceMap[chunk.id] = {
          materialName: mat?.original_filename ?? 'Unknown',
          pageNumber: chunk.page_number,
          sectionTitle: chunk.section_title,
        }
      }
    }
  }

  const reviewAnswers = answers?.map((a) => {
    const q = a.questions as {
      id: string
      question_text: string
      question_type: string
      options: string[] | null
      correct_answer: string
      explanation: string
      source_chunk_id: string | null
    } | null

    return {
      questionId: a.question_id,
      questionText: q?.question_text ?? '',
      questionType: q?.question_type ?? '',
      options: q?.options ?? null,
      selectedAnswer: a.selected_answer,
      correctAnswer: q?.correct_answer ?? '',
      isCorrect: a.is_correct,
      explanation: q?.explanation ?? '',
      sourceChunkId: q?.source_chunk_id ?? null,
      sourceInfo: q?.source_chunk_id ? (sourceMap[q.source_chunk_id] ?? null) : null,
    }
  }) ?? []

  return (
    <ResultsClient
      attempt={attempt}
      quiz={quiz}
      answers={reviewAnswers}
    />
  )
}
