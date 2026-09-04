import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { generateEmbedding } from '@/lib/ai/embeddings'
import { generateQuestions } from '@/lib/ai/quiz-generator'
import { validateQuestion } from '@/lib/ai/validator'
import type { ChunkContext } from '@/types/ai'
import type { Difficulty, QuestionType } from '@/types/database'

const generateSchema = z.object({
  title: z.string().min(1).max(200),
  materialIds: z.array(z.string().uuid()).min(1),
  questionCount: z.number().int().min(1).max(50),
  difficulty: z.enum(['easy', 'medium', 'hard', 'mixed']),
  questionType: z.enum(['multiple_choice', 'true_false', 'identification', 'mixed']),
  randomizeQuestions: z.boolean(),
  randomizeChoices: z.boolean(),
})

const MAX_RETRIES_PER_QUESTION = 3

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

  const parsed = generateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid quiz configuration' }, { status: 400 })
  }

  const config = parsed.data
  const serviceClient = createServiceClient()

  // Verify user owns all selected materials and they are completed
  const { data: materials, error: matError } = await supabase
    .from('materials')
    .select('id, original_filename, processing_status')
    .in('id', config.materialIds)
    .eq('user_id', user.id)

  if (matError || !materials || materials.length === 0) {
    return NextResponse.json({ error: 'Materials not found.' }, { status: 400 })
  }

  const notReady = materials.filter((m) => m.processing_status !== 'completed')
  if (notReady.length > 0) {
    return NextResponse.json(
      { error: `Some materials are still processing: ${notReady.map((m) => m.original_filename).join(', ')}` },
      { status: 400 }
    )
  }

  // Check chunks exist for these materials
  const { count: chunkCount } = await serviceClient
    .from('document_chunks')
    .select('*', { count: 'exact', head: true })
    .in('material_id', config.materialIds)

  if (!chunkCount || chunkCount === 0) {
    return NextResponse.json(
      { error: 'No content found in the selected materials. Please re-upload them.' },
      { status: 422 }
    )
  }

  console.log(`Generating quiz: ${chunkCount} chunks available across ${materials.length} materials`)

  let quizId: string | null = null

  try {
    // Create quiz record
    const { data: quiz, error: quizError } = await supabase
      .from('quizzes')
      .insert({
        user_id: user.id,
        title: config.title,
        difficulty: config.difficulty,
        question_count: config.questionCount,
        question_type: config.questionType,
      })
      .select()
      .single()

    if (quizError || !quiz) {
      console.error('Quiz insert error:', quizError)
      return NextResponse.json({ error: 'Failed to create quiz' }, { status: 500 })
    }

    quizId = quiz.id

    // Link materials to quiz
    await supabase.from('quiz_materials').insert(
      config.materialIds.map((mid) => ({ quiz_id: quiz.id, material_id: mid }))
    )

    // Retrieve chunks — try vector search first, fall back to spread sampling
    const materialNameMap = Object.fromEntries(
      materials.map((m) => [m.id, m.original_filename])
    )

    const chunks = await retrieveChunks(
      config.materialIds,
      materialNameMap,
      config.questionCount,
      serviceClient
    )

    console.log(`Retrieved ${chunks.length} chunks for generation`)

    if (chunks.length === 0) {
      await supabase.from('quizzes').delete().eq('id', quiz.id)
      return NextResponse.json(
        { error: "There isn't enough information in the selected materials to generate questions." },
        { status: 422 }
      )
    }

    // Generate and validate questions
    const validatedQuestions = await generateValidatedQuestions(
      chunks,
      config.questionCount,
      config.questionType as QuestionType,
      config.difficulty as Difficulty
    )

    if (validatedQuestions.length === 0) {
      await supabase.from('quizzes').delete().eq('id', quiz.id)
      return NextResponse.json(
        { error: "The AI could not generate valid questions from these materials. Try uploading more detailed content." },
        { status: 422 }
      )
    }

    // Update question count if we got fewer than requested
    if (validatedQuestions.length < config.questionCount) {
      await supabase
        .from('quizzes')
        .update({ question_count: validatedQuestions.length })
        .eq('id', quiz.id)
    }

    // Randomize order if requested
    const orderedQuestions = config.randomizeQuestions
      ? shuffleArray([...validatedQuestions])
      : validatedQuestions

    // Randomize choices if requested
    const finalQuestions = orderedQuestions.map((q, i) => ({
      ...q,
      options: config.randomizeChoices && q.options
        ? shuffleArray([...q.options])
        : q.options,
      question_order: i,
    }))

    // Save questions using service client (bypasses RLS)
    const questionRows = finalQuestions.map((q) => ({
      quiz_id: quiz.id,
      question_text: q.question,
      question_type: q.question_type,
      options: q.options ?? null,
      correct_answer: q.correct_answer,
      explanation: q.explanation,
      source_chunk_id: q.source_chunk_id || null,
      difficulty: config.difficulty === 'mixed' ? q.difficulty : config.difficulty,
      question_order: q.question_order,
    }))

    const { error: qInsertError } = await serviceClient
      .from('questions')
      .insert(questionRows)

    if (qInsertError) {
      console.error('Question insert error:', qInsertError)
      await supabase.from('quizzes').delete().eq('id', quiz.id)
      return NextResponse.json({ error: 'Failed to save questions' }, { status: 500 })
    }

    const warning = validatedQuestions.length < config.questionCount
      ? `Only ${validatedQuestions.length} reliable questions could be generated from the selected materials. Try uploading more material or reduce the question count.`
      : null

    return NextResponse.json({
      quizId: quiz.id,
      questionCount: validatedQuestions.length,
      warning,
    })

  } catch (error) {
    console.error('Quiz generation error:', error)
    // Clean up quiz if it was created
    if (quizId) {
      await supabase.from('quizzes').delete().eq('id', quizId)
    }
    return NextResponse.json(
      { error: `Quiz generation failed: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    )
  }
}

/**
 * Retrieve chunks for generation.
 * 1. Try semantic vector search (best quality)
 * 2. Fall back to evenly spread sampling across all chunks
 */
async function retrieveChunks(
  materialIds: string[],
  materialNameMap: Record<string, string>,
  questionCount: number,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  serviceClient: any
): Promise<ChunkContext[]> {
  const needed = Math.max(questionCount * 4, 30)

  // Try vector search
  try {
    const queryText = `Key concepts, definitions, facts, and important information from the study material`
    const { embedding } = await generateEmbedding(queryText)

    const { data: results, error } = await serviceClient.rpc('search_document_chunks', {
      query_embedding: embedding,
      target_material_ids: materialIds,
      match_threshold: 0.0, // Very low threshold — get anything
      match_count: needed,
    })

    if (!error && results && results.length >= Math.min(5, questionCount)) {
      console.log(`Vector search returned ${results.length} chunks`)
      return results.map((r: {
        chunk_id: string
        content: string
        material_id: string
        page_number: number | null
        section_title: string | null
      }) => ({
        id: r.chunk_id,
        content: r.content,
        materialName: materialNameMap[r.material_id] ?? 'Material',
        pageNumber: r.page_number,
        sectionTitle: r.section_title,
      }))
    }
  } catch (e) {
    console.log('Vector search failed, using fallback:', e)
  }

  // Fallback: spread sampling — get chunks evenly distributed across materials
  console.log('Using fallback chunk sampling')
  const perMaterial = Math.ceil(needed / materialIds.length)

  const allChunks: ChunkContext[] = []

  for (const materialId of materialIds) {
    const { data: chunks } = await serviceClient
      .from('document_chunks')
      .select('id, content, material_id, page_number, section_title, chunk_index')
      .eq('material_id', materialId)
      .order('chunk_index', { ascending: true })
      .limit(perMaterial)

    if (chunks) {
      for (const c of chunks) {
        allChunks.push({
          id: c.id,
          content: c.content,
          materialName: materialNameMap[c.material_id] ?? 'Material',
          pageNumber: c.page_number,
          sectionTitle: c.section_title,
        })
      }
    }
  }

  console.log(`Fallback sampling returned ${allChunks.length} chunks`)
  return allChunks
}

/**
 * Generate questions with validation and retry logic.
 * Generates in small batches to get diverse questions.
 */
async function generateValidatedQuestions(
  chunks: ChunkContext[],
  targetCount: number,
  questionType: QuestionType,
  difficulty: Difficulty
) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const validatedQuestions: any[] = []
  const existingTexts: string[] = []
  let totalAttempts = 0
  const maxAttempts = targetCount * MAX_RETRIES_PER_QUESTION

  while (validatedQuestions.length < targetCount && totalAttempts < maxAttempts) {
    totalAttempts++

    const remaining = targetCount - validatedQuestions.length
    const batchSize = Math.min(3, remaining)

    // Pick a diverse spread of chunks for this batch
    const chunkSubset = pickDiverseChunks(chunks, 6, totalAttempts)

    try {
      const generated = await generateQuestions({
        chunks: chunkSubset,
        questionType,
        difficulty,
        count: batchSize,
        existingQuestions: existingTexts,
      })

      if (!generated || generated.length === 0) {
        console.log('Generation returned 0 questions, retrying...')
        continue
      }

      for (const q of generated) {
        if (validatedQuestions.length >= targetCount) break

        const result = validateQuestion(
          q,
          chunkSubset,
          existingTexts,
          questionType,
          difficulty
        )

        if (result.isValid && result.question) {
          validatedQuestions.push(result.question)
          existingTexts.push(q.question)
          console.log(`Question ${validatedQuestions.length}/${targetCount} validated`)
        } else {
          console.log('Question failed validation:', result.issues)
        }
      }
    } catch (error) {
      console.error(`Generation attempt ${totalAttempts} failed:`, error)
      // Brief pause before retry to avoid rate limits
      await new Promise((r) => setTimeout(r, 1000))
    }
  }

  console.log(`Generated ${validatedQuestions.length}/${targetCount} questions in ${totalAttempts} attempts`)
  return validatedQuestions
}

/**
 * Pick a diverse set of chunks by spreading across the array.
 */
function pickDiverseChunks(
  chunks: ChunkContext[],
  count: number,
  seed: number
): ChunkContext[] {
  if (chunks.length <= count) return chunks

  const result: ChunkContext[] = []
  const step = chunks.length / count

  for (let i = 0; i < count; i++) {
    // Offset by seed to get different chunks on each call
    const idx = Math.floor((i * step + seed) % chunks.length)
    result.push(chunks[idx])
  }

  return result
}

function shuffleArray<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}
