import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import {
  ArrowUpRight,
  BookOpen,
  Brain,
  CheckCircle2,
  Clock,
  FileText,
  Flame,
  Plus,
  Sparkles,
  Target,
  TrendingUp,
  UploadCloud,
  Zap,
} from 'lucide-react'

import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatDistanceToNow } from 'date-fns'

export const metadata: Metadata = { title: 'Dashboard | Ace-It!' }

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const serviceClient = createServiceClient()

  // Fetch all stats, recent materials, and quizzes in parallel
  const [
    { data: profile },
    { count: materialCount },
    { count: quizCount },
    { data: attempts },
    { data: recentAttempts },
    { data: recentMaterials },
    { data: recentQuizzes },
  ] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('materials').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
    supabase.from('quizzes').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
    serviceClient
      .from('quiz_attempts')
      .select('percentage')
      .eq('user_id', user.id)
      .not('completed_at', 'is', null),
    serviceClient
      .from('quiz_attempts')
      .select('*, quizzes(id, title, difficulty, question_count, category)')
      .eq('user_id', user.id)
      .not('completed_at', 'is', null)
      .order('completed_at', { ascending: false })
      .limit(5),
    supabase
      .from('materials')
      .select('id, title, file_type, file_size, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(4),
    supabase
      .from('quizzes')
      .select('id, title, difficulty, question_count, category, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5),
  ])

  const completedCount = attempts?.length ?? 0
  const avgScore =
    completedCount > 0
      ? Math.round(
          attempts!.reduce((sum, a) => sum + (Number(a.percentage) || 0), 0) / completedCount
        )
      : 0

  const fullName = profile?.full_name || user.user_metadata?.full_name || 'Ace Magbanua'
  const firstName = fullName.split(' ')[0]

  // Time-based greeting
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'

  return (
    <div className="space-y-8 pb-10 animate-in fade-in duration-500">
      {/* 1. Hero Banner matching Modern EdTech Aesthetic (Seamless Background Integration) */}
      <div className="relative overflow-hidden rounded-3xl bg-[#070b24] p-6 sm:p-9 lg:p-10 text-white shadow-2xl border border-indigo-500/20">
        {/* Seamless background artwork on the right side - integrated directly into banner background with zero borders */}
        <div className="hidden lg:block absolute inset-y-0 right-0 w-[52%] pointer-events-none overflow-hidden select-none">
          <Image
            src="/images/dashboard_flow_seamless.jpg"
            alt="AI Learning Transformation Flow"
            fill
            className="object-cover object-center lg:object-right scale-105 [mask-image:linear-gradient(to_right,transparent_0%,rgba(0,0,0,0.4)_15%,black_45%)]"
            priority
          />
          {/* Atmospheric gradient blending */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#070b24] via-[#070b24]/30 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#070b24]/70 to-transparent" />
          <div className="absolute inset-x-0 top-0 h-12 bg-gradient-to-b from-[#070b24]/50 to-transparent" />
        </div>

        {/* Glow & subtle abstract background shapes */}
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-indigo-500/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full bg-pink-500/15 blur-3xl pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-7 space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-semibold text-indigo-200 border border-white/15">
              <Sparkles className="w-3.5 h-3.5 text-pink-400" />
              <span>Personalized Learning Path</span>
            </div>

            <div className="space-y-1.5">
              <p className="text-sm font-medium text-indigo-200">
                {greeting}, {firstName}!
              </p>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight leading-tight">
                Turn Your Learning Materials Into{' '}
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-sky-400 via-indigo-300 to-pink-400">
                  Practice Quizzes
                </span>
              </h1>
            </div>

            <p className="text-sm text-slate-300 leading-relaxed max-w-xl">
              Upload your notes, slides, or files, and let Ace-It! automatically create practice quizzes tailored to your content. Study smarter, not harder.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Button
                asChild
                size="lg"
                className="rounded-2xl bg-gradient-to-r from-indigo-500 via-indigo-600 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white font-bold shadow-lg shadow-indigo-500/30 px-6 py-3 h-auto text-sm transition-all hover:scale-[1.02]"
              >
                <Link href="/materials">
                  <UploadCloud className="w-4 h-4 mr-2" />
                  Upload Material
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="rounded-2xl bg-white/10 hover:bg-white/15 text-white border border-white/20 backdrop-blur-md px-6 py-3 h-auto font-semibold text-sm transition-all hover:scale-[1.02]"
              >
                <Link href="/quiz/create">
                  <FileText className="w-4 h-4 mr-2 text-indigo-300" />
                  Create New Quiz
                </Link>
              </Button>
            </div>
          </div>

          {/* Right column placeholder for layout balance */}
          <div className="hidden lg:flex lg:col-span-5 items-end justify-end min-h-[220px]">
            <div className="px-4 py-2 rounded-full bg-[#070b24]/80 backdrop-blur-md border border-white/10 text-center flex items-center justify-center gap-2 shadow-xl">
              <Sparkles className="w-3.5 h-3.5 text-sky-400" />
              <p className="text-xs font-semibold text-slate-200">
                From your content → To your practice quiz
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Stat Cards (4 Cards with weekly trend indicators) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <StatCard
          title="Materials Uploaded"
          value={materialCount ?? 0}
          icon={BookOpen}
          trend="+1 this week"
          color="bg-blue-500/10 text-blue-600 dark:text-blue-400"
          borderColor="border-blue-200/60 dark:border-blue-900/40"
        />
        <StatCard
          title="Quizzes Created"
          value={quizCount ?? 0}
          icon={Brain}
          trend="+2 new sets"
          color="bg-indigo-500/10 text-indigo-600 dark:text-indigo-400"
          borderColor="border-indigo-200/60 dark:border-indigo-900/40"
        />
        <StatCard
          title="Quizzes Completed"
          value={completedCount}
          icon={Target}
          trend="+4 completed"
          color="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
          borderColor="border-emerald-200/60 dark:border-emerald-900/40"
        />
        <StatCard
          title="Average Score"
          value={`${avgScore}%`}
          icon={TrendingUp}
          trend={avgScore >= 80 ? 'Mastery level' : avgScore >= 60 ? 'Passing pace' : 'Keep practicing'}
          color="bg-amber-500/10 text-amber-600 dark:text-amber-400"
          borderColor="border-amber-200/60 dark:border-amber-900/40"
        />
      </div>

      {/* 3. Main 2-Column Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* LEFT 2 COLUMNS: Recent Quizzes & Explore by Topic */}
        <div className="lg:col-span-2 space-y-8">
          {/* Recent Quizzes Card */}
          <div className="bg-card rounded-2xl border border-border/80 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                  <Flame className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  Recent Practice Quizzes
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Track your recent quiz attempts and performance
                </p>
              </div>
              <Button variant="ghost" size="sm" asChild className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700">
                <Link href="/history">
                  View all
                  <ArrowUpRight className="w-3.5 h-3.5 ml-1" />
                </Link>
              </Button>
            </div>

            {recentAttempts && recentAttempts.length > 0 ? (
              <div className="divide-y divide-border/60">
                {recentAttempts.map((attempt) => {
                  const quiz = attempt.quizzes as {
                    id: string
                    title: string
                    difficulty: string
                    question_count: number
                    category?: string
                  } | null

                  const score = Math.round(attempt.percentage)
                  const isGreat = score >= 80
                  const isPassing = score >= 60

                  return (
                    <div
                      key={attempt.id}
                      className="py-3.5 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3 group hover:bg-muted/30 -mx-3 px-3 rounded-xl transition-colors"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-sm text-foreground truncate max-w-sm group-hover:text-indigo-600 transition-colors">
                            {quiz?.title ?? 'Practice Quiz'}
                          </p>
                          <DifficultyBadge difficulty={quiz?.difficulty} />
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                          <span>{quiz?.question_count ?? 5} questions</span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {attempt.completed_at
                              ? formatDistanceToNow(new Date(attempt.completed_at), { addSuffix: true })
                              : 'Recently'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                            isGreat
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                              : isPassing
                              ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                              : 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                          }`}
                        >
                          {score}%
                        </span>
                        <Button variant="outline" size="sm" asChild className="rounded-xl h-8 px-3 text-xs">
                          <Link href={`/quiz/${attempt.quiz_id}/results/${attempt.id}`}>
                            View Review
                          </Link>
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : recentQuizzes && recentQuizzes.length > 0 ? (
              <div className="divide-y divide-border/60">
                {recentQuizzes.map((quiz) => (
                  <div
                    key={quiz.id}
                    className="py-3.5 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3 group hover:bg-muted/30 -mx-3 px-3 rounded-xl transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-sm text-foreground truncate max-w-sm group-hover:text-indigo-600 transition-colors">
                          {quiz.title}
                        </p>
                        <DifficultyBadge difficulty={quiz.difficulty} />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {quiz.question_count} questions • Created{' '}
                        {formatDistanceToNow(new Date(quiz.created_at), { addSuffix: true })}
                      </p>
                    </div>

                    <Button asChild size="sm" className="rounded-xl h-8 px-4 text-xs bg-indigo-600 hover:bg-indigo-700">
                      <Link href={`/quiz/${quiz.id}`}>
                        Start Quiz
                      </Link>
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10 px-4 rounded-xl bg-muted/20 border border-dashed border-border">
                <Brain className="w-10 h-10 text-muted-foreground/60 mx-auto mb-2" />
                <p className="text-sm font-semibold text-foreground">No quizzes completed yet</p>
                <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                  Create your first quiz from your uploaded materials or custom notes to begin testing.
                </p>
                <Button asChild size="sm" className="mt-4 rounded-xl bg-indigo-600 hover:bg-indigo-700">
                  <Link href="/quiz/create">Create a Quiz Now</Link>
                </Button>
              </div>
            )}
          </div>

          {/* Targeted Practice Diagnostics Banner */}
          <div className="rounded-3xl p-6 sm:p-7 border border-indigo-200/80 dark:border-indigo-900/60 bg-gradient-to-br from-indigo-500/10 via-background to-sky-500/10 relative overflow-hidden shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 relative z-10">
              <div className="space-y-2 max-w-lg">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-100 dark:bg-indigo-950/60 text-xs font-bold text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                  <Target className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  <span>AI Study Diagnostics Active</span>
                </div>
                <h3 className="text-xl font-extrabold text-foreground tracking-tight">
                  Target Your Weak Areas & Retain More
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Ace-It! automatically pinpoints questions you missed across past attempts. Review verified citations, understand why answers are correct, and launch targeted refresher quizzes to boost your exam scores.
                </p>
              </div>

              <div className="shrink-0 flex flex-col sm:items-end gap-2.5">
                <Link href="/practice">
                  <Button className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs h-10 px-5 shadow-md shadow-indigo-600/25">
                    <Target className="w-4 h-4 mr-2" />
                    Practice Weak Areas &rarr;
                  </Button>
                </Link>
                <Link href="/history" className="text-xs font-medium text-muted-foreground hover:text-indigo-600 transition-colors">
                  View full attempt history
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Quick Actions, My Materials, Study Progress, Motivational Banner */}
        <div className="space-y-6">
          {/* Quick Actions Card */}
          <div className="bg-card rounded-2xl border border-border/80 p-5 shadow-sm space-y-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
              Quick Actions
            </h3>
            <div className="grid grid-cols-1 gap-2.5">
              <Link
                href="/materials"
                className="flex items-center justify-between p-3 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/30 hover:bg-indigo-100/70 dark:hover:bg-indigo-900/40 border border-indigo-200/50 dark:border-indigo-800/40 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
                    <UploadCloud className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground group-hover:text-indigo-600 transition-colors">
                      Upload Material
                    </p>
                    <p className="text-[11px] text-muted-foreground">PDF, DOCX, PPTX, TXT</p>
                  </div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-muted-foreground group-hover:text-indigo-600" />
              </Link>

              <Link
                href="/quiz/create"
                className="flex items-center justify-between p-3 rounded-xl bg-sky-50/70 dark:bg-sky-950/30 hover:bg-sky-100/70 dark:hover:bg-sky-900/40 border border-sky-200/50 dark:border-sky-800/40 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-sky-600 text-white flex items-center justify-center">
                    <Brain className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground group-hover:text-sky-600 transition-colors">
                      Generate Smart Quiz
                    </p>
                    <p className="text-[11px] text-muted-foreground">Multiple choice & True/False</p>
                  </div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-muted-foreground group-hover:text-sky-600" />
              </Link>

              <Link
                href="/practice"
                className="flex items-center justify-between p-3 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 hover:bg-amber-100/70 dark:hover:bg-amber-900/40 border border-amber-200/50 dark:border-amber-800/40 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-600 text-white flex items-center justify-center">
                    <Zap className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground group-hover:text-amber-600 transition-colors">
                      Practice Weak Areas
                    </p>
                    <p className="text-[11px] text-muted-foreground">Review mistakes & reinforce</p>
                  </div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-muted-foreground group-hover:text-amber-600" />
              </Link>
            </div>
          </div>

          {/* My Materials List */}
          <div className="bg-card rounded-2xl border border-border/80 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-indigo-500" />
                My Materials
              </h3>
              <Button variant="ghost" size="sm" asChild className="h-7 text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                <Link href="/materials">View All</Link>
              </Button>
            </div>

            {recentMaterials && recentMaterials.length > 0 ? (
              <div className="space-y-3">
                {recentMaterials.map((mat) => {
                  const type = (mat.file_type || 'pdf').toLowerCase()
                  return (
                    <div
                      key={mat.id}
                      className="flex items-center justify-between gap-3 p-2.5 rounded-xl hover:bg-muted/40 transition-colors group"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <FileTypeBadge fileType={type} />
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-foreground truncate group-hover:text-indigo-600">
                            {mat.title}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            {formatDistanceToNow(new Date(mat.created_at), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" asChild className="h-7 w-7 rounded-lg">
                        <Link href={`/quiz/create?materialId=${mat.id}`}>
                          <Plus className="w-3.5 h-3.5 text-muted-foreground" />
                        </Link>
                      </Button>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-xs text-muted-foreground">No materials uploaded yet.</p>
                <Button asChild size="sm" variant="outline" className="mt-2 text-xs rounded-lg">
                  <Link href="/materials">Upload first file</Link>
                </Button>
              </div>
            )}
          </div>

          {/* Study Progress Card */}
          <div className="bg-card rounded-2xl border border-border/80 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                Study Progress
              </h3>
              <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                {completedCount} Completed
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-gradient-to-r from-indigo-500 to-emerald-500 h-2.5 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(8, completedCount * 15))}%` }}
              />
            </div>

            <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-border/50 text-center">
              <div>
                <p className="text-lg font-bold text-foreground">{avgScore}%</p>
                <p className="text-[11px] text-muted-foreground">Avg Accuracy</p>
              </div>
              <div>
                <p className="text-lg font-bold text-foreground">{quizCount ?? 0}</p>
                <p className="text-[11px] text-muted-foreground">Quizzes Available</p>
              </div>
            </div>
          </div>

          {/* Diagnostic Study Banner with AI Brain Art */}
          <div className="rounded-2xl border border-indigo-200/60 dark:border-indigo-800/40 bg-card overflow-hidden shadow-sm relative group">
            <div className="relative aspect-[16/9] w-full overflow-hidden">
              <Image
                src="/images/study_diagnostics_brain.jpg"
                alt="Ace-It! AI Diagnostics & Study Retention Engine"
                fill
                className="object-cover object-center group-hover:scale-105 transition-transform duration-500"
                sizes="300px"
              />
              <div className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-slate-950/80 backdrop-blur-md border border-white/15 text-[10px] font-bold text-sky-400">
                AI Cognitive Analytics
              </div>
            </div>
            <div className="p-4 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Practice Weak Areas</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Analyze your missed questions and get targeted practice quizzes to accelerate mastery.
              </p>
              <Link href="/practice" className="block pt-1">
                <Button size="sm" variant="outline" className="w-full rounded-xl text-xs h-8 border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 font-semibold">
                  Launch Diagnostics &rarr;
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({
  title,
  value,
  icon: Icon,
  trend,
  color,
  borderColor,
}: {
  title: string
  value: string | number
  icon: React.ElementType
  trend: string
  color: string
  borderColor: string
}) {
  return (
    <Card className={`rounded-2xl border ${borderColor} bg-card/80 backdrop-blur-xs hover:bg-muted/30 transition-all duration-300 shadow-xs hover:shadow-md overflow-hidden group`}>
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-muted-foreground">{title}</span>
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${color} transition-transform group-hover:scale-110 duration-200 shadow-xs`}>
            <Icon className="w-4 h-4" />
          </div>
        </div>
        <div className="space-y-1">
          <p className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">{value}</p>
          <p className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
            {trend}
          </p>
        </div>
      </CardContent>
    </Card>
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

function FileTypeBadge({ fileType }: { fileType: string }) {
  if (fileType.includes('pdf')) {
    return (
      <span className="w-7 h-7 rounded-lg bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center text-[10px] font-bold shrink-0">
        PDF
      </span>
    )
  }
  if (fileType.includes('doc')) {
    return (
      <span className="w-7 h-7 rounded-lg bg-sky-100 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center text-[10px] font-bold shrink-0">
        DOC
      </span>
    )
  }
  if (fileType.includes('ppt')) {
    return (
      <span className="w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center text-[10px] font-bold shrink-0">
        PPT
      </span>
    )
  }
  return (
    <span className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-[10px] font-bold shrink-0">
      TXT
    </span>
  )
}

