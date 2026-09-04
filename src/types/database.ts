// Database types matching Supabase schema

export type ProcessingStatus = 'uploading' | 'processing' | 'completed' | 'failed'

export type Difficulty = 'easy' | 'medium' | 'hard' | 'mixed'

export type QuestionType = 'multiple_choice' | 'true_false' | 'identification' | 'mixed'

export interface Profile {
  id: string
  full_name: string
  email: string
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export interface Material {
  id: string
  user_id: string
  filename: string
  original_filename: string
  file_type: string
  file_size: number
  storage_path: string
  processing_status: ProcessingStatus
  extracted_text: string | null
  uploaded_at: string
  updated_at: string
}

export interface DocumentChunk {
  id: string
  material_id: string
  chunk_index: number
  content: string
  page_number: number | null
  section_title: string | null
  embedding: number[] | null
  created_at: string
}

export interface Quiz {
  id: string
  user_id: string
  title: string
  difficulty: Difficulty
  question_count: number
  question_type: QuestionType
  created_at: string
}

export interface QuizMaterial {
  quiz_id: string
  material_id: string
}

export interface Question {
  id: string
  quiz_id: string
  question_text: string
  question_type: Exclude<QuestionType, 'mixed'>
  options: string[] | null
  correct_answer: string
  explanation: string
  source_chunk_id: string | null
  difficulty: Exclude<Difficulty, 'mixed'>
  question_order: number
  created_at: string
}

export interface QuizAttempt {
  id: string
  quiz_id: string
  user_id: string
  score: number
  total_questions: number
  percentage: number
  started_at: string
  completed_at: string | null
}

export interface Answer {
  id: string
  attempt_id: string
  question_id: string
  selected_answer: string
  is_correct: boolean
  answered_at: string
}

// Extended types with joined data
export interface MaterialWithStats extends Material {
  chunk_count?: number
}

export interface QuizWithMaterials extends Quiz {
  materials?: Material[]
  latest_attempt?: QuizAttempt | null
}

export interface QuizAttemptWithDetails extends QuizAttempt {
  quiz?: Quiz
  answers?: AnswerWithQuestion[]
}

export interface AnswerWithQuestion extends Answer {
  question?: Question
}

export interface QuizWithQuestions extends Quiz {
  questions: Question[]
  materials: Material[]
}
