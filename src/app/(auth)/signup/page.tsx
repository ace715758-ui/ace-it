import type { Metadata } from 'next'
import SignUpForm from '@/components/auth/SignUpForm'

export const metadata: Metadata = {
  title: 'Create Account',
  description: 'Create your Ace It! student account.',
}

export default function SignUpPage() {
  return <SignUpForm />
}
