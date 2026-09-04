'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  BookOpen,
  Brain,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  History,
  Plus,
  RotateCcw,
  XCircle,
} from 'lucide-react'
import { format } from 'date-fns'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import type { Quiz, QuizAttempt } from '@/types/database'

interface ReviewAnswer {
  questionId: string
  questionText: string
  questionType: string
  options: string[] | null
  selectedAnswer: string
  correctAnswer: string
  isCorrect: boolean
  explanation: string
  sourceChunkId: string | null
  sourceInfo: {
    materialName: string
    pageNumber: number | null
    sectionTitle: string | null
  } | null
}

interface ResultsClientProps {
  attempt: QuizAttempt
  quiz: Quiz | null
  answers: ReviewAnswer[]
}

export default function ResultsClient({ attempt, quiz, answers }: ResultsClientProps) {
  const [showReview, setShowReview] = useState(false)
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())

  const percentage = attempt.percentage
  const grade =
    percentage >= 90
      ? { label: 'Excellent!', color: 'text-green-600' }
      : percentage >= 80
      ? { label: 'Great job!', color: 'text-green-600' }
      : percentage >= 70
      ? { label: 'Good work!', color: 'text-blue-600' }
      : percentage >= 60
      ? { label: 'Keep practicing!', color: 'text-amber-600' }
      : { label: 'Needs improvement.', color: 'text-red-600' }

  function toggleAnswer(id: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Score Card */}
      <Card>
        <CardContent className="pt-8 pb-8 text-center space-y-3">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
            <Brain className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">{quiz?.title ?? 'Quiz Results'}</h1>
          <div>
            <p className="text-5xl font-bold text-primary">
              {attempt.score} / {attempt.total_questions}
            </p>
            <p className="text-2xl font-semibold text-muted-foreground mt-1">
              {percentage.toFixed(0)}%
            </p>
          </div>
          <p className={`text-lg font-medium ${grade.color}`}>{grade.label}</p>

          <div className="flex flex-wrap justify-center gap-4 text-sm text-muted-foreground pt-2">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              {attempt.score} correct
            </span>
            <span className="flex items-center gap-1.5">
              <XCircle className="w-4 h-4 text-destructive" />
              {attempt.total_questions - attempt.score} incorrect
            </span>
            <span>
              {quiz?.difficulty && (
                <Badge variant="secondary" className="capitalize">
                  {quiz.difficulty}
                </Badge>
              )}
            </span>
            {attempt.completed_at && (
              <span>{format(new Date(attempt.completed_at), 'MMM d, yyyy')}</span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex flex-wrap gap-3 justify-center">
        <Button onClick={() => setShowReview(!showReview)} variant="outline">
          <BookOpen className="w-4 h-4 mr-1.5" />
          {showReview ? 'Hide' : 'Review'} Answers
        </Button>
        <Button variant="outline" asChild>
          <Link href={`/quiz/${attempt.quiz_id}`}>
            <RotateCcw className="w-4 h-4 mr-1.5" />
            Retake Quiz
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/quiz/create">
            <Plus className="w-4 h-4 mr-1.5" />
            New Quiz
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/history">
            <History className="w-4 h-4 mr-1.5" />
            Quiz History
          </Link>
        </Button>
        <Button variant="ghost" asChild>
          <Link href="/dashboard">Back to Dashboard</Link>
        </Button>
      </div>

      {/* Answer Review */}
      {showReview && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Answer Review</h2>
          {answers.map((answer, index) => (
            <Card
              key={answer.questionId}
              className={
                answer.isCorrect ? 'border-green-200' : 'border-red-200'
              }
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2 min-w-0">
                    {answer.isCorrect ? (
                      <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                    )}
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground mb-1">
                        Question {index + 1}
                      </p>
                      <CardTitle className="text-sm font-medium leading-relaxed">
                        {answer.questionText}
                      </CardTitle>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleAnswer(answer.questionId)}
                    className="text-muted-foreground hover:text-foreground shrink-0"
                    aria-label={expandedIds.has(answer.questionId) ? 'Collapse' : 'Expand'}
                  >
                    {expandedIds.has(answer.questionId) ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </CardHeader>

              {expandedIds.has(answer.questionId) && (
                <CardContent className="pt-0 space-y-3">
                  <Separator />

                  {/* Answers */}
                  <div className="space-y-1.5 text-sm">
                    <div className="flex items-start gap-2">
                      <span className="text-muted-foreground shrink-0">Your answer:</span>
                      <span
                        className={answer.isCorrect ? 'text-green-700 font-medium' : 'text-destructive font-medium'}
                      >
                        {answer.selectedAnswer || '(not answered)'}
                      </span>
                    </div>
                    {!answer.isCorrect && (
                      <div className="flex items-start gap-2">
                        <span className="text-muted-foreground shrink-0">Correct answer:</span>
                        <span className="text-green-700 font-medium">
                          {answer.correctAnswer}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Explanation */}
                  {answer.explanation && (
                    <div className="bg-muted/50 rounded-lg p-3 text-sm">
                      <p className="font-medium text-xs text-muted-foreground uppercase tracking-wide mb-1">
                        Explanation
                      </p>
                      <p>{answer.explanation}</p>
                    </div>
                  )}

                  {/* Source */}
                  {answer.sourceInfo && (
                    <div className="text-xs text-muted-foreground border border-border rounded-lg p-2.5">
                      <p className="font-medium mb-0.5">Source:</p>
                      <p>{answer.sourceInfo.materialName}</p>
                      {answer.sourceInfo.pageNumber && (
                        <p>Page {answer.sourceInfo.pageNumber}</p>
                      )}
                      {answer.sourceInfo.sectionTitle && (
                        <p>{answer.sourceInfo.sectionTitle}</p>
                      )}
                    </div>
                  )}
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
