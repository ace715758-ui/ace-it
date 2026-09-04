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
  Sparkles,
  Target,
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

function formatDateSafe(val: string | null | undefined, fmt: string = 'MMM d, yyyy'): string {
  if (!val) return 'Recent'
  try {
    const d = new Date(val)
    if (isNaN(d.getTime())) return 'Recent'
    return format(d, fmt)
  } catch {
    return 'Recent'
  }
}

export default function ResultsClient({ attempt, quiz, answers }: ResultsClientProps) {
  const [showReview, setShowReview] = useState(false)
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())

  const percentage = Number(attempt.percentage) || 0
  const score = Number(attempt.score) || 0
  const totalQuestions = Number(attempt.total_questions) || (answers?.length > 0 ? answers.length : 1)

  const grade =
    percentage >= 90
      ? { label: 'Excellent!', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/30' }
      : percentage >= 75
      ? { label: 'Great work!', color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-500/10 border-indigo-500/30' }
      : percentage >= 60
      ? { label: 'Keep practicing!', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-500/10 border-amber-500/30' }
      : { label: 'Review the material and try again!', color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-500/10 border-rose-500/30' }

  function toggleAnswer(id: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      {/* Score Card */}
      <Card className="rounded-3xl border-border/70 shadow-md overflow-hidden relative">
        <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-indigo-500 via-sky-500 to-emerald-500" />
        <CardContent className="pt-8 pb-8 text-center space-y-4">
          {percentage >= 70 ? (
            <div className="relative mx-auto flex items-center justify-center my-2">
              {/* Ambient celebratory glow halo */}
              <div className="absolute w-24 h-24 rounded-full bg-gradient-to-tr from-amber-400/30 via-primary/30 to-violet-500/30 blur-xl animate-pulse" />
              <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-tr from-amber-500/15 via-primary/10 to-violet-500/15 border-2 border-amber-400/40 dark:border-amber-400/50 flex items-center justify-center shadow-lg shadow-amber-500/15 backdrop-blur-sm group hover:scale-105 transition-transform duration-300">
                <Sparkles className="w-10 h-10 sm:w-12 sm:h-12 text-amber-500 dark:text-amber-400 drop-shadow-md" />
                <div className="absolute -top-1.5 -right-1.5 px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 text-white text-[10px] font-black uppercase tracking-wider shadow-md">
                  PASSED
                </div>
              </div>
            </div>
          ) : (
            <div className="w-20 h-20 rounded-2xl bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto shadow-inner my-2">
              <Brain className="w-10 h-10" />
            </div>
          )}

          <div>
            <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Ace-It! Quiz Results</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground">
              {quiz?.title ?? 'Quiz Results'}
            </h1>
          </div>

          <div className="py-2">
            <p className="text-5xl sm:text-6xl font-black text-indigo-600 dark:text-indigo-400 tracking-tight">
              {score} / {totalQuestions}
            </p>
            <p className="text-2xl font-bold text-muted-foreground mt-1">
              {percentage.toFixed(0)}%
            </p>
          </div>

          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border text-sm font-bold shadow-xs mx-auto ${grade.bg} ${grade.color}">
            <span>{grade.label}</span>
          </div>

          <div className="flex flex-wrap justify-center items-center gap-4 text-xs font-medium text-muted-foreground pt-3 border-t border-border/50">
            <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold">
              <CheckCircle2 className="w-4 h-4" />
              {score} correct
            </span>
            <span className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400 font-semibold">
              <XCircle className="w-4 h-4" />
              {Math.max(0, totalQuestions - score)} incorrect
            </span>
            {quiz?.difficulty && (
              <Badge variant="secondary" className="capitalize text-[11px] rounded-lg">
                {quiz.difficulty}
              </Badge>
            )}
            <span>Completed {formatDateSafe(attempt.completed_at)}</span>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2.5 justify-center">
        <Button
          onClick={() => setShowReview(!showReview)}
          variant="outline"
          className="rounded-xl border-border/80 font-medium"
        >
          <BookOpen className="w-4 h-4 mr-1.5" />
          {showReview ? 'Hide' : 'Review'} Answers ({answers.length})
        </Button>

        <Button variant="outline" asChild className="rounded-xl border-border/80 font-medium">
          <Link href={`/quiz/${attempt.quiz_id}`}>
            <RotateCcw className="w-4 h-4 mr-1.5" />
            Retake Quiz
          </Link>
        </Button>

        <Button
          variant="outline"
          asChild
          className="rounded-xl border-indigo-200 dark:border-indigo-900/60 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 font-medium"
        >
          <Link href="/practice">
            <Target className="w-4 h-4 mr-1.5" />
            Practice Weak Areas
          </Link>
        </Button>

        <Button
          asChild
          className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium shadow-sm shadow-indigo-600/20"
        >
          <Link href="/quiz/create">
            <Plus className="w-4 h-4 mr-1.5" />
            Generate New Quiz
          </Link>
        </Button>

        <Button variant="ghost" asChild className="rounded-xl font-medium">
          <Link href="/history">
            <History className="w-4 h-4 mr-1.5" />
            All History
          </Link>
        </Button>
      </div>

      {/* Answer Review Section */}
      {showReview && (
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-foreground">Detailed Question Review</h2>
            <div className="text-xs text-muted-foreground">
              Click any question to view its explanation and citation.
            </div>
          </div>

          {answers.map((answer, index) => {
            const isExpanded = expandedIds.has(answer.questionId)
            return (
              <Card
                key={answer.questionId}
                className={`rounded-2xl border transition-all ${
                  answer.isCorrect
                    ? 'border-emerald-200/80 dark:border-emerald-900/40 bg-emerald-500/[0.02]'
                    : 'border-rose-200/80 dark:border-rose-900/40 bg-rose-500/[0.02]'
                }`}
              >
                <CardHeader className="pb-3 pt-4 cursor-pointer" onClick={() => toggleAnswer(answer.questionId)}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      {answer.isCorrect ? (
                        <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                          <CheckCircle2 className="w-4 h-4" />
                        </div>
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-400 flex items-center justify-center shrink-0 mt-0.5">
                          <XCircle className="w-4 h-4" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                            Question {index + 1}
                          </span>
                          <Badge variant="outline" className="text-[10px] capitalize py-0 px-1.5">
                            {answer.questionType.replace('_', ' ')}
                          </Badge>
                        </div>
                        <CardTitle className="text-sm font-semibold leading-relaxed text-foreground">
                          {answer.questionText}
                        </CardTitle>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleAnswer(answer.questionId)
                      }}
                      className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 shrink-0"
                      aria-label={isExpanded ? 'Collapse' : 'Expand'}
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </CardHeader>

                {isExpanded && (
                  <CardContent className="pt-0 pb-4 space-y-3.5">
                    <Separator className="opacity-60" />

                    {/* Answers Breakdown */}
                    <div className="space-y-2 text-xs">
                      <div className="p-2.5 rounded-xl bg-background/80 border border-border/50 flex items-start gap-2">
                        <span className="text-muted-foreground font-semibold shrink-0">Your Answer:</span>
                        <span
                          className={`font-bold ${
                            answer.isCorrect
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-rose-600 dark:text-rose-400'
                          }`}
                        >
                          {answer.selectedAnswer || '(no answer provided)'}
                        </span>
                      </div>

                      {!answer.isCorrect && (
                        <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-start gap-2">
                          <span className="text-emerald-700 dark:text-emerald-300 font-semibold shrink-0">Correct Answer:</span>
                          <span className="text-emerald-700 dark:text-emerald-300 font-bold">
                            {answer.correctAnswer}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Explanation */}
                    {answer.explanation && (
                      <div className="p-3 rounded-xl bg-muted/40 border border-border/40 text-xs space-y-1">
                        <div className="font-bold text-foreground flex items-center gap-1.5">
                          <Brain className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                          Explanation
                        </div>
                        <p className="text-muted-foreground leading-relaxed">{answer.explanation}</p>
                      </div>
                    )}

                    {/* Source Citation */}
                    {answer.sourceInfo && (
                      <div className="p-2.5 rounded-xl bg-muted/20 border border-border/30 text-[11px] text-muted-foreground flex items-center gap-2">
                        <BookOpen className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                        <span className="truncate">
                          Source: <strong className="text-foreground">{answer.sourceInfo.materialName}</strong>
                          {answer.sourceInfo.pageNumber ? ` (Page ${answer.sourceInfo.pageNumber})` : ''}
                          {answer.sourceInfo.sectionTitle ? ` — ${answer.sourceInfo.sectionTitle}` : ''}
                        </span>
                      </div>
                    )}
                  </CardContent>
                )}
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
