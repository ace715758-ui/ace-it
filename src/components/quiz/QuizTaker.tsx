'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  AlertCircle,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  HelpCircle,
  Loader2,
  RotateCcw,
  Send,
  Sparkles,
  Timer,
} from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import TimerDial from '@/components/quiz/TimerDial'
import type { Quiz, Question } from '@/types/database'

interface QuizTakerProps {
  quiz: Quiz
  questions: Array<{
    id: string
    question_text: string
    question_type: string
    options: string[] | null
    question_order: number
    difficulty: string
  }>
  initialTimerSeconds?: number
}

const TIMER_PRESETS = [
  { label: '15s', value: 15 },
  { label: '30s', value: 30 },
  { label: '60s', value: 60 },
  { label: 'Untimed', value: 0 },
]

/**
 * Clean and format option strings defensively
 */
function cleanOptionText(text: string): string {
  if (!text) return ''
  let cleaned = text
    .trim()
    .replace(/^["'“”]+|["'“”]+$/g, '')
    .replace(/\s+/g, ' ')
    .trim()

  if (cleaned.length > 0 && !/[.!?]$/.test(cleaned)) {
    cleaned += '.'
  }
  return cleaned
}

export default function QuizTaker({
  quiz,
  questions,
  initialTimerSeconds = 30,
}: QuizTakerProps) {
  const router = useRouter()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const startedAt = useState(() => new Date().toISOString())[0]

  // Timer configuration
  const [timerDuration, setTimerDuration] = useState<number>(initialTimerSeconds)
  const [timerResetKey, setTimerResetKey] = useState<number>(0)
  const [timedOutQuestions, setTimedOutQuestions] = useState<Record<string, boolean>>({})

  const totalQuestions = questions.length
  const currentQuestion = questions[currentIndex]
  const answeredCount = Object.keys(answers).length
  const progressPercent = Math.round(((currentIndex + 1) / totalQuestions) * 100)

  // Handle question timeout
  const handleTimeout = useCallback(() => {
    if (!currentQuestion) return
    setTimedOutQuestions((prev) => ({ ...prev, [currentQuestion.id]: true }))
    toast.warning(`Time is up for Question ${currentIndex + 1}!`, {
      description: 'Make your best choice or proceed to the next question.',
      duration: 3000,
    })
  }, [currentQuestion, currentIndex])

  const handleAnswer = useCallback((questionId: string, answer: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: answer }))
  }, [])

  const goTo = useCallback((index: number) => {
    if (index >= 0 && index < totalQuestions) {
      setCurrentIndex(index)
    }
  }, [totalQuestions])

  function resetQuestionTimer() {
    setTimerResetKey((k) => k + 1)
  }

  // Keyboard navigation support
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement
      if (target.tagName === 'TEXTAREA' || target.tagName === 'INPUT') return

      if (currentQuestion && currentQuestion.question_type !== 'identification' && currentQuestion.options) {
        const key = e.key.toUpperCase()
        if (currentQuestion.question_type === 'true_false') {
          if (key === 'T') handleAnswer(currentQuestion.id, 'True')
          if (key === 'F') handleAnswer(currentQuestion.id, 'False')
          if (key === '1') handleAnswer(currentQuestion.id, currentQuestion.options[0])
          if (key === '2') handleAnswer(currentQuestion.id, currentQuestion.options[1])
        } else {
          const letterMap: Record<string, number> = { A: 0, B: 1, C: 2, D: 3, '1': 0, '2': 1, '3': 2, '4': 3 }
          if (letterMap[key] !== undefined && letterMap[key] < currentQuestion.options.length) {
            handleAnswer(currentQuestion.id, currentQuestion.options[letterMap[key]])
          }
        }
      }

      if (e.key === 'ArrowRight') {
        if (currentIndex < totalQuestions - 1) {
          goTo(currentIndex + 1)
        } else {
          setShowConfirm(true)
        }
      } else if (e.key === 'ArrowLeft') {
        goTo(currentIndex - 1)
      } else if (e.key === 'Enter') {
        if (currentIndex < totalQuestions - 1) {
          goTo(currentIndex + 1)
        } else {
          setShowConfirm(true)
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [currentIndex, currentQuestion, totalQuestions, goTo, handleAnswer])

  async function handleSubmit() {
    setSubmitting(true)
    setShowConfirm(false)
    try {
      const res = await fetch('/api/attempts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quizId: quiz.id,
          answers: Object.entries(answers).map(([questionId, selectedAnswer]) => ({
            questionId,
            selectedAnswer,
          })),
          startedAt,
        }),
      })

      const data = (await res.json()) as {
        attemptId?: string
        error?: string
      }

      if (!res.ok) {
        toast.error(data.error ?? 'Failed to submit quiz. Please try again.')
        setSubmitting(false)
        return
      }

      router.push(`/quiz/${quiz.id}/results/${data.attemptId}`)
    } catch {
      toast.error('Something went wrong. Please try again.')
      setSubmitting(false)
    }
  }

  const unansweredCount = totalQuestions - answeredCount
  const isQuestionTimedOut = Boolean(currentQuestion && timedOutQuestions[currentQuestion.id])

  return (
    <div className="max-w-4xl mx-auto flex flex-col justify-start space-y-3 sm:space-y-4 pb-6">
      {/* 1. Sleek Compact Header Bar (Zero wasted vertical space) */}
      <div className="bg-card/90 backdrop-blur-md border border-border/80 rounded-2xl px-4 py-3 sm:px-5 sm:py-3.5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Left: Quiz Info & Badges */}
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-full border border-indigo-200/60 dark:border-indigo-800/50">
                Practice Session
              </span>
              <Badge variant="outline" className="text-[11px] capitalize font-semibold py-0 px-2">
                {quiz.difficulty}
              </Badge>
              <span className="text-xs text-muted-foreground">·</span>
              <span className="text-xs text-muted-foreground font-medium capitalize">
                {quiz.question_type.replace(/_/g, ' ')}
              </span>
            </div>
            <h1 className="text-base sm:text-lg font-bold tracking-tight text-foreground truncate">
              {quiz.title}
            </h1>
          </div>

          {/* Right: Integrated Timer & Segmented Selector */}
          <div className="flex items-center gap-2.5 self-start sm:self-center shrink-0">
            {/* Quick Timer Mode Selector */}
            <div className="flex items-center gap-1 bg-muted/60 p-0.5 rounded-xl border border-border/60">
              <div className="px-1.5 flex items-center text-muted-foreground">
                <Timer className="w-3.5 h-3.5 text-primary" />
              </div>
              {TIMER_PRESETS.map((preset) => (
                <button
                  key={preset.value}
                  type="button"
                  onClick={() => setTimerDuration(preset.value)}
                  className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-all ${
                    timerDuration === preset.value
                      ? 'bg-primary text-primary-foreground shadow-xs'
                      : 'text-muted-foreground hover:text-foreground hover:bg-card/60'
                  }`}
                  title={preset.value === 0 ? 'Practice without a timer' : `${preset.value}s per question`}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            {/* Live Inline Compact Timer Dial */}
            {timerDuration > 0 && (
              <TimerDial
                key={`${currentIndex}-${timerDuration}-${timerResetKey}`}
                initialSeconds={timerDuration}
                onTimeout={handleTimeout}
                compact={true}
                onReset={resetQuestionTimer}
              />
            )}
          </div>
        </div>

        {/* Dynamic Progress Track */}
        <div className="space-y-1 pt-2.5">
          <div className="flex items-center justify-between text-[11px] font-medium text-muted-foreground">
            <span>
              Question <strong className="text-foreground">{currentIndex + 1}</strong> of{' '}
              <strong className="text-foreground">{totalQuestions}</strong>
            </span>
            <span>
              Answered: <strong className="text-foreground">{answeredCount}</strong> / {totalQuestions} ({progressPercent}%)
            </span>
          </div>
          <div className="w-full bg-muted/70 rounded-full h-1.5 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary to-violet-500 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* 2. Main Question Card (Space-efficient, high-contrast, fully visible) */}
      <Card className="border-border/80 shadow-md relative overflow-hidden bg-card/95 backdrop-blur-md rounded-2xl">
        {/* Subtle Accent Stripe */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-violet-500 to-sky-400" />

        <CardContent className="p-4 sm:p-6 space-y-4">
          {/* Question Header Row */}
          <div className="flex items-center justify-between gap-2 border-b border-border/50 pb-2.5">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-bold text-xs uppercase tracking-wider border border-indigo-200/60 dark:border-indigo-800/40">
                Question {currentIndex + 1}
              </span>
              <Badge variant="secondary" className="text-xs capitalize font-medium py-0 px-2">
                {currentQuestion.question_type.replace(/_/g, ' ')}
              </Badge>
            </div>

            {isQuestionTimedOut && !answers[currentQuestion.id] && (
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-rose-500/10 border border-rose-500/25 text-rose-500 text-[11px] font-semibold">
                <Clock className="w-3.5 h-3.5" />
                <span>Time Expired</span>
              </div>
            )}
          </div>

          {/* HIGH-VISIBILITY Question Text (Prominent, crisp, no clipping) */}
          <div className="py-1">
            <h2 className="text-base sm:text-lg lg:text-xl font-bold tracking-tight text-foreground leading-snug">
              {cleanOptionText(currentQuestion.question_text)}
            </h2>
          </div>

          {/* 2-Column Responsive Options Grid (Cuts vertical height in half so everything fits!) */}
          {currentQuestion.question_type !== 'identification' && currentQuestion.options && (
            <div
              className={`grid gap-2.5 pt-1 ${
                currentQuestion.question_type === 'true_false'
                  ? 'grid-cols-2'
                  : 'grid-cols-1 md:grid-cols-2'
              }`}
              role="radiogroup"
              aria-label="Question options"
            >
              {currentQuestion.options.map((option, idx) => {
                const isSelected = answers[currentQuestion.id] === option
                const cleanedOption = cleanOptionText(option)
                const letterTag =
                  currentQuestion.question_type === 'true_false'
                    ? cleanedOption.toLowerCase().startsWith('t')
                      ? 'T'
                      : 'F'
                    : String.fromCharCode(65 + idx)

                return (
                  <button
                    key={idx}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    onClick={() => handleAnswer(currentQuestion.id, option)}
                    className={`w-full group text-left px-3.5 py-3 rounded-xl border-2 transition-all duration-150 flex items-center justify-between gap-3 cursor-pointer relative ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/40 shadow-xs ring-2 ring-indigo-500/20'
                        : 'border-border/80 bg-background/80 hover:border-indigo-400 hover:bg-muted/40'
                    }`}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {/* Letter Avatar Pill */}
                      <span
                        className={`w-8 h-8 shrink-0 flex items-center justify-center rounded-lg font-bold text-xs transition-all ${
                          isSelected
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'bg-muted text-muted-foreground group-hover:bg-indigo-50 dark:group-hover:bg-indigo-950/50 group-hover:text-indigo-600'
                        }`}
                      >
                        {letterTag}
                      </span>

                      {/* Complete High-Contrast Option Text */}
                      <span
                        className={`text-xs sm:text-sm leading-snug transition-colors break-words line-clamp-3 ${
                          isSelected
                            ? 'text-indigo-700 dark:text-indigo-300 font-bold'
                            : 'text-foreground font-medium group-hover:text-foreground'
                        }`}
                      >
                        {cleanedOption}
                      </span>
                    </div>

                    {/* Right Check or Clean Radio Ring */}
                    <div className="shrink-0 flex items-center">
                      {isSelected ? (
                        <div className="w-5 h-5 rounded-full bg-indigo-600 flex items-center justify-center text-white shadow-xs">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                      ) : (
                        <div className="w-4 h-4 rounded-full border-2 border-border/80 group-hover:border-indigo-400 transition-colors" />
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          )}

          {/* Identification / Open-ended text field */}
          {currentQuestion.question_type === 'identification' && (
            <div className="space-y-2 pt-1">
              <Textarea
                placeholder="Type your answer here..."
                value={answers[currentQuestion.id] ?? ''}
                onChange={(e) => handleAnswer(currentQuestion.id, e.target.value)}
                className="resize-none font-sans text-sm sm:text-base min-h-[85px] p-3 rounded-xl border-2 border-border/80 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                aria-label="Your answer"
                autoFocus
              />
              <p className="text-xs text-muted-foreground flex items-center gap-1.5 font-medium">
                <HelpCircle className="w-3.5 h-3.5 text-primary shrink-0" />
                Type the specific term, formula, or concept discussed in your learning materials.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 3. Compact Navigation Footer (Always visible without scrolling) */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
        <Button
          variant="outline"
          size="default"
          onClick={() => goTo(currentIndex - 1)}
          disabled={currentIndex === 0}
          className="w-full sm:w-auto font-semibold px-4 h-9 rounded-xl border-border/80 hover:bg-muted"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Previous
        </Button>

        {/* Jump-to Question Number Pills */}
        <div className="flex gap-1.5 flex-wrap justify-center max-w-md" aria-label="Question selector">
          {questions.map((q, i) => {
            const isAnswered = Boolean(answers[q.id])
            const isCurrent = i === currentIndex

            return (
              <button
                key={q.id}
                type="button"
                onClick={() => goTo(i)}
                className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg text-xs font-bold transition-all ${
                  isCurrent
                    ? 'bg-indigo-600 text-white ring-2 ring-indigo-500/30 shadow-xs scale-105'
                    : isAnswered
                    ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/35 hover:bg-emerald-500/25'
                    : 'bg-muted/70 text-muted-foreground hover:bg-muted border border-border/60 hover:text-foreground'
                }`}
                aria-label={`Go to question ${i + 1}`}
                aria-current={isCurrent ? 'step' : undefined}
              >
                {i + 1}
              </button>
            )
          })}
        </div>

        {currentIndex < totalQuestions - 1 ? (
          <Button
            size="default"
            onClick={() => goTo(currentIndex + 1)}
            className="w-full sm:w-auto font-semibold px-5 h-9 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs"
          >
            Next
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        ) : (
          <Button
            size="default"
            onClick={() => setShowConfirm(true)}
            disabled={submitting}
            className="w-full sm:w-auto font-semibold px-5 h-9 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-xs"
          >
            {submitting ? (
              <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
            ) : (
              <Send className="w-4 h-4 mr-1.5" />
            )}
            Submit Quiz
          </Button>
        )}
      </div>

      {/* Keyboard Shortcut Hints Line */}
      <div className="text-center text-[11px] text-muted-foreground/75 flex items-center justify-center gap-2 flex-wrap select-none">
        <span><kbd className="px-1 py-0.5 rounded bg-muted border text-[10px] font-mono">A-D</kbd> or <kbd className="px-1 py-0.5 rounded bg-muted border text-[10px] font-mono">1-4</kbd> Select</span>
        <span>·</span>
        <span><kbd className="px-1 py-0.5 rounded bg-muted border text-[10px] font-mono">→</kbd> / <kbd className="px-1 py-0.5 rounded bg-muted border text-[10px] font-mono">Enter</kbd> Next</span>
        <span>·</span>
        <span><kbd className="px-1 py-0.5 rounded bg-muted border text-[10px] font-mono">←</kbd> Previous</span>
      </div>

      {/* Confirm Submit Dialog */}
      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent className="rounded-2xl border border-border/80">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-xl font-bold">
              <Sparkles className="w-5 h-5 text-indigo-600" />
              <span>Ready to submit your quiz?</span>
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-muted-foreground pt-1">
              {unansweredCount > 0
                ? `You still have ${unansweredCount} unanswered question${
                    unansweredCount > 1 ? 's' : ''
                  }. Unanswered questions will receive 0 points. Would you like to submit now?`
                : `Awesome! You have answered all ${totalQuestions} questions. Submit to see your score, deep explanations, and diagnostic feedback.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-0 pt-2">
            <AlertDialogCancel className="rounded-xl">Keep Reviewing</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSubmit}
              disabled={submitting}
              className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
            >
              {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Yes, Submit Quiz
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
