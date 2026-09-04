import { getProvider, getModel, getOpenAIClient, getGeminiClient } from './provider'
import type { AIGeneratedQuestion, AIGenerationRequest } from '@/types/ai'
import type { Difficulty, QuestionType } from '@/types/database'

/**
 * SOURCE-GROUNDED AI RULE
 * The AI receives only retrieved source chunks — it must not use outside knowledge.
 */

const SYSTEM_PROMPT = `You are an expert educational quiz generator that creates high-quality, diverse practice questions grounded strictly in the provided study material.

CORE PRINCIPLES:
1. Grounding: Every question, correct answer, and explanation must be derived from and supported by the provided source material. Do not introduce outside facts.
2. Pedagogical Quality & Variety:
   - Formulate clear, direct questions testing specific concepts, definitions, components, distinctions, or principles.
   - NEVER use lazy meta-templates like "Which of the following statements is directly confirmed by the learning material?" or "Which statement is true based on the text?". Instead, ask directly about the concept (e.g., "What is the primary responsibility of a systems analyst during project initiation?", "How does hardware function within an information system?").
   - Ensure each question explores a DIFFERENT topic, section, or concept from the material.
3. Formatting Rules:
   - Every option must be a complete, well-formed sentence or phrase without trailing ellipsis ("...") or raw newlines.
   - "correct_answer" must be the exact text of the correct option.
4. Output Format:
   - Return structured JSON only. No markdown fences, no prose.`

function buildDifficultyInstructions(difficulty: Exclude<Difficulty, 'mixed'>): string {
  switch (difficulty) {
    case 'easy':
      return 'Focus on: definitions, basic facts, direct concepts, recognition.'
    case 'medium':
      return 'Require: understanding, comparison, interpretation, applying concepts.'
    case 'hard':
      return 'Require: analysis, relationships between concepts, scenario-based reasoning, deeper understanding. Must still be answerable from the provided material.'
  }
}

function buildQuestionTypeInstructions(type: Exclude<QuestionType, 'mixed'>): string {
  switch (type) {
    case 'multiple_choice':
      return `Multiple choice with exactly 4 options.
"correct_answer" must be the full text of the correct option (not just a letter).
Distractors should be plausible but clearly wrong.
Every option must be a complete, well-formed sentence or phrase. Do NOT truncate options with ellipsis (...) or cut off sentences.`
    case 'true_false':
      return `True/false question.
"options" must be ["True", "False"].
"correct_answer" must be exactly "True" or "False".`
    case 'identification':
      return `Identification question — student types the answer.
"options" must be null.
"correct_answer" must be a specific term or short phrase from the material.`
  }
}

function buildPrompt(
  count: number,
  resolvedType: Exclude<QuestionType, 'mixed'>,
  resolvedDifficulty: Exclude<Difficulty, 'mixed'>,
  sourceText: string,
  existingNote: string
): string {
  return `Generate exactly ${count} quiz question(s) based ONLY on the source material below.

QUESTION TYPE: ${resolvedType.replace(/_/g, ' ').toUpperCase()}
${buildQuestionTypeInstructions(resolvedType)}

DIFFICULTY: ${resolvedDifficulty.toUpperCase()}
${buildDifficultyInstructions(resolvedDifficulty)}
${existingNote}

Return a JSON object with a "questions" array. Each item must have:
- "question": question text (string)
- "question_type": "${resolvedType}" (string)
- "options": array of strings for multiple_choice/true_false, null for identification
- "correct_answer": full text of the correct answer (string)
- "explanation": explanation referencing the source material (string)
- "source_chunk_id": the SOURCE ID used to generate this question (string)
- "difficulty": "${resolvedDifficulty}" (string)

--- BEGIN SOURCE MATERIAL ---
${sourceText}
--- END SOURCE MATERIAL ---`
}

function resolveTypes(
  questionType: QuestionType,
  difficulty: Difficulty
): {
  resolvedType: Exclude<QuestionType, 'mixed'>
  resolvedDifficulty: Exclude<Difficulty, 'mixed'>
} {
  const types = ['multiple_choice', 'true_false', 'identification'] as const
  const difficulties = ['easy', 'medium', 'hard'] as const

  return {
    resolvedType:
      questionType === 'mixed'
        ? types[Math.floor(Math.random() * types.length)]
        : questionType,
    resolvedDifficulty:
      difficulty === 'mixed'
        ? difficulties[Math.floor(Math.random() * difficulties.length)]
        : difficulty,
  }
}

function parseResponse(content: string): AIGeneratedQuestion[] {
  // Strip markdown code fences if present (some models add them despite instructions)
  const cleaned = content
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim()

  const parsed = JSON.parse(cleaned)

  let list: AIGeneratedQuestion[] = []
  if (Array.isArray(parsed)) list = parsed
  else if (Array.isArray(parsed.questions)) list = parsed.questions
  else {
    // Handle { "0": {...}, "1": {...} } from some models
    list = Object.values(parsed).filter(
      (v): v is AIGeneratedQuestion => typeof v === 'object' && v !== null && 'question' in v
    )
  }

  const cleanText = (s: string) =>
    s
      .replace(/[\r\n]+/g, ' ')
      .replace(/\s{2,}/g, ' ')
      .replace(/\s*\.{3,}$/, '')
      .trim()

  return list.map((q) => ({
    ...q,
    question: cleanText(q.question),
    options: Array.isArray(q.options) ? q.options.map(cleanText) : undefined,
    correct_answer: cleanText(q.correct_answer),
    explanation: q.explanation ? cleanText(q.explanation) : q.explanation,
  }))
}

