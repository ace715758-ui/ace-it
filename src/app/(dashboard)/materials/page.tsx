import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import MaterialsClient from '@/components/materials/MaterialsClient'

export const metadata: Metadata = { title: 'Materials' }

export default async function MaterialsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: materials } = await supabase
    .from('materials')
    .select('*')
    .eq('user_id', user.id)
    .order('uploaded_at', { ascending: false })

  return <MaterialsClient initialMaterials={materials ?? []} />
}
