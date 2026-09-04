'use client'

import React, { useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  HelpCircle,
  Loader2,
  RotateCcw,
  Send,
  Sparkles,
  Check,
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
import type { Quiz } from '@/types/database'

interface QuizQuestion {
  id: string
  question_text: string
  question_type: string
  options: string[] | null
  question_order: number
  difficulty: string
}

interface QuizTakerProps {
  quiz: Quiz
  questions: QuizQuestion[]
  initialTimerSeconds?: number
}

const TIMER_PRESETS = [
  { label: '15s Blitz', value: 15 },
  { label: '30s Standard', value: 30 },
  { label: '60s Relaxed', value: 60 },
  { label: 'Untimed', value: 0 },
]

function cleanOptionText(text: string | null | undefined): string {
  if (!text) return ''
  return text
    .replace(/[\r\n]+/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .replace(/\s*\.{3,}$/, '')
    .trim()
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
    <div className="max-w-3xl mx-auto space-y-6 pb-16">
      {/* Sleek Masthead Banner */}
      <div className="bg-card/85 backdrop-blur-md border border-border/80 rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="text-xs font-semibold uppercase tracking-wider text-primary bg-primary/10 px-2.5 py-0.5 rounded-full">
                Practice Session
              </span>
              <Badge variant="outline" className="text-xs capitalize font-medium">
                {quiz.difficulty}
              </Badge>
              <span className="text-xs text-muted-foreground">·</span>
              <span className="text-xs text-muted-foreground font-medium">
                {quiz.question_type.replace(/_/g, ' ')}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              {quiz.title}
            </h1>
          </div>

          {/* Quick Timer Segmented Control */}
          <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-xl border border-border/60 self-start sm:self-center">
            <div className="px-2 py-1 flex items-center gap-1 text-xs font-medium text-muted-foreground">
              <Timer className="w-3.5 h-3.5 text-primary" />
            </div>
            {TIMER_PRESETS.map((preset) => (
              <button
                key={preset.value}
                type="button"
                onClick={() => setTimerDuration(preset.value)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                  timerDuration === preset.value
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-card/60'
                }`}
                title={preset.value === 0 ? 'Practice without a timer' : `${preset.value} seconds per question`}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* Dynamic Progress Bar */}
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
            <span>
              Question <strong className="text-foreground">{currentIndex + 1}</strong> of{' '}
              <strong className="text-foreground">{totalQuestions}</strong>
            </span>
            <span>
              Answered: <strong className="text-foreground">{answeredCount}</strong> / {totalQuestions} ({progressPercent}%)
            </span>
          </div>
          <div className="w-full bg-muted/70 rounded-full h-2 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary to-violet-500 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Main Elevated Question Card */}
      <Card className="border-border/80 shadow-xl shadow-primary/5 relative overflow-hidden bg-card/95 backdrop-blur-md rounded-2xl transition-all">
        {/* Subtle Top Gradient Accent */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-violet-500 to-indigo-600" />

        <CardContent className="p-6 sm:p-8 space-y-7">
          {/* Question Meta Header */}
          <div className="flex items-center justify-between border-b border-border/60 pb-4">
            <div className="flex items-center gap-2.5">
              <span className="px-3 py-1 rounded-lg bg-primary/10 text-primary font-bold text-xs uppercase tracking-wider">
                Question {currentIndex + 1}
              </span>
              <Badge variant="secondary" className="text-xs capitalize font-medium">
                {currentQuestion.question_type.replace(/_/g, ' ')}
              </Badge>
            </div>

            <div className="flex items-center gap-2">
              {timerDuration > 0 && (
                <button
                  type="button"
                  onClick={resetQuestionTimer}
                  className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground px-2.5 py-1 rounded-lg bg-muted/40 hover:bg-muted border border-border/60 transition-colors"
                  title="Reset timer for this question"
                  aria-label="Restart question timer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Reset Timer</span>
                </button>
              )}
            </div>
          </div>

          {/* Radial Countdown Timer Dial */}
          {timerDuration > 0 && (
            <div className="py-1 flex justify-center">
              <TimerDial
                key={`${currentIndex}-${timerDuration}-${timerResetKey}`}
                initialSeconds={timerDuration}
                onTimeout={handleTimeout}
                size={116}
              />
            </div>
          )}

          {/* HIGH-VISIBILITY Question Text */}
          <div className="space-y-3">
            <h2 className="text-xl sm:text-2xl lg:text-[1.7rem] font-bold tracking-tight text-foreground leading-snug sm:leading-relaxed">
              {cleanOptionText(currentQuestion.question_text)}
            </h2>

            {isQuestionTimedOut && !answers[currentQuestion.id] && (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-rose-500/10 border border-rose-500/25 text-rose-500 text-xs font-semibold">
                <Clock className="w-4 h-4 shrink-0" />
                <span>Time has expired for this question. Choose an answer to record or skip ahead.</span>
              </div>
            )}
          </div>

          {/* Multiple Choice & True-False Rich Options */}
          {currentQuestion.question_type !== 'identification' && currentQuestion.options && (
            <div className="grid grid-cols-1 gap-3.5 pt-2" role="radiogroup" aria-label="Question options">
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
                    className={`w-full group text-left px-5 py-4 rounded-xl border-2 transition-all duration-200 flex items-center justify-between gap-4 cursor-pointer relative ${
                      isSelected
                        ? 'border-primary bg-primary/[0.08] dark:bg-primary/15 shadow-sm ring-2 ring-primary/25 -translate-y-0.5'
                        : 'border-slate-200 dark:border-border/80 bg-card hover:border-primary/50 hover:bg-primary/[0.02] hover:shadow-xs hover:-translate-y-0.5'
                    }`}
                  >
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      {/* Letter Avatar Pill */}
                      <span
                        className={`w-9 h-9 shrink-0 flex items-center justify-center rounded-xl font-bold text-sm transition-all ${
                          isSelected
                            ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/40 ring-2 ring-primary/30'
                            : 'bg-slate-100 dark:bg-muted/80 text-slate-700 dark:text-muted-foreground border border-slate-200 dark:border-border group-hover:border-primary/50 group-hover:text-primary group-hover:bg-primary/5'
                        }`}
                      >
                        {letterTag}
                      </span>

                      {/* Complete High-Contrast Option Text */}
                      <span
                        className={`text-base sm:text-[1.05rem] leading-relaxed transition-colors break-words ${
                          isSelected
                            ? 'text-primary dark:text-primary-foreground font-bold'
                            : 'text-slate-900 dark:text-slate-100 group-hover:text-foreground font-medium'
                        }`}
                      >
                        {cleanedOption}
                      </span>
                    </div>

                    {/* Right Check or Clean Radio Ring */}
                    <div className="shrink-0 flex items-center">
                      {isSelected ? (
                        <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-primary-foreground shadow-sm animate-in zoom-in-50 duration-200">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                      ) : (
                        <div className="w-5 h-5 rounded-full border-2 border-border/80 group-hover:border-primary/60 transition-colors" />
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          )}

          {/* Identification / Open-ended text field */}
          {currentQuestion.question_type === 'identification' && (
            <div className="space-y-3 pt-2">
              <Textarea
                placeholder="Type your answer here..."
                value={answers[currentQuestion.id] ?? ''}
                onChange={(e) => handleAnswer(currentQuestion.id, e.target.value)}
                className="resize-none font-sans text-base sm:text-lg min-h-[120px] p-4 rounded-xl border-2 border-border/80 focus:border-primary focus:ring-2 focus:ring-primary/20"
                aria-label="Your answer"
                autoFocus
              />
              <p className="text-xs text-muted-foreground flex items-center gap-1.5 font-medium">
                <HelpCircle className="w-3.5 h-3.5 text-primary" />
                Type the specific term, formula, or concept discussed in your learning materials.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Footer Navigation Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
        <Button
          variant="outline"
          size="lg"
          onClick={() => goTo(currentIndex - 1)}
          disabled={currentIndex === 0}
          className="w-full sm:w-auto font-semibold px-5 rounded-xl border-border/80 hover:bg-muted"
        >
          <ChevronLeft className="w-4 h-4 mr-1.5" />
          Previous
        </Button>

        {/* Jump-to Question Indicator Pills */}
        <div className="flex gap-1.5 flex-wrap justify-center max-w-sm" aria-label="Question selector">
          {questions.map((q, i) => {
            const isAnswered = Boolean(answers[q.id])
            const isCurrent = i === currentIndex

            return (
              <button
                key={q.id}
                type="button"
                onClick={() => goTo(i)}
                className={`w-8 h-8 rounded-xl text-xs font-bold transition-all ${
                  isCurrent
                    ? 'bg-primary text-primary-foreground ring-2 ring-primary/40 shadow-sm scale-105'
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
            size="lg"
            onClick={() => goTo(currentIndex + 1)}
            className="w-full sm:w-auto font-semibold px-6 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground shadow-md shadow-primary/20"
          >
            Next
            <ChevronRight className="w-4 h-4 ml-1.5" />
          </Button>
        ) : (
          <Button
            size="lg"
            onClick={() => setShowConfirm(true)}
            disabled={submitting}
            className="w-full sm:w-auto font-semibold px-6 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-md shadow-emerald-600/25"
          >
            {submitting ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Send className="w-4 h-4 mr-2" />
            )}
            Submit Quiz
          </Button>
        )}
      </div>

      {/* Keyboard Shortcut Hint for Students */}
      <div className="text-center text-xs text-muted-foreground/80 pt-1 flex items-center justify-center gap-3 flex-wrap">
        <span>Press <kbd className="px-1.5 py-0.5 rounded bg-muted border text-[11px] font-mono">A-D</kbd> or <kbd className="px-1.5 py-0.5 rounded bg-muted border text-[11px] font-mono">1-4</kbd> to select</span>
        <span>·</span>
        <span>Press <kbd className="px-1.5 py-0.5 rounded bg-muted border text-[11px] font-mono">→</kbd> for Next</span>
        <span>·</span>
        <span>Press <kbd className="px-1.5 py-0.5 rounded bg-muted border text-[11px] font-mono">←</kbd> for Previous</span>
      </div>

      {/* Confirm Submit Dialog */}
      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent className="rounded-2xl border border-border/80">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2.5 text-xl font-bold">
              <Sparkles className="w-5 h-5 text-primary" />
              <span>Ready to submit your quiz?</span>
            </AlertDialogTitle>
            <AlertDialogDescription className="text-base text-muted-foreground pt-1">
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
              className="rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
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

