'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import {
  Brain,
  CheckCircle2,
  History,
  Plus,
  RotateCcw,
} from 'lucide-react'
import { format } from 'date-fns'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { QuizAttempt } from '@/types/database'

interface AttemptWithQuiz extends QuizAttempt {
  quizzes: {
    id: string
    title: string
    difficulty: string
    question_count: number
    question_type: string
  } | null
}

interface HistoryClientProps {
  attempts: AttemptWithQuiz[]
}

type SortOption = 'newest' | 'oldest' | 'highest' | 'lowest'

export default function HistoryClient({ attempts }: HistoryClientProps) {
  const [sort, setSort] = useState<SortOption>('newest')

  const sorted = useMemo(() => {
    return [...attempts].sort((a, b) => {
      switch (sort) {
        case 'newest':
          return new Date(b.completed_at!).getTime() - new Date(a.completed_at!).getTime()
        case 'oldest':
          return new Date(a.completed_at!).getTime() - new Date(b.completed_at!).getTime()
        case 'highest':
          return b.percentage - a.percentage
        case 'lowest':
          return a.percentage - b.percentage
      }
    })
  }, [attempts, sort])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Quiz History</h1>
          <p className="text-muted-foreground mt-1">
            All your completed quiz attempts
          </p>
        </div>
        <Button asChild>
          <Link href="/quiz/create">
            <Plus className="w-4 h-4 mr-1.5" />
            New Quiz
          </Link>
        </Button>
      </div>

      {attempts.length > 0 && (
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">Sort by:</span>
          <Select value={sort} onValueChange={(v) => setSort(v as SortOption)}>
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest first</SelectItem>
              <SelectItem value="oldest">Oldest first</SelectItem>
              <SelectItem value="highest">Highest score</SelectItem>
              <SelectItem value="lowest">Lowest score</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {sorted.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <History className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold text-lg mb-2">No quiz history yet</h3>
            <p className="text-muted-foreground text-sm mb-6">
              You haven&apos;t completed any quizzes yet. Create your first quiz and start practicing.
            </p>
            <Button asChild>
              <Link href="/quiz/create">
                <Brain className="w-4 h-4 mr-1.5" />
                Create a Quiz
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {sorted.map((attempt) => {
            const quiz = attempt.quizzes
            return (
              <Card key={attempt.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 space-y-1">
                      <p className="font-semibold truncate">{quiz?.title ?? 'Untitled Quiz'}</p>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm text-muted-foreground">
                          {quiz?.question_count ?? attempt.total_questions} questions
                        </span>
                        {quiz?.difficulty && (
                          <Badge variant="secondary" className="text-xs capitalize">
                            {quiz.difficulty}
                          </Badge>
                        )}
                        {attempt.completed_at && (
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(attempt.completed_at), 'MMM d, yyyy')}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <p className="font-bold text-lg leading-none">
                          {attempt.score}/{attempt.total_questions}
                        </p>
                        <Badge
                          className="mt-1"
                          variant={
                            attempt.percentage >= 80
                              ? 'default'
                              : attempt.percentage >= 60
                              ? 'secondary'
                              : 'destructive'
                          }
                        >
                          {attempt.percentage.toFixed(0)}%
                        </Badge>
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/quiz/${attempt.quiz_id}/results/${attempt.id}`}>
                            <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                            Review
                          </Link>
                        </Button>
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/quiz/${attempt.quiz_id}`}>
                            <RotateCcw className="w-3.5 h-3.5 mr-1" />
                            Retake
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
