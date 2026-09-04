import type { Difficulty, QuestionType, Question, Material } from './database'

export interface QuizConfig {
  title: string
  materialIds: string[]
  questionCount: number
  difficulty: Difficulty
  questionType: QuestionType
  randomizeQuestions: boolean
  randomizeChoices: boolean
}

export interface GenerationStep {
  id: string
  label: string
  status: 'pending' | 'active' | 'completed' | 'error'
}

export interface GenerationProgress {
  steps: GenerationStep[]
  currentStep: number
  percentage: number
  message: string
}

export interface QuizSession {
  quizId: string
  attemptId: string
  questions: Question[]
  currentIndex: number
  answers: Record<string, string>
  startedAt: string
}

export interface QuizResult {
  attemptId: string
  quizId: string
  quizTitle: string
  score: number
  totalQuestions: number
  percentage: number
  difficulty: Difficulty
  completedAt: string
  answers: ReviewAnswer[]
}

export interface ReviewAnswer {
  questionId: string
  questionText: string
  questionType: string
  options: string[] | null
  selectedAnswer: string
  correctAnswer: string
  isCorrect: boolean
  explanation: string
  sourceChunkId: string | null
  sourceInfo?: {
    materialName: string
    pageNumber: number | null
    sectionTitle: string | null
  }
}

export interface WeakArea {
  topic: string
  incorrectCount: number
  totalCount: number
  accuracy: number
  relatedChunkIds: string[]
  materials: Material[]
}
