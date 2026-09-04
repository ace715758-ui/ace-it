import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ materialId: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { materialId } = await params

  const { data: material, error } = await supabase
    .from('materials')
    .select('*')
    .eq('id', materialId)
    .eq('user_id', user.id)
    .single()

  if (error || !material) {
    return NextResponse.json({ error: 'Material not found' }, { status: 404 })
  }

  return NextResponse.json({ material })
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ materialId: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { materialId } = await params
  const body = await request.json()

  // Only allow renaming the original_filename
  if (!body.original_filename || typeof body.original_filename !== 'string') {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const { data: material, error } = await supabase
    .from('materials')
    .update({ original_filename: body.original_filename.trim() })
    .eq('id', materialId)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: 'Failed to update material' }, { status: 500 })
  }

  return NextResponse.json({ material })
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ materialId: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { materialId } = await params

  // Verify ownership
  const { data: material } = await supabase
    .from('materials')
    .select('id, storage_path, user_id')
    .eq('id', materialId)
    .eq('user_id', user.id)
    .single()

  if (!material) {
    return NextResponse.json({ error: 'Material not found' }, { status: 404 })
  }

  // Check if material is used in any quiz
  const { count: quizCount } = await supabase
    .from('quiz_materials')
    .select('*', { count: 'exact', head: true })
    .eq('material_id', materialId)

  if ((quizCount ?? 0) > 0) {
    return NextResponse.json(
      {
        error: 'This material is used in one or more quizzes. Delete those quizzes first.',
        canForce: true,
      },
      { status: 409 }
    )
  }

  const serviceClient = createServiceClient()

  // Delete storage file
  if (material.storage_path) {
    await serviceClient.storage
      .from('student-materials')
      .remove([material.storage_path])
  }

  // Delete material (cascades to document_chunks)
  const { error: deleteError } = await supabase
    .from('materials')
    .delete()
    .eq('id', materialId)
    .eq('user_id', user.id)

  if (deleteError) {
    return NextResponse.json({ error: 'Failed to delete material' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
