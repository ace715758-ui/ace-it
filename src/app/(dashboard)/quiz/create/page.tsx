import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import QuizCreateClient from '@/components/quiz/QuizCreateClient'

export const metadata: Metadata = { title: 'Create Quiz' }

export default async function CreateQuizPage({
  searchParams,
}: {
  searchParams: Promise<{ materialId?: string }>
}) {
  const params = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: materials } = await supabase
    .from('materials')
    .select('id, original_filename, file_type, uploaded_at, processing_status')
    .eq('user_id', user.id)
    .order('uploaded_at', { ascending: false })

  return <QuizCreateClient materials={materials ?? []} initialMaterialId={params?.materialId} />
}
