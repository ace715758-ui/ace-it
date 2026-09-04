'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import {
  Award,
  BookOpen,
  Brain,
  CheckCircle2,
  Clock,
  Filter,
  History,
  Plus,
  RotateCcw,
  TrendingUp,
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
type DifficultyFilter = 'all' | 'easy' | 'medium' | 'hard'

function formatDateSafe(dateStr?: string | null): string {
  if (!dateStr) return 'Recently'
  try {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return 'Recently'
    return format(d, 'MMM d, yyyy')
  } catch {
    return 'Recently'
  }
}

export default function HistoryClient({ attempts }: HistoryClientProps) {
  const [sort, setSort] = useState<SortOption>('newest')
  const [difficultyFilter, setDifficultyFilter] = useState<DifficultyFilter>('all')

  // Calculate summary stats
  const totalAttempts = attempts.length
  const avgScore =
    totalAttempts > 0
      ? Math.round(
          attempts.reduce((sum, a) => sum + (Number(a.percentage) || 0), 0) / totalAttempts
        )
      : 0
  const highestScore =
    totalAttempts > 0
      ? Math.max(...attempts.map((a) => Math.round(Number(a.percentage) || 0)))
      : 0

  // Filter and sort
  const filteredAndSorted = useMemo(() => {
    let list = [...attempts]

    // Difficulty filter
    if (difficultyFilter !== 'all') {
      list = list.filter((a) => {
        const diff = (a.quizzes?.difficulty || '').toLowerCase()
        return diff === difficultyFilter
      })
    }

    // Sort
    return list.sort((a, b) => {
      const scoreA = Number(a.percentage) || 0
      const scoreB = Number(b.percentage) || 0

      const timeA = a.completed_at ? new Date(a.completed_at).getTime() : 0
      const timeB = b.completed_at ? new Date(b.completed_at).getTime() : 0

      switch (sort) {
        case 'newest':
          return timeB - timeA
        case 'oldest':
          return timeA - timeB
        case 'highest':
          return scoreB - scoreA
        case 'lowest':
          return scoreA - scoreB
      }
    })
  }, [attempts, sort, difficultyFilter])

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/60 dark:border-indigo-800/40 text-xs font-semibold text-indigo-600 dark:text-indigo-400 mb-2">
            <History className="w-3.5 h-3.5" />
            <span>Practice Records</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">Quiz History</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Review your past quiz attempts, answer rationales, and exam progress.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button asChild className="rounded-xl font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20">
            <Link href="/quiz/create">
              <Plus className="w-4 h-4 mr-1.5" />
              New Practice Quiz
            </Link>
          </Button>
        </div>
      </div>

      {/* Summary Stat Banner */}
      {totalAttempts > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl border border-border/80 bg-card shadow-xs flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-extrabold text-foreground">{totalAttempts}</p>
              <p className="text-xs text-muted-foreground">Quizzes Completed</p>
            </div>
          </div>

          <div className="p-4 rounded-2xl border border-border/80 bg-card shadow-xs flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-extrabold text-foreground">{highestScore}%</p>
              <p className="text-xs text-muted-foreground">Personal Best Score</p>
            </div>
          </div>

          <div className="p-4 rounded-2xl border border-border/80 bg-card shadow-xs flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-extrabold text-foreground">{avgScore}%</p>
              <p className="text-xs text-muted-foreground">Average Mastery</p>
            </div>
          </div>
        </div>
      )}

      {/* Filters Bar */}
      {attempts.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-muted/40 border border-border/70">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground ml-1" />
            <span className="text-xs font-semibold text-muted-foreground">Filters:</span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Sort Select */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Sort:</span>
              <Select value={sort} onValueChange={(v) => setSort(v as SortOption)}>
                <SelectTrigger className="w-36 h-9 rounded-xl text-xs bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl text-xs">
                  <SelectItem value="newest">Newest first</SelectItem>
                  <SelectItem value="oldest">Oldest first</SelectItem>
                  <SelectItem value="highest">Highest score</SelectItem>
                  <SelectItem value="lowest">Lowest score</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Difficulty Filter */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Difficulty:</span>
              <Select value={difficultyFilter} onValueChange={(v) => setDifficultyFilter(v as DifficultyFilter)}>
                <SelectTrigger className="w-36 h-9 rounded-xl text-xs bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl text-xs">
                  <SelectItem value="all">All Difficulties</SelectItem>
                  <SelectItem value="easy">Easy only</SelectItem>
                  <SelectItem value="medium">Medium only</SelectItem>
                  <SelectItem value="hard">Hard only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      )}

      {/* Attempts List */}
      {filteredAndSorted.length === 0 ? (
        <Card className="rounded-2xl border-border/80 shadow-sm">
          <CardContent className="py-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto mb-4">
              <History className="w-8 h-8" />
            </div>
            <h3 className="font-bold text-lg text-foreground mb-1">
              {attempts.length === 0 ? 'No quiz history yet' : 'No quizzes match your filter'}
            </h3>
            <p className="text-muted-foreground text-xs sm:text-sm max-w-sm mx-auto mb-6">
              {attempts.length === 0
                ? 'You haven’t completed any quizzes yet. Create your first quiz to start tracking your progress.'
                : 'Try adjusting your difficulty filter or sort order to see more practice attempts.'}
            </p>
            {attempts.length === 0 ? (
              <Button asChild className="rounded-xl font-semibold bg-indigo-600 hover:bg-indigo-700 text-white">
                <Link href="/quiz/create">
                  <Brain className="w-4 h-4 mr-1.5" />
                  Create a Quiz Now
                </Link>
              </Button>
            ) : (
              <Button variant="outline" onClick={() => setDifficultyFilter('all')} className="rounded-xl text-xs">
                Reset Filter
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3.5">
          {filteredAndSorted.map((attempt) => {
            const quiz = attempt.quizzes
            const scorePct = Math.round(Number(attempt.percentage) || 0)
            const isGreat = scorePct >= 80
            const isPassing = scorePct >= 60

            return (
              <Card key={attempt.id} className="rounded-2xl border-border/80 shadow-xs hover:shadow-md transition-all group overflow-hidden">
                <CardContent className="p-4 sm:p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    {/* Left Quiz Info */}
                    <div className="min-w-0 space-y-1.5 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-bold text-sm sm:text-base text-foreground truncate group-hover:text-indigo-600 transition-colors">
                          {quiz?.title ?? 'Practice Quiz'}
                        </p>
                        {quiz?.difficulty && (
                          <DifficultyBadge difficulty={quiz.difficulty} />
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1 font-medium">
                          <BookOpen className="w-3.5 h-3.5 text-indigo-500" />
                          {quiz?.question_count ?? attempt.total_questions} questions
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          Completed {formatDateSafe(attempt.completed_at)}
                        </span>
                      </div>
                    </div>

                    {/* Right Score & Actions */}
                    <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 pt-3 sm:pt-0 shrink-0">
                      {/* Score Badge */}
                      <div className="text-left sm:text-right">
                        <div className="flex items-center sm:justify-end gap-2">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-extrabold ${
                              isGreat
                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                                : isPassing
                                ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                                : 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                            }`}
                          >
                            {scorePct}%
                          </span>
                          <span className="text-xs font-semibold text-muted-foreground">
                            ({attempt.score}/{attempt.total_questions})
                          </span>
                        </div>
                      </div>

                      {/* Buttons */}
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" asChild className="rounded-xl h-9 text-xs font-semibold hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-950/60">
                          <Link href={`/quiz/${attempt.quiz_id}/results/${attempt.id}`}>
                            <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-500" />
                            Review
                          </Link>
                        </Button>
                        <Button variant="outline" size="sm" asChild className="rounded-xl h-9 text-xs font-semibold hover:bg-muted/80">
                          <Link href={`/quiz/${attempt.quiz_id}`}>
                            <RotateCcw className="w-3.5 h-3.5 mr-1 text-indigo-500" />
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

function DifficultyBadge({ difficulty }: { difficulty?: string }) {
  const diff = (difficulty || 'medium').toLowerCase()
  if (diff === 'easy') {
    return (
      <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800">
        Easy
      </Badge>
    )
  }
  if (diff === 'hard') {
    return (
      <Badge variant="outline" className="text-[10px] bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 border-rose-200 dark:border-rose-800">
        Hard
      </Badge>
    )
  }
  return (
    <Badge variant="outline" className="text-[10px] bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border-amber-200 dark:border-amber-800">
      Medium
    </Badge>
  )
}

