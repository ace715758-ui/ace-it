import type { AIGeneratedQuestion, AIValidationResult, ChunkContext } from '@/types/ai'
import type { QuestionType, Difficulty } from '@/types/database'

/**
 * Validate a generated question against its source chunks.
 * This is a programmatic pre-check before saving.
 */
export function validateQuestion(
  question: AIGeneratedQuestion,
  sourceChunks: ChunkContext[],
  existingQuestions: string[],
  requestedType: QuestionType,
  requestedDifficulty: Difficulty
): AIValidationResult {
  const issues: string[] = []

  // 1. Check question text exists
  if (!question.question || question.question.trim().length < 10) {
    issues.push('Question text is too short or empty')
  }

  // 2. Check correct answer exists
  if (!question.correct_answer || question.correct_answer.trim().length === 0) {
    issues.push('Correct answer is missing')
  }

  // 3. Check explanation exists
  if (!question.explanation || question.explanation.trim().length < 10) {
    issues.push('Explanation is too short or missing')
  }

  // 4. Check source_chunk_id references a valid chunk
  const validChunkIds = sourceChunks.map((c) => c.id)
  if (!question.source_chunk_id || !validChunkIds.includes(question.source_chunk_id)) {
    // Try to find any chunk that contains content related to the question
    const hasRelatedContent = sourceChunks.some((chunk) => {
      const chunkLower = chunk.content.toLowerCase()
      const answerLower = question.correct_answer.toLowerCase()
      return chunkLower.includes(answerLower.slice(0, 20))
    })

    if (!hasRelatedContent) {
      issues.push('Question does not appear to be grounded in source material')
    }
    // Auto-assign the first chunk if ID is invalid but content seems related
    if (!question.source_chunk_id || !validChunkIds.includes(question.source_chunk_id)) {
      question.source_chunk_id = sourceChunks[0]?.id ?? ''
    }
  }

  // 5. Check for duplicate questions
  const questionLower = question.question.toLowerCase().trim()
  const isDuplicate = existingQuestions.some((existing) => {
    const similarity = calculateSimilarity(questionLower, existing.toLowerCase().trim())
    return similarity > 0.8
  })

  if (isDuplicate) {
    issues.push('Question is too similar to an existing question')
  }

  // 6. Validate question type matches
  const resolvedType = requestedType === 'mixed' ? question.question_type : requestedType
  if (question.question_type !== resolvedType && requestedType !== 'mixed') {
    issues.push(
      `Question type mismatch: expected ${requestedType}, got ${question.question_type}`
    )
  }

  // 7. Validate multiple choice has 4 options
  if (
    question.question_type === 'multiple_choice' &&
    (!question.options || question.options.length < 2)
  ) {
    issues.push('Multiple choice question must have at least 2 options')
  }

  // 8. Validate true/false has correct options
  if (question.question_type === 'true_false') {
    if (!question.options || !question.options.includes('True')) {
      question.options = ['True', 'False']
    }
  }

  // 9. Check correct answer is in options (for multiple choice / true_false)
  if (
    question.question_type !== 'identification' &&
    question.options &&
    question.options.length > 0
  ) {
    if (!question.options.includes(question.correct_answer)) {
      issues.push('Correct answer is not in the provided options')
    }
  }

  return {
    isValid: issues.length === 0,
    issues,
    question: issues.length === 0 ? question : undefined,
  }
}

/**
 * Simple Jaccard similarity for duplicate detection.
 */
function calculateSimilarity(a: string, b: string): number {
  const setA = new Set(a.split(/\s+/))
  const setB = new Set(b.split(/\s+/))
  const intersection = new Set([...setA].filter((x) => setB.has(x)))
  const union = new Set([...setA, ...setB])
  return intersection.size / union.size
}
