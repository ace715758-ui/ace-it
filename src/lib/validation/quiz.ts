import { z } from 'zod'

export const quizConfigSchema = z.object({
  title: z
    .string()
    .min(1, 'Quiz title is required')
    .max(200, 'Title must be less than 200 characters'),
  materialIds: z
    .array(z.string().uuid())
    .min(1, 'Select at least one material'),
  questionCount: z
    .number()
    .int()
    .min(1, 'At least 1 question is required')
    .max(50, 'Maximum 50 questions allowed'),
  difficulty: z.enum(['easy', 'medium', 'hard', 'mixed']),
  questionType: z.enum(['multiple_choice', 'true_false', 'identification', 'mixed']),
  randomizeQuestions: z.boolean(),
  randomizeChoices: z.boolean(),
  timeLimitPerQuestion: z.number().int().min(0).max(300),
})

export const profileUpdateSchema = z.object({
  fullName: z
    .string()
    .min(2, 'Full name must be at least 2 characters')
    .max(100, 'Full name must be less than 100 characters'),
  headline: z
    .string()
    .max(100, 'Headline must be less than 100 characters')
    .optional(),
  avatarUrl: z
    .string()
    .url('Invalid URL format')
    .or(z.literal(''))
    .optional(),
})

export type QuizConfigInput = z.infer<typeof quizConfigSchema>
export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>
