import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ attemptId: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { attemptId } = await params

  // Verify ownership
  const { data: attempt } = await supabase
    .from('quiz_attempts')
    .select('*')
    .eq('id', attemptId)
    .eq('user_id', user.id)
    .single()

  if (!attempt) {
    return NextResponse.json({ error: 'Attempt not found' }, { status: 404 })
  }

  const serviceClient = createServiceClient()

  // Get answers with questions
  const { data: answers } = await serviceClient
    .from('answers')
    .select(`
      *,
      questions(
        id, question_text, question_type, options,
        correct_answer, explanation, source_chunk_id, difficulty
      )
    `)
    .eq('attempt_id', attemptId)

  // Get quiz details
  const { data: quiz } = await supabase
    .from('quizzes')
    .select('*')
    .eq('id', attempt.quiz_id)
    .single()

  // Get source info for each answer's source chunk
  const sourceChunkIds = answers
    ?.map((a) => {
      const q = a.questions as { source_chunk_id: string | null } | null
      return q?.source_chunk_id
    })
    .filter((id): id is string => !!id) ?? []

  let chunkSourceMap: Map<string, { materialName: string; pageNumber: number | null; sectionTitle: string | null }> = new Map()

  if (sourceChunkIds.length > 0) {
    const { data: chunks } = await serviceClient
      .from('document_chunks')
      .select('id, page_number, section_title, material_id, materials(original_filename)')
      .in('id', sourceChunkIds)

    if (chunks) {
      for (const chunk of chunks) {
        const material = (Array.isArray(chunk.materials) ? chunk.materials[0] : chunk.materials) as { original_filename: string } | null
        chunkSourceMap.set(chunk.id, {
          materialName: material?.original_filename ?? 'Unknown',
          pageNumber: chunk.page_number,
          sectionTitle: chunk.section_title,
        })
      }
    }
  }

  // Build review data
  const reviewAnswers = answers?.map((a) => {
    const question = a.questions as {
      id: string
      question_text: string
      question_type: string
      options: string[] | null
      correct_answer: string
      explanation: string
      source_chunk_id: string | null
      difficulty: string
    } | null

    return {
      questionId: a.question_id,
      questionText: question?.question_text ?? '',
      questionType: question?.question_type ?? '',
      options: question?.options ?? null,
      selectedAnswer: a.selected_answer,
      correctAnswer: question?.correct_answer ?? '',
      isCorrect: a.is_correct,
      explanation: question?.explanation ?? '',
      sourceChunkId: question?.source_chunk_id ?? null,
      sourceInfo: question?.source_chunk_id
        ? chunkSourceMap.get(question.source_chunk_id) ?? null
        : null,
    }
  }) ?? []

  return NextResponse.json({
    attempt,
    quiz,
    answers: reviewAnswers,
  })
}
