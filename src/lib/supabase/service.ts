import { createClient } from '@supabase/supabase-js'

/**
 * Service role client — bypasses RLS. Server-side only.
 * NEVER expose SUPABASE_SERVICE_ROLE_KEY to the client.
 */
export function createServiceClient() {
  const serviceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  if (
    process.env.NODE_ENV === 'development' &&
    process.env.SUPABASE_SERVICE_ROLE_KEY &&
    process.env.SUPABASE_SERVICE_ROLE_KEY === process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    console.warn(
      '[Supabase Warning] SUPABASE_SERVICE_ROLE_KEY is identical to NEXT_PUBLIC_SUPABASE_ANON_KEY. ' +
      'Server-side operations (file uploads to Storage, document chunk inserts) require the service_role secret key from Supabase Dashboard (Settings → API Keys).'
    )
  }

  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}

