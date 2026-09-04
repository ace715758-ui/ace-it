import type { AIGeneratedQuestion, AIValidationResult, ChunkContext } from '@/types/ai'
import type { QuestionType, Difficulty } from '@/types/database'

const STOP_WORDS = new Set([
  'what', 'which', 'of', 'the', 'following', 'is', 'are', 'in', 'an', 'a',
  'to', 'for', 'by', 'from', 'based', 'on', 'according', 'statement', 'statements',
  'correct', 'true', 'false', 'described', 'text', 'learning', 'material',
  'concept', 'definition', 'identify', 'determine', 'explain', 'best', 'directly', 'confirmed',
  'with', 'that', 'this', 'how', 'does', 'primary', 'main', 'refer', 'means', 'when'
])

/**
 * Validate a generated question against its source chunks.
 * This is a programmatic pre-check before saving.
 */
export function validateQuestion(
  question: AIGeneratedQuestion,
  sourceChunks: ChunkContext[],
  existingQuestions: string[],
  requestedType: QuestionType,
  requestedDifficulty: Difficulty,
  existingAnswers: string[] = []
): AIValidationResult {
  const issues: string[] = []

  // 1. Check question text exists
  if (!question.question || question.question.trim().length < 8) {
    issues.push('Question text is too short or empty')
  }

  // 2. Check correct answer exists
  if (!question.correct_answer || question.correct_answer.trim().length === 0) {
    issues.push('Correct answer is missing')
  }

  // 3. Check explanation exists
  if (!question.explanation || question.explanation.trim().length < 5) {
    issues.push('Explanation is too short or missing')
  }

  // 4. Ensure source_chunk_id references a valid chunk
  const validChunkIds = sourceChunks.map((c) => c.id)
  if (!question.source_chunk_id || !validChunkIds.includes(question.source_chunk_id)) {
    // Gracefully assign first available source chunk
    question.source_chunk_id = validChunkIds[0] ?? ''
  }

  // 5. Smart duplicate detection (strips generic question filler)
  const isDuplicate = existingQuestions.some((existing, i) => {
    const similarity = calculateSubstantiveSimilarity(question.question, existing)
    // If the question text is highly similar, check if they also share the same answer
    if (similarity > 0.82) {
      const existingAnswer = existingAnswers[i]
      if (existingAnswer) {
        const answerSim = calculateSubstantiveSimilarity(question.correct_answer, existingAnswer)
        return answerSim > 0.6
      }
      return true
    }
    return false
  })

  if (isDuplicate) {
    issues.push('Question is too similar to an existing question')
  }

  // 6. Validate question type matches
  const resolvedType = requestedType === 'mixed' ? question.question_type : requestedType
  if (question.question_type !== resolvedType && requestedType !== 'mixed') {
    // If type differs, reassign if structure fits
    if (requestedType === 'multiple_choice' && (!question.options || question.options.length < 2)) {
      issues.push(`Question type mismatch: expected ${requestedType}, got ${question.question_type}`)
    } else {
      question.question_type = requestedType as Exclude<QuestionType, 'mixed'>
    }
  }

  // 7. Validate difficulty matches
  if (requestedDifficulty !== 'mixed' && question.difficulty !== requestedDifficulty) {
    question.difficulty = requestedDifficulty
  }

  // 8. Validate multiple choice has at least 2 options
  if (question.question_type === 'multiple_choice') {
    if (!question.options || question.options.length < 2) {
      issues.push('Multiple choice question must have at least 2 options')
    }
  }

  // 9. Validate true/false has correct options
  if (question.question_type === 'true_false') {
    if (!question.options || !question.options.includes('True')) {
      question.options = ['True', 'False']
    }
  }

  // 10. Check and align correct answer in options (for multiple choice / true_false)
  if (
    question.question_type !== 'identification' &&
    question.options &&
    question.options.length > 0
  ) {
    const norm = (s: string) =>
      s
        .toLowerCase()
        .replace(/^[a-d]\s*[\.\:\-\)]\s*/i, '')
        .replace(/\.$/, '')
        .trim()

    const normAnswer = norm(question.correct_answer)
    const matchedOption = question.options.find(
      (opt) =>
        norm(opt) === normAnswer ||
        norm(opt).includes(normAnswer) ||
        (normAnswer.length > 10 && normAnswer.includes(norm(opt)))
    )

    if (matchedOption) {
      // Align correct_answer exactly to the option string
      question.correct_answer = matchedOption
    } else if (!question.options.includes(question.correct_answer)) {
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
 * Keyword-based Jaccard similarity ignoring generic question stop words.
 */
function calculateSubstantiveSimilarity(a: string, b: string): number {
  const getKeywords = (text: string) => {
    const words = text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .split(/\s+/)
      .filter((w) => w.length > 2 && !STOP_WORDS.has(w))
    return new Set(words)
  }

  const setA = getKeywords(a)
  const setB = getKeywords(b)

  if (setA.size === 0 || setB.size === 0) return 0

  const intersection = new Set([...setA].filter((x) => setB.has(x)))
  const union = new Set([...setA, ...setB])
  return intersection.size / union.size
}
