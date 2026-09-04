import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: quizzes, error } = await supabase
    .from('quizzes')
    .select(`
      *,
      quiz_materials(material_id, materials(id, original_filename, file_type)),
      quiz_attempts(id, score, total_questions, percentage, completed_at)
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch quizzes' }, { status: 500 })
  }

  return NextResponse.json({ quizzes })
}
