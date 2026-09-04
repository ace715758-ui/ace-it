import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import SettingsClient from '@/components/dashboard/SettingsClient'

export const metadata: Metadata = {
  title: 'Settings',
  description: 'Manage your Ace-It! account, security, preferences, and theme.',
}

export default async function SettingsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return (
    <SettingsClient
      user={{
        id: user.id,
        email: user.email ?? '',
        createdAt: user.created_at,
      }}
      profile={profile}
    />
  )
}
