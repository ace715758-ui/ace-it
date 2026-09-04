'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AlertCircle, ChevronLeft, ChevronRight, Loader2, Send } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
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
}

export default function QuizTaker({ quiz, questions }: QuizTakerProps) {
  const router = useRouter()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const startedAt = useState(() => new Date().toISOString())[0]

  const currentQuestion = questions[currentIndex]
  const totalQuestions = questions.length
  const answeredCount = Object.keys(answers).length
  const progressPercent = Math.round(((currentIndex + 1) / totalQuestions) * 100)

  function handleAnswer(questionId: string, answer: string) {
    setAnswers((prev) => ({ ...prev, [questionId]: answer }))
  }

  function goTo(index: number) {
    if (index >= 0 && index < totalQuestions) {
      setCurrentIndex(index)
    }
  }

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

      const data = await res.json() as {
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

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-bold truncate">{quiz.title}</h1>
          <Badge variant="secondary">
            {answeredCount}/{totalQuestions} answered
          </Badge>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground whitespace-nowrap">
            Question {currentIndex + 1} of {totalQuestions}
          </span>
          <Progress value={progressPercent} className="flex-1 h-2" />
          <span className="text-sm text-muted-foreground">{progressPercent}%</span>
        </div>
      </div>

      {/* Question Card */}
      <Card>
        <CardContent className="pt-6 pb-6">
          <div className="flex items-start justify-between gap-2 mb-5">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Question {currentIndex + 1}
            </span>
            <div className="flex gap-1.5">
              <Badge variant="outline" className="text-xs capitalize">
                {currentQuestion.question_type.replace('_', ' ')}
              </Badge>
              <Badge variant="outline" className="text-xs capitalize">
                {currentQuestion.difficulty}
              </Badge>
            </div>
          </div>

          <p className="text-base font-medium leading-relaxed mb-6">
            {currentQuestion.question_text}
          </p>

          {/* Multiple Choice / True False */}
          {currentQuestion.question_type !== 'identification' &&
            currentQuestion.options && (
              <div className="space-y-2.5">
                {currentQuestion.options.map((option, idx) => {
                  const selected = answers[currentQuestion.id] === option
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleAnswer(currentQuestion.id, option)}
                      className={`w-full text-left px-4 py-3 rounded-lg border text-sm transition-all ${
                        selected
                          ? 'border-primary bg-primary/10 text-primary font-medium'
                          : 'border-border hover:border-primary/50 hover:bg-muted/30'
                      }`}
                    >
                      <span className="font-medium mr-2">
                        {String.fromCharCode(65 + idx)}.
                      </span>
                      {option}
                    </button>
                  )
                })}
              </div>
            )}

          {/* Identification */}
          {currentQuestion.question_type === 'identification' && (
            <div className="space-y-1.5">
              <Textarea
                placeholder="Type your answer here..."
                value={answers[currentQuestion.id] ?? ''}
                onChange={(e) => handleAnswer(currentQuestion.id, e.target.value)}
                className="resize-none"
                rows={3}
                aria-label="Your answer"
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between gap-3">
        <Button
          variant="outline"
          onClick={() => goTo(currentIndex - 1)}
          disabled={currentIndex === 0}
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Previous
        </Button>

        <div className="flex gap-1 flex-wrap justify-center max-w-xs">
          {questions.map((q, i) => (
            <button
              key={q.id}
              type="button"
              onClick={() => goTo(i)}
              className={`w-7 h-7 rounded text-xs font-medium transition-colors ${
                i === currentIndex
                  ? 'bg-primary text-primary-foreground'
                  : answers[q.id]
                  ? 'bg-green-100 text-green-800 border border-green-200'
                  : 'bg-muted text-muted-foreground border border-border'
              }`}
              aria-label={`Go to question ${i + 1}`}
              aria-current={i === currentIndex ? 'step' : undefined}
            >
              {i + 1}
            </button>
          ))}
        </div>

        {currentIndex < totalQuestions - 1 ? (
          <Button onClick={() => goTo(currentIndex + 1)}>
            Next
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        ) : (
          <Button onClick={() => setShowConfirm(true)} disabled={submitting}>
            {submitting ? (
              <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
            ) : (
              <Send className="w-4 h-4 mr-1.5" />
            )}
            Submit
          </Button>
        )}
      </div>

      {/* Confirm Submit Dialog */}
      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Submit your quiz?</AlertDialogTitle>
            <AlertDialogDescription>
              {unansweredCount > 0 ? (
                <span className="flex items-start gap-2 text-amber-600">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  You have {unansweredCount} unanswered question{unansweredCount > 1 ? 's' : ''}.
                  Unanswered questions will be marked as incorrect.
                </span>
              ) : (
                "You've answered all questions. Ready to see your results?"
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep reviewing</AlertDialogCancel>
            <AlertDialogAction onClick={handleSubmit} disabled={submitting}>
              {submitting && <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />}
              Yes, submit
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
