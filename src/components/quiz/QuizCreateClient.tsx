'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, Controller, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  BookOpen,
  Brain,
  CheckCircle2,
  ChevronRight,
  Clock,
  Loader2,
  Upload,
} from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Checkbox } from '@/components/ui/checkbox'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { quizConfigSchema, type QuizConfigInput } from '@/lib/validation/quiz'
import { getFileTypeLabel } from '@/types/material'
import type { Material } from '@/types/database'

interface QuizCreateClientProps {
  materials: Pick<Material, 'id' | 'original_filename' | 'file_type' | 'uploaded_at' | 'processing_status'>[]
  initialMaterialId?: string
}

const GENERATION_STEPS = [
  'Preparing your materials...',
  'Analyzing content...',
  'Finding relevant topics...',
  'Generating questions...',
  'Validating questions...',
  'Preparing your quiz...',
]

export default function QuizCreateClient({ materials, initialMaterialId }: QuizCreateClientProps) {
  const router = useRouter()
  const [generating, setGenerating] = useState(false)
  const [generationStep, setGenerationStep] = useState(0)
  const [generationProgress, setGenerationProgress] = useState(0)
  const [completedSteps, setCompletedSteps] = useState<number[]>([])
  const [customCount, setCustomCount] = useState(false)
  const [customTimer, setCustomTimer] = useState(false)

  const completedMaterials = materials.filter((m) => m.processing_status === 'completed')
  const matchedInitial = initialMaterialId
    ? completedMaterials.find((m) => m.id === initialMaterialId)
    : null

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<QuizConfigInput>({
    resolver: zodResolver(quizConfigSchema),
    defaultValues: {
      title: matchedInitial
        ? `Practice: ${matchedInitial.original_filename.replace(/\.[^/.]+$/, '')}`
        : '',
      materialIds: matchedInitial ? [matchedInitial.id] : [],
      questionCount: 10,
      difficulty: 'medium',
      questionType: 'multiple_choice',
      randomizeQuestions: true,
      randomizeChoices: true,
      timeLimitPerQuestion: 30,
    },
  })

  const selectedMaterials = useWatch({ control, name: 'materialIds' }) ?? []

  async function onSubmit(data: QuizConfigInput) {
    setGenerating(true)
    setGenerationStep(0)
    setGenerationProgress(0)
    setCompletedSteps([])

    // Simulate progress steps
    const stepInterval = setInterval(() => {
      setGenerationStep((prev) => {
        const next = Math.min(prev + 1, GENERATION_STEPS.length - 1)
        setCompletedSteps((c) => (c.includes(prev) ? c : [...c, prev]))
        setGenerationProgress(Math.round((next / GENERATION_STEPS.length) * 100))
        return next
      })
    }, 1200)

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      clearInterval(stepInterval)
      setGenerationProgress(100)
      setCompletedSteps(Array.from({ length: GENERATION_STEPS.length }, (_, i) => i))

      const result = await res.json() as {
        quizId?: string
        questionCount?: number
        warning?: string
        error?: string
      }

      if (!res.ok) {
        toast.error(result.error ?? 'Failed to generate quiz. Please try again.')
        setGenerating(false)
        return
      }

      if (result.warning) {
        toast.warning(result.warning)
      } else {
        toast.success(`Quiz created with ${result.questionCount} questions!`)
      }

      const timerParam = data.timeLimitPerQuestion !== undefined ? `?timer=${data.timeLimitPerQuestion}` : ''
      router.push(`/quiz/${result.quizId}${timerParam}`)
    } catch {
      clearInterval(stepInterval)
      toast.error('Something went wrong. Please try again.')
      setGenerating(false)
    }
  }

  if (generating) {
    return (
      <div className="max-w-lg mx-auto py-12">
        <Card>
          <CardContent className="pt-8 pb-8 px-8 text-center space-y-6">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
              <Brain className="w-8 h-8 text-primary animate-pulse" />
            </div>
            <div>
              <h2 className="text-xl font-bold mb-1">Generating Your Quiz</h2>
              <p className="text-muted-foreground text-sm">
                AI is analyzing your materials...
              </p>
            </div>

            <div className="space-y-2.5 text-left">
              {GENERATION_STEPS.map((step, i) => (
                <div key={step} className="flex items-center gap-3 text-sm">
                  {completedSteps.includes(i) ? (
                    <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                  ) : i === generationStep ? (
                    <Loader2 className="w-4 h-4 text-primary animate-spin shrink-0" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border-2 border-muted shrink-0" />
                  )}
                  <span
                    className={
                      completedSteps.includes(i)
                        ? 'text-foreground'
                        : i === generationStep
                        ? 'text-foreground font-medium'
                        : 'text-muted-foreground'
                    }
                  >
                    {step}
                  </span>
                </div>
              ))}
            </div>

            <Progress value={generationProgress} className="h-2" />
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">Create Quiz</h1>
        <p className="text-muted-foreground mt-1">
          Select your materials and configure your quiz settings
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Select Materials */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Select Materials</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {completedMaterials.length === 0 ? (
              <div className="text-center py-8">
                <BookOpen className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground text-sm mb-3">
                  No processed materials available.
                </p>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/materials">
                    <Upload className="w-4 h-4 mr-1.5" />
                    Upload Materials
                  </Link>
                </Button>
              </div>
            ) : (
              <>
                <Controller
                  name="materialIds"
                  control={control}
                  render={({ field }) => (
                    <div className="space-y-2">
                      {completedMaterials.map((material) => {
                        const checked = field.value.includes(material.id)
                        return (
                          <label
                            key={material.id}
                            className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted/30 cursor-pointer transition-colors"
                          >
                            <Checkbox
                              checked={checked}
                              onCheckedChange={(c) => {
                                if (c) {
                                  field.onChange([...field.value, material.id])
                                } else {
                                  field.onChange(field.value.filter((id) => id !== material.id))
                                }
                              }}
                              id={`material-${material.id}`}
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">
                                {material.original_filename}
                              </p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <Badge variant="secondary" className="text-xs">
                                  {getFileTypeLabel(material.file_type)}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  {formatDistanceToNow(new Date(material.uploaded_at), {
                                    addSuffix: true,
                                  })}
                                </span>
                              </div>
                            </div>
                          </label>
                        )
                      })}
                    </div>
                  )}
                />
                {errors.materialIds && (
                  <p className="text-sm text-destructive" role="alert">
                    {errors.materialIds.message}
                  </p>
                )}
                {selectedMaterials.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    {selectedMaterials.length} material{selectedMaterials.length > 1 ? 's' : ''} selected
                  </p>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Quiz Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Quiz Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Title */}
            <div className="space-y-1.5">
              <Label htmlFor="title">Quiz Title</Label>
              <Input
                id="title"
                placeholder="e.g. Chapter 1 Practice Quiz"
                aria-invalid={!!errors.title}
                {...register('title')}
              />
              {errors.title && (
                <p className="text-sm text-destructive" role="alert">
                  {errors.title.message}
                </p>
              )}
            </div>

            {/* Number of Questions */}
            <div className="space-y-1.5">
              <Label>Number of Questions</Label>
              <div className="flex flex-wrap gap-2">
                {[5, 10, 15, 20, 25].map((n) => (
                  <Controller
                    key={n}
                    name="questionCount"
                    control={control}
                    render={({ field }) => (
                      <button
                        type="button"
                        onClick={() => {
                          setCustomCount(false)
                          field.onChange(n)
                        }}
                        className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors ${
                          field.value === n && !customCount
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'border-border hover:bg-muted'
                        }`}
                      >
                        {n}
                      </button>
                    )}
                  />
                ))}
                <button
                  type="button"
                  onClick={() => setCustomCount(true)}
                  className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors ${
                    customCount
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'border-border hover:bg-muted'
                  }`}
                >
                  Custom
                </button>
              </div>
              {customCount && (
                <Input
                  type="number"
                  min={1}
                  max={50}
                  placeholder="Enter number (1-50)"
                  className="max-w-xs"
                  {...register('questionCount', { valueAsNumber: true })}
                />
              )}
              {errors.questionCount && (
                <p className="text-sm text-destructive" role="alert">
                  {errors.questionCount.message}
                </p>
              )}
            </div>

            {/* Difficulty */}
            <div className="space-y-1.5">
              <Label>Difficulty</Label>
              <Controller
                name="difficulty"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select difficulty" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="easy">Easy — Definitions &amp; basic facts</SelectItem>
                      <SelectItem value="medium">Medium — Understanding &amp; application</SelectItem>
                      <SelectItem value="hard">Hard — Analysis &amp; deep reasoning</SelectItem>
                      <SelectItem value="mixed">Mixed — Variety of difficulties</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            {/* Question Type */}
            <div className="space-y-1.5">
              <Label>Question Type</Label>
              <Controller
                name="questionType"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select question type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="multiple_choice">Multiple Choice</SelectItem>
                      <SelectItem value="true_false">True / False</SelectItem>
                      <SelectItem value="identification">Identification</SelectItem>
                      <SelectItem value="mixed">Mixed Types</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            {/* Timer per Question — Inspired by Technical Blueprint Dial */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-cyan-500" />
                  <span>Time per Question</span>
                </Label>
                <Badge variant="outline" className="text-xs font-mono border-cyan-500/30 text-cyan-600 dark:text-cyan-400">
                  Animated Dial
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Challenge yourself with a circular countdown dial, or take your time in practice mode.
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                {[
                  { label: '30s (Fast)', value: 30 },
                  { label: '45s (Standard)', value: 45 },
                  { label: '60s (Thoughtful)', value: 60 },
                  { label: '90s (Complex)', value: 90 },
                  { label: 'Unlimited (Practice)', value: 0 },
                ].map((preset) => (
                  <Controller
                    key={preset.value}
                    name="timeLimitPerQuestion"
                    control={control}
                    render={({ field }) => (
                      <button
                        type="button"
                        onClick={() => {
                          setCustomTimer(false)
                          field.onChange(preset.value)
                        }}
                        className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
                          field.value === preset.value && !customTimer
                            ? 'bg-indigo-600 text-white border-indigo-600 dark:bg-indigo-500 dark:text-white font-semibold shadow-xs'
                            : 'border-border hover:bg-muted'
                        }`}
                      >
                        {preset.label}
                      </button>
                    )}
                  />
                ))}
                <button
                  type="button"
                  onClick={() => setCustomTimer(true)}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
                    customTimer
                      ? 'bg-indigo-600 text-white border-indigo-600 dark:bg-indigo-500 dark:text-white font-semibold shadow-xs'
                      : 'border-border hover:bg-muted'
                  }`}
                >
                  Custom
                </button>
              </div>
              {customTimer && (
                <div className="flex items-center gap-2 pt-1">
                  <Input
                    type="number"
                    min={5}
                    max={300}
                    placeholder="Seconds (5-300)"
                    className="max-w-xs font-mono"
                    {...register('timeLimitPerQuestion', { valueAsNumber: true })}
                  />
                  <span className="text-xs text-muted-foreground font-mono">seconds per question</span>
                </div>
              )}
              {errors.timeLimitPerQuestion && (
                <p className="text-sm text-destructive" role="alert">
                  {errors.timeLimitPerQuestion.message}
                </p>
              )}
            </div>

            {/* Toggles */}
            <div className="space-y-3 pt-1">
              <Controller
                name="randomizeQuestions"
                control={control}
                render={({ field }) => (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Randomize Questions</p>
                      <p className="text-xs text-muted-foreground">
                        Shuffle the order of questions
                      </p>
                    </div>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      aria-label="Randomize questions"
                    />
                  </div>
                )}
              />
              <Controller
                name="randomizeChoices"
                control={control}
                render={({ field }) => (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Randomize Choices</p>
                      <p className="text-xs text-muted-foreground">
                        Shuffle answer options for MC questions
                      </p>
                    </div>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      aria-label="Randomize choices"
                    />
                  </div>
                )}
              />
            </div>
          </CardContent>
        </Card>

        <Button
          type="submit"
          size="lg"
          className="w-full"
          disabled={generating || completedMaterials.length === 0}
        >
          {generating ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Brain className="w-4 h-4 mr-2" />
          )}
          Generate Quiz
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </form>
    </div>
  )
}
