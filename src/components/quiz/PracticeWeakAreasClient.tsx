'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  AlertCircle,
  ArrowRight,
  BookOpen,
  Brain,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  FileText,
  Flame,
  Lightbulb,
  Plus,
  RefreshCw,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
  XCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'

interface MaterialItem {
  id: string
  original_filename: string
  file_type: string
  uploaded_at: string
  processing_status: string
}

interface AttemptItem {
  id: string
  quiz_id: string
  score: number
  total_questions: number
  percentage: number | string
  completed_at: string | null
  quizzes?: {
    id: string
    title: string
    difficulty: string
    quiz_materials?: {
      material_id: string
    }[]
  } | {
    id: string
    title: string
    difficulty: string
    quiz_materials?: {
      material_id: string
    }[]
  }[]
}

interface WrongAnswerItem {
  id: string
  question_id: string
  selected_answer: string
  is_correct: boolean
  answered_at: string
  questions?: {
    id: string
    question_text: string
    question_type: string
    correct_answer: string
    explanation: string
    quiz_id: string
    quizzes?: {
      title: string
    } | {
      title: string
    }[]
  } | {
    id: string
    question_text: string
    question_type: string
    correct_answer: string
    explanation: string
    quiz_id: string
    quizzes?: {
      title: string
    } | {
      title: string
    }[]
  }[]
}

interface PracticeWeakAreasClientProps {
  materials: MaterialItem[]
  attempts: AttemptItem[]
  wrongAnswers: WrongAnswerItem[]
}

