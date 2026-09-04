import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

const submitSchema = z.object({
  quizId: z.string().uuid(),
  answers: z.array(
    z.object({
      questionId: z.string().uuid(),
      selectedAnswer: z.string(),
    })
  ),
  startedAt: z.string().datetime(),
})

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const parsed = submitSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid submission data' }, { status: 400 })
  }

  const { quizId, answers, startedAt } = parsed.data

  // Verify user owns the quiz
  const { data: quiz } = await supabase
    .from('quizzes')
    .select('id, user_id')
    .eq('id', quizId)
    .eq('user_id', user.id)
    .single()

  if (!quiz) {
    return NextResponse.json({ error: 'Quiz not found' }, { status: 404 })
  }

  // Server-side scoring: retrieve correct answers from the database
  const questionIds = answers.map((a) => a.questionId)

  const serviceClient = createServiceClient()
  const { data: questions } = await serviceClient
    .from('questions')
    .select('id, correct_answer')
    .in('id', questionIds)
    .eq('quiz_id', quizId)

  if (!questions) {
    return NextResponse.json({ error: 'Failed to retrieve questions' }, { status: 500 })
  }

  // Build a lookup map
  const correctAnswerMap = new Map(questions.map((q) => [q.id, q.correct_answer]))

  // Calculate score
  let score = 0
  const scoredAnswers = answers.map((answer) => {
    const correctAnswer = correctAnswerMap.get(answer.questionId)
    const isCorrect =
      correctAnswer !== undefined &&
      answer.selectedAnswer.trim().toLowerCase() ===
        correctAnswer.trim().toLowerCase()

    if (isCorrect) score++

    return {
      questionId: answer.questionId,
      selectedAnswer: answer.selectedAnswer,
      isCorrect,
    }
  })

  const totalQuestions = scoredAnswers.length
  const percentage =
    totalQuestions > 0 ? Math.round((score / totalQuestions) * 100 * 100) / 100 : 0

  // Create attempt record
  const { data: attempt, error: attemptError } = await supabase
    .from('quiz_attempts')
    .insert({
      quiz_id: quizId,
      user_id: user.id,
      score,
      total_questions: totalQuestions,
      percentage,
      started_at: startedAt,
      completed_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (attemptError || !attempt) {
    return NextResponse.json({ error: 'Failed to save attempt' }, { status: 500 })
  }

  // Save individual answers
  const answerRows = scoredAnswers.map((a) => ({
    attempt_id: attempt.id,
    question_id: a.questionId,
    selected_answer: a.selectedAnswer,
    is_correct: a.isCorrect,
  }))

  await serviceClient.from('answers').insert(answerRows)

  return NextResponse.json({
    attemptId: attempt.id,
    score,
    totalQuestions,
    percentage,
  })
}
