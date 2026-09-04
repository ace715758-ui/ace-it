import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
  BookOpen,
  Brain,
  History,
  Plus,
  Target,
  TrendingUp,
} from 'lucide-react'

import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatDistanceToNow } from 'date-fns'

export const metadata: Metadata = { title: 'Dashboard' }

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Fetch all stats in parallel
  const [
    { data: profile },
    { count: materialCount },
    { count: quizCount },
    { data: attempts },
    { data: recentAttempts },
  ] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('materials').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
    supabase.from('quizzes').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
    supabase
      .from('quiz_attempts')
      .select('percentage')
      .eq('user_id', user.id)
      .not('completed_at', 'is', null),
    supabase
      .from('quiz_attempts')
      .select('*, quizzes(title, difficulty, question_count)')
      .eq('user_id', user.id)
      .not('completed_at', 'is', null)
      .order('completed_at', { ascending: false })
      .limit(5),
  ])

  const completedCount = attempts?.length ?? 0
  const avgScore =
    completedCount > 0
      ? Math.round(
          (attempts!.reduce((sum, a) => sum + a.percentage, 0) / completedCount)
        )
      : 0

  const firstName = profile?.full_name?.split(' ')[0] ?? 'Student'

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
          Welcome back, {firstName}!
        </h1>
        <p className="text-muted-foreground mt-1">Ready to test your knowledge?</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Materials Uploaded"
          value={materialCount ?? 0}
          icon={BookOpen}
          color="text-blue-600"
        />
        <StatCard
          title="Quizzes Created"
          value={quizCount ?? 0}
          icon={Brain}
          color="text-violet-600"
        />
        <StatCard
          title="Quizzes Completed"
          value={completedCount}
          icon={Target}
          color="text-green-600"
        />
        <StatCard
          title="Average Score"
          value={`${avgScore}%`}
          icon={TrendingUp}
          color="text-amber-600"
        />
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          <Button asChild>
            <Link href="/materials">
              <Plus className="w-4 h-4 mr-1.5" />
              Upload Material
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/quiz/create">
              <Brain className="w-4 h-4 mr-1.5" />
              Create Quiz
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/history">
              <History className="w-4 h-4 mr-1.5" />
              View History
            </Link>
          </Button>
        </div>
      </div>

      {/* Recent Quizzes */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Recent Quizzes</h2>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/history">View all</Link>
          </Button>
        </div>

        {recentAttempts && recentAttempts.length > 0 ? (
          <div className="space-y-3">
            {recentAttempts.map((attempt) => {
              const quiz = attempt.quizzes as { title: string; difficulty: string; question_count: number } | null
              return (
                <Card key={attempt.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">
                          {quiz?.title ?? 'Untitled Quiz'}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {quiz?.question_count ?? 0} questions •{' '}
                          {attempt.completed_at
                            ? formatDistanceToNow(new Date(attempt.completed_at), {
                                addSuffix: true,
                              })
                            : 'In progress'}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <Badge
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
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/quiz/${attempt.quiz_id}/results/${attempt.id}`}>
                            Review
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <Brain className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No quizzes completed yet.</p>
              <p className="text-sm text-muted-foreground mb-4">
                Create your first quiz and start practicing.
              </p>
              <Button asChild>
                <Link href="/quiz/create">Create a Quiz</Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

function StatCard({
  title,
  value,
  icon: Icon,
  color,
}: {
  title: string
  value: string | number
  icon: React.ElementType
  color: string
}) {
  return (
    <Card>
      <CardHeader className="pb-2 pt-4 px-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
            {title}
          </CardTitle>
          <Icon className={`w-4 h-4 ${color}`} />
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <p className="text-2xl font-bold">{value}</p>
      </CardContent>
    </Card>
  )
}
