import type { Difficulty, QuestionType } from './database'

export interface AIGeneratedQuestion {
  question: string
  question_type: Exclude<QuestionType, 'mixed'>
  options?: string[]
  correct_answer: string
  explanation: string
  source_chunk_id: string
  difficulty: Exclude<Difficulty, 'mixed'>
}

export interface AIGenerationRequest {
  chunks: ChunkContext[]
  questionType: QuestionType
  difficulty: Difficulty
  count: number
  existingQuestions?: string[]
}

export interface ChunkContext {
  id: string
  content: string
  materialName: string
  pageNumber?: number | null
  sectionTitle?: string | null
}

export interface AIValidationResult {
  isValid: boolean
  issues: string[]
  question?: AIGeneratedQuestion
}

export interface EmbeddingResult {
  embedding: number[]
  tokenCount: number
}

export interface VectorSearchResult {
  chunk_id: string
  content: string
  similarity: number
  material_id: string
  page_number: number | null
  section_title: string | null
}
