import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ quizId: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { quizId } = await params

  // Verify ownership
  const { data: quiz } = await supabase
    .from('quizzes')
    .select('*')
    .eq('id', quizId)
    .eq('user_id', user.id)
    .single()

  if (!quiz) {
    return NextResponse.json({ error: 'Quiz not found' }, { status: 404 })
  }

  // Fetch questions (server-side only: exclude correct_answer from client)
  const serviceClient = createServiceClient()
  const { data: questions } = await serviceClient
    .from('questions')
    .select('id, question_text, question_type, options, question_order, difficulty')
    .eq('quiz_id', quizId)
    .order('question_order', { ascending: true })

  // Fetch materials
  const { data: quizMaterials } = await supabase
    .from('quiz_materials')
    .select('material_id, materials(id, original_filename, file_type)')
    .eq('quiz_id', quizId)

  return NextResponse.json({
    quiz,
    questions: questions ?? [],
    materials: quizMaterials?.map((qm) => qm.materials) ?? [],
  })
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ quizId: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { quizId } = await params

  const { error } = await supabase
    .from('quizzes')
    .delete()
    .eq('id', quizId)
    .eq('user_id', user.id)

  if (error) {
    return NextResponse.json({ error: 'Failed to delete quiz' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
