import type { Metadata } from 'next'
import { Suspense } from 'react'
import LoginForm from '@/components/auth/LoginForm'
import { Skeleton } from '@/components/ui/skeleton'

export const metadata: Metadata = {
  title: 'Log In',
  description: 'Log in to your Ace It! account.',
}

export default function LoginPage() {
  return (
    <Suspense fallback={<Skeleton className="w-full max-w-md h-80 rounded-xl" />}>
      <LoginForm />
    </Suspense>
  )
}
