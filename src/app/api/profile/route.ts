import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

const updateProfileSchema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  headline: z.string().max(100).optional().nullable(),
  avatar_url: z.string().optional().nullable(),
})

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const serviceClient = createServiceClient()
  const { data: profile } = await serviceClient
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const userMeta = user.user_metadata || {}

  return NextResponse.json({
    profile: {
      ...profile,
      headline: profile?.headline || userMeta.headline || 'Student',
      avatar_url: profile?.avatar_url || userMeta.avatar_url || null,
    },
  })
}

export async function PATCH(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const parsed = updateProfileSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Invalid data' }, { status: 400 })
  }

  const { full_name, headline, avatar_url } = parsed.data
  const serviceClient = createServiceClient()

  // 1. Update auth.users metadata for immediate session synchronization
  await supabase.auth.updateUser({
    data: {
      full_name,
      headline: headline || 'Student',
      avatar_url: avatar_url || null,
    },
  })

  // 2. Update profiles table
  // Attempt with headline column first; fall back if column doesn't exist yet
  const updatePayload: Record<string, unknown> = {
    full_name,
    avatar_url: avatar_url || null,
    updated_at: new Date().toISOString(),
  }

  if (headline !== undefined) {
    updatePayload.headline = headline || 'Student'
  }

  let { data: profile, error } = await serviceClient
    .from('profiles')
    .update(updatePayload)
    .eq('id', user.id)
    .select()
    .single()

  // If error is related to missing 'headline' column in table schema
  if (error && error.message.includes('headline')) {
    delete updatePayload.headline
    const retry = await serviceClient
      .from('profiles')
      .update(updatePayload)
      .eq('id', user.id)
      .select()
      .single()
    profile = retry.data
    error = retry.error
  }

  if (error) {
    console.error('Profile update error:', error)
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
  }

  return NextResponse.json({
    profile: {
      ...profile,
      headline: headline || profile?.headline || 'Student',
      avatar_url: avatar_url ?? profile?.avatar_url ?? null,
    },
  })
}