// ─── Gemini implementation ────────────────────────────────────────────────────

async function generateWithGemini(
  userPrompt: string
): Promise<AIGeneratedQuestion[]> {
  const client = await getGeminiClient()
  const model = getModel()

  const geminiModel = client.getGenerativeModel({
    model,
    generationConfig: {
      temperature: 0.5,
      responseMimeType: 'application/json', // Forces JSON output
    },
    systemInstruction: SYSTEM_PROMPT,
  })

  const result = await geminiModel.generateContent(userPrompt)
  const content = result.response.text()

  if (!content) throw new Error('Gemini returned empty response')
  return parseResponse(content)
}

// ─── OpenAI implementation ────────────────────────────────────────────────────

async function generateWithOpenAI(
  userPrompt: string
): Promise<AIGeneratedQuestion[]> {
  const client = await getOpenAIClient()
  const model = getModel()

  const response = await client.chat.completions.create({
    model,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: userPrompt },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.5,
  })

  const content = response.choices[0].message.content
  if (!content) throw new Error('OpenAI returned empty response')
  return parseResponse(content)
}

// ─── Grounded Heuristic Generator (Fallback when API key not set or unavailable) ───

function generateGroundedQuestionsFromChunks(
  chunks: AIGenerationRequest['chunks'],
  count: number,
  type: Exclude<QuestionType, 'mixed'>,
  difficulty: Exclude<Difficulty, 'mixed'>
): AIGeneratedQuestion[] {
  const questions: AIGeneratedQuestion[] = []
  const allSentences: Array<{ sentence: string; chunkId: string }> = []

  for (const chunk of chunks) {
    const rawSentences = chunk.content
      .split(/(?<=[.?!])\s+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 25 && !s.startsWith('#'))
    for (const sentence of rawSentences) {
      allSentences.push({ sentence, chunkId: chunk.id })
    }
  }

  if (allSentences.length === 0) {
    for (const chunk of chunks) {
      allSentences.push({ sentence: chunk.content.slice(0, 200).trim(), chunkId: chunk.id })
    }
  }

  for (let i = 0; i < count; i++) {
    const item = allSentences[i % allSentences.length]
    const otherItems = allSentences.filter((_, idx) => idx !== (i % allSentences.length))
    const currentType = type

    if (currentType === 'true_false') {
      questions.push({
        question: `True or False: ${item.sentence}`,
        question_type: 'true_false',
        options: ['True', 'False'],
        correct_answer: 'True',
        explanation: `Supported by source material: "${item.sentence}"`,
        source_chunk_id: item.chunkId,
        difficulty,
      })
    } else if (currentType === 'identification') {
      // Pick key subject / term
      const words = item.sentence.split(/\s+/)
      const candidateTerm = words.slice(0, 3).join(' ').replace(/[,.:;]$/, '')

      questions.push({
        question: `Identify the concept or subject described: "${item.sentence}"`,
        question_type: 'identification',
        options: undefined,
        correct_answer: candidateTerm,
        explanation: `Directly stated in the material: "${item.sentence}"`,
        source_chunk_id: item.chunkId,
        difficulty,
      })
    } else {
      // Multiple choice
      const correctAnswer = item.sentence.length > 80 ? item.sentence.slice(0, 80) + '...' : item.sentence
      const distractors = otherItems.slice(0, 3).map((o) => {
        return o.sentence.length > 80 ? o.sentence.slice(0, 80) + '...' : o.sentence
      })
      while (distractors.length < 3) {
        distractors.push(`Alternative concept option ${distractors.length + 1}`)
      }

      const options = [correctAnswer, ...distractors].sort(() => Math.random() - 0.5)

      questions.push({
        question: `Which of the following statements is directly confirmed by the learning material?`,
        question_type: 'multiple_choice',
        options,
        correct_answer: correctAnswer,
        explanation: `Confirmed by the text: "${item.sentence}"`,
        source_chunk_id: item.chunkId,
        difficulty,
      })
    }
  }

  return questions
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function generateQuestions(
  request: AIGenerationRequest
): Promise<AIGeneratedQuestion[]> {
  const { chunks, questionType, difficulty, count, existingQuestions = [] } = request

  const { resolvedType, resolvedDifficulty } = resolveTypes(questionType, difficulty)

  const hasApiKey = Boolean(
    process.env.AI_API_KEY &&
    !process.env.AI_API_KEY.includes('your-key') &&
    !process.env.AI_API_KEY.startsWith('sk-...')
  )

  if (hasApiKey) {
    try {
      const sourceText = chunks
        .map(
          (c, i) =>
            `[SOURCE ${i + 1}] (ID: ${c.id}, Material: ${c.materialName}${c.pageNumber ? `, Page: ${c.pageNumber}` : ''}${c.sectionTitle ? `, Section: ${c.sectionTitle}` : ''})\n${c.content}`
        )
        .join('\n\n---\n\n')

      const existingNote =
        existingQuestions.length > 0
          ? `\nAVOID questions similar to:\n${existingQuestions.map((q, i) => `${i + 1}. ${q}`).join('\n')}`
          : ''

      const userPrompt = buildPrompt(count, resolvedType, resolvedDifficulty, sourceText, existingNote)

      const result = getProvider() === 'openai'
        ? await generateWithOpenAI(userPrompt)
        : await generateWithGemini(userPrompt)

      if (result && result.length > 0) {
        return result
      }
    } catch (apiError) {
      console.warn('AI API call failed, using source-grounded heuristic fallback:', apiError)
    }
  }

  return generateGroundedQuestionsFromChunks(chunks, count, resolvedType, resolvedDifficulty)
}