export default function PracticeWeakAreasClient({
  materials,
  attempts,
  wrongAnswers,
}: PracticeWeakAreasClientProps) {
  const [filter, setFilter] = useState<'all' | 'weak' | 'mastered' | 'missed'>('all')
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(new Set())

  // Aggregate stats per material
  const topicStats = useMemo(() => {
    const statsMap: Record<
      string,
      {
        material: MaterialItem
        attemptsCount: number
        totalQuestions: number
        totalCorrect: number
        scores: number[]
        avgPercentage: number
        status: 'weak' | 'progressing' | 'mastered' | 'untested'
      }
    > = {}

    // Initialize all materials
    for (const mat of materials) {
      statsMap[mat.id] = {
        material: mat,
        attemptsCount: 0,
        totalQuestions: 0,
        totalCorrect: 0,
        scores: [],
        avgPercentage: 0,
        status: 'untested',
      }
    }

    // Process attempts
    for (const att of attempts) {
      const quizObj = Array.isArray(att.quizzes) ? att.quizzes[0] : att.quizzes
      if (!quizObj || !quizObj.quiz_materials) continue

      const numPercentage = Number(att.percentage) || 0
      const score = Number(att.score) || 0
      const totalQ = Number(att.total_questions) || 0

      for (const qm of quizObj.quiz_materials) {
        const matId = qm.material_id
        if (statsMap[matId]) {
          statsMap[matId].attemptsCount += 1
          statsMap[matId].totalQuestions += totalQ
          statsMap[matId].totalCorrect += score
          statsMap[matId].scores.push(numPercentage)
        }
      }
    }

    // Compute averages & statuses
    for (const key of Object.keys(statsMap)) {
      const item = statsMap[key]
      if (item.attemptsCount > 0) {
        const sum = item.scores.reduce((a, b) => a + b, 0)
        item.avgPercentage = Math.round(sum / item.attemptsCount)
        if (item.avgPercentage < 75) {
          item.status = 'weak'
        } else if (item.avgPercentage < 85) {
          item.status = 'progressing'
        } else {
          item.status = 'mastered'
        }
      }
    }

    return Object.values(statsMap)
  }, [materials, attempts])

  const weakTopics = topicStats.filter((t) => t.status === 'weak')
  const masteredTopics = topicStats.filter((t) => t.status === 'mastered')

  const totalTested = topicStats.filter((t) => t.status !== 'untested').length
  const overallAvg =
    totalTested > 0
      ? Math.round(
          topicStats
            .filter((t) => t.status !== 'untested')
            .reduce((sum, t) => sum + t.avgPercentage, 0) / totalTested
        )
      : 0

  function toggleQuestion(id: string) {
    setExpandedQuestions((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  // Filtered topics list
  const displayedTopics = useMemo(() => {
    if (filter === 'weak') return weakTopics
    if (filter === 'mastered') return masteredTopics
    return topicStats
  }, [filter, weakTopics, masteredTopics, topicStats])

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      {/* Header Banner (Inspired by user design) */}
      <div className="relative rounded-3xl p-6 sm:p-9 lg:p-10 overflow-hidden bg-gradient-to-r from-[#0b0f2e] via-[#121648] to-[#1d1b54] text-white shadow-2xl border border-indigo-500/20">
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-indigo-500/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full bg-pink-500/15 blur-3xl pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-7 space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/10 text-indigo-200 text-xs font-semibold backdrop-blur-md border border-white/15">
              <Brain className="w-3.5 h-3.5 text-sky-400" />
              <span>AI Cognitive Diagnostics Engine</span>
            </div>

            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight">
              Practice{' '}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-sky-400 via-indigo-300 to-pink-400">
                Weak Areas
              </span>
            </h1>

            <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-xl">
              Ace-It! analyzes your quiz attempts, identifies learning gaps below 75% accuracy, and recommends targeted practice sessions to turn weak spots into subject mastery.
            </p>

            {/* 3 Core Value Proposition Feature Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
              <div className="flex items-start gap-2.5 p-2.5 rounded-2xl bg-white/[0.04] border border-white/10 backdrop-blur-xs">
                <div className="w-8 h-8 rounded-xl bg-purple-600/30 border border-purple-500/40 flex items-center justify-center text-purple-300 shrink-0">
                  <Target className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Find Your Gaps</h4>
                  <p className="text-[10.5px] text-slate-300 leading-tight">Pinpoints topics you need to improve on.</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-2.5 rounded-2xl bg-white/[0.04] border border-white/10 backdrop-blur-xs">
                <div className="w-8 h-8 rounded-xl bg-sky-600/30 border border-sky-500/40 flex items-center justify-center text-sky-300 shrink-0">
                  <Lightbulb className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Get Targeted Practice</h4>
                  <p className="text-[10.5px] text-slate-300 leading-tight">Focus on what matters most.</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-2.5 rounded-2xl bg-white/[0.04] border border-white/10 backdrop-blur-xs">
                <div className="w-8 h-8 rounded-xl bg-emerald-600/30 border border-emerald-500/40 flex items-center justify-center text-emerald-300 shrink-0">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Track Your Progress</h4>
                  <p className="text-[10.5px] text-slate-300 leading-tight">See your improvement over time.</p>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <Button
                onClick={() => {
                  setFilter('weak')
                  const el = document.getElementById('topics-section')
                  if (el) el.scrollIntoView({ behavior: 'smooth' })
                }}
                className="rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-600 to-pink-600 hover:opacity-95 text-white font-bold shadow-lg shadow-purple-500/30 px-6 py-3 h-auto text-sm transition-all hover:scale-[1.02]"
              >
                Start Practice
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>

          <div className="hidden lg:block lg:col-span-5 relative group">
            <div className="relative aspect-[16/10] rounded-2xl overflow-hidden border border-white/20 shadow-2xl bg-indigo-950/60">
              <Image
                src="/images/cognitive_brain_diagnostics.jpg"
                alt="AI Cognitive Diagnostics & Knowledge Graph"
                fill
                className="object-cover object-center group-hover:scale-105 transition-transform duration-500"
                sizes="(max-width: 1024px) 100vw, 480px"
                priority
              />
              <div className="absolute bottom-2.5 inset-x-2.5 p-2 rounded-xl bg-slate-950/85 backdrop-blur-md border border-white/15 text-center flex items-center justify-center gap-1.5 shadow-lg">
                <Sparkles className="w-3.5 h-3.5 text-sky-400" />
                <p className="text-[11px] font-bold text-sky-300">
                  Targeted Learning Calibration &amp; Neural Analytics
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="rounded-2xl border-border/70 shadow-xs">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
              <TrendingDown className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl font-black text-foreground">{weakTopics.length}</div>
              <div className="text-xs font-medium text-muted-foreground">Topics Need Review (&lt;75%)</div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/70 shadow-xs">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl font-black text-foreground">{masteredTopics.length}</div>
              <div className="text-xs font-medium text-muted-foreground">Mastered Topics (≥85%)</div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/70 shadow-xs">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
              <Flame className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl font-black text-foreground">{attempts.length}</div>
              <div className="text-xs font-medium text-muted-foreground">Total Quizzes Analyzed</div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/70 shadow-xs">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl font-black text-foreground">{overallAvg}%</div>
              <div className="text-xs font-medium text-muted-foreground">Average Accuracy</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs / Filter Pills */}
      <div id="topics-section" className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <div className="flex items-center gap-1.5 p-1 bg-muted/60 dark:bg-muted/30 border border-border/50 rounded-2xl">
          <button
            onClick={() => setFilter('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              filter === 'all'
                ? 'bg-background text-indigo-600 dark:text-indigo-400 shadow-xs border border-border/60'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            All Materials ({topicStats.length})
          </button>

          <button
            onClick={() => setFilter('weak')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              filter === 'weak'
                ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50'
                : 'text-muted-foreground hover:text-rose-600'
            }`}
          >
            <AlertCircle className="w-3.5 h-3.5" />
            Weak Areas ({weakTopics.length})
          </button>

          <button
            onClick={() => setFilter('mastered')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              filter === 'mastered'
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/50'
                : 'text-muted-foreground hover:text-emerald-600'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            Mastered ({masteredTopics.length})
          </button>

          <button
            onClick={() => setFilter('missed')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              filter === 'missed'
                ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-900/50'
                : 'text-muted-foreground hover:text-indigo-600'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            Missed Questions ({wrongAnswers.length})
          </button>
        </div>

        <Link href="/quiz/create">
          <Button size="sm" className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs h-9 shadow-xs">
            <Plus className="w-3.5 h-3.5 mr-1" />
            Create Targeted Quiz
          </Button>
        </Link>
      </div>

      {/* Main Content Area */}
      {filter !== 'missed' ? (
        <div className="space-y-4">
          {displayedTopics.length === 0 ? (
            <Card className="rounded-2xl border-dashed border-2 text-center p-8">
              <CardContent className="space-y-3">
                <Target className="w-10 h-10 text-muted-foreground mx-auto" />
                <h3 className="text-base font-bold">No topics in this category</h3>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  {filter === 'weak'
                    ? 'Great job! You do not have any topics below 75% accuracy.'
                    : 'Take more practice quizzes to calibrate your accuracy.'}
                </p>
                <Button variant="outline" size="sm" onClick={() => setFilter('all')} className="rounded-xl text-xs">
                  View All Topics
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {displayedTopics.map((item) => {
                const isWeak = item.status === 'weak'
                const isMastered = item.status === 'mastered'
                const isUntested = item.status === 'untested'

                return (
                  <Card
                    key={item.material.id}
                    className={`rounded-2xl border transition-all hover:shadow-md ${
                      isWeak
                        ? 'border-rose-200 dark:border-rose-900/50 bg-rose-500/[0.015]'
                        : isMastered
                        ? 'border-emerald-200 dark:border-emerald-900/50 bg-emerald-500/[0.015]'
                        : 'border-border/70'
                    }`}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                              isWeak
                                ? 'bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-400'
                                : isMastered
                                ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400'
                                : 'bg-muted text-muted-foreground'
                            }`}
                          >
                            <FileText className="w-5 h-5" />
                          </div>
                          <div className="min-w-0">
                            <CardTitle className="text-sm font-bold truncate leading-tight">
                              {item.material.original_filename}
                            </CardTitle>
                            <CardDescription className="text-xs mt-0.5">
                              {item.attemptsCount > 0
                                ? `${item.attemptsCount} attempt${item.attemptsCount > 1 ? 's' : ''} · ${item.totalQuestions} questions`
                                : 'No quizzes completed yet'}
                            </CardDescription>
                          </div>
                        </div>

                        {/* Status Badge */}
                        {isWeak && (
                          <Badge variant="destructive" className="text-[10px] font-bold rounded-lg shrink-0">
                            Needs Review
                          </Badge>
                        )}
                        {isMastered && (
                          <Badge className="bg-emerald-600 hover:bg-emerald-600 text-white text-[10px] font-bold rounded-lg shrink-0">
                            Mastered
                          </Badge>
                        )}
                        {item.status === 'progressing' && (
                          <Badge variant="secondary" className="text-[10px] font-bold rounded-lg shrink-0">
                            In Progress
                          </Badge>
                        )}
                        {isUntested && (
                          <Badge variant="outline" className="text-[10px] text-muted-foreground rounded-lg shrink-0">
                            Untested
                          </Badge>
                        )}
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-4 pt-0">
                      {/* Accuracy Bar */}
                      {!isUntested ? (
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">Accuracy:</span>
                            <span
                              className={`font-black ${
                                isWeak
                                  ? 'text-rose-600 dark:text-rose-400'
                                  : isMastered
                                  ? 'text-emerald-600 dark:text-emerald-400'
                                  : 'text-indigo-600 dark:text-indigo-400'
                              }`}
                            >
                              {item.avgPercentage}%
                            </span>
                          </div>
                          <Progress
                            value={item.avgPercentage}
                            className={`h-2 rounded-full ${
                              isWeak
                                ? '[&>div]:bg-rose-500'
                                : isMastered
                                ? '[&>div]:bg-emerald-500'
                                : '[&>div]:bg-indigo-600'
                            }`}
                          />
                        </div>
                      ) : (
                        <div className="p-2.5 rounded-xl bg-muted/40 text-xs text-muted-foreground text-center">
                          Generate your first practice quiz on this topic to calibrate your score.
                        </div>
                      )}

                      {/* Action Button */}
                      <div className="pt-1 flex items-center justify-between gap-2">
                        <Link
                          href={`/quiz/create?materialId=${item.material.id}`}
                          className="w-full"
                        >
                          <Button
                            size="sm"
                            className={`w-full rounded-xl text-xs font-semibold h-9 ${
                              isWeak
                                ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-xs shadow-rose-600/20'
                                : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs shadow-indigo-600/20'
                            }`}
                          >
                            {isWeak ? (
                              <>
                                <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                                Practice This Weak Topic
                              </>
                            ) : isUntested ? (
                              <>
                                <Plus className="w-3.5 h-3.5 mr-1.5" />
                                Generate Quiz for This Topic
                              </>
                            ) : (
                              <>
                                <Target className="w-3.5 h-3.5 mr-1.5" />
                                Practice Topic Refresher
                              </>
                            )}
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      ) : (
        /* Missed Questions Diagnostic View */
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-foreground">Recent Questions You Missed</h2>
              <p className="text-xs text-muted-foreground">
                Review the questions you answered incorrectly, along with correct answers and verified source explanations.
              </p>
            </div>
          </div>

          {wrongAnswers.length === 0 ? (
            <Card className="rounded-2xl border-dashed border-2 text-center p-8">
              <CardContent className="space-y-2">
                <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
                <h3 className="text-base font-bold">No Missed Questions Recorded!</h3>
                <p className="text-xs text-muted-foreground">
                  You have answered every recent question correctly, or haven&apos;t taken a quiz yet.
                </p>
              </CardContent>
            </Card>
          ) : (
            wrongAnswers.map((wa, idx) => {
              const qObj = Array.isArray(wa.questions) ? wa.questions[0] : wa.questions
              if (!qObj) return null

              const isExpanded = expandedQuestions.has(wa.id)
              const quizTitle = Array.isArray(qObj.quizzes)
                ? qObj.quizzes[0]?.title
                : qObj.quizzes?.title

              return (
                <Card key={wa.id} className="rounded-2xl border border-rose-200/80 dark:border-rose-900/50 bg-rose-500/[0.015]">
                  <CardHeader
                    className="pb-3 pt-4 cursor-pointer"
                    onClick={() => toggleQuestion(wa.id)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="w-6 h-6 rounded-full bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-400 flex items-center justify-center shrink-0 mt-0.5">
                          <XCircle className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                              Missed Question #{idx + 1}
                            </span>
                            {quizTitle && (
                              <Badge variant="outline" className="text-[10px] truncate max-w-[200px]">
                                {quizTitle}
                              </Badge>
                            )}
                          </div>
                          <CardTitle className="text-sm font-semibold leading-relaxed text-foreground">
                            {qObj.question_text}
                          </CardTitle>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleQuestion(wa.id)
                        }}
                        className="p-1 rounded-lg text-muted-foreground hover:text-foreground shrink-0"
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>
                  </CardHeader>

                  {isExpanded && (
                    <CardContent className="pt-0 pb-4 space-y-3">
                      <Separator className="opacity-60" />

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20">
                          <div className="font-semibold text-rose-700 dark:text-rose-300 mb-0.5">
                            Your Incorrect Answer:
                          </div>
                          <div className="font-bold text-rose-600 dark:text-rose-400">
                            {wa.selected_answer || '(None / Timed out)'}
                          </div>
                        </div>

                        <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                          <div className="font-semibold text-emerald-700 dark:text-emerald-300 mb-0.5">
                            Correct Answer:
                          </div>
                          <div className="font-bold text-emerald-700 dark:text-emerald-300">
                            {qObj.correct_answer}
                          </div>
                        </div>
                      </div>

                      {qObj.explanation && (
                        <div className="p-3 rounded-xl bg-muted/40 border border-border/40 text-xs space-y-1">
                          <div className="font-bold text-foreground flex items-center gap-1.5">
                            <Brain className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                            Diagnostic Explanation
                          </div>
                          <p className="text-muted-foreground leading-relaxed">{qObj.explanation}</p>
                        </div>
                      )}
                    </CardContent>
                  )}
                </Card>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}
