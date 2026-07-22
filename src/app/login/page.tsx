// src/app/login/page.tsx
'use client'
import { useState, Suspense } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'

function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [error, setError] = useState('')
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    const { error } =
      mode === 'signin'
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password })

    if (error) { setError(error.message); return }
    const redirect = searchParams.get('redirect')
    router.push(redirect || '/')
    router.refresh()
  }

  return (
    <div className="max-w-sm mx-auto mt-24 px-6">
      <div className="bg-surface border border-line rounded-xl p-8">
        <h1 className="font-display font-bold text-2xl mb-1">
          {mode === 'signin' ? 'Welcome back' : 'Join the herd'}
        </h1>
        <p className="text-sm text-ink-faint mb-6">
          {mode === 'signin' ? 'Sign in to vote, review, and submit APIs.' : 'Free account, takes a few seconds.'}
        </p>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)}
            className="w-full bg-bg-alt border border-line rounded px-3 py-2.5 text-sm focus:outline-none focus:border-ink-faint transition" required />
          <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)}
            className="w-full bg-bg-alt border border-line rounded px-3 py-2.5 text-sm focus:outline-none focus:border-ink-faint transition" required />
          {error && <p className="text-flag text-xs">{error}</p>}
          <button type="submit" className="w-full bg-tag text-[#1a2015] font-semibold py-2.5 rounded hover:brightness-110 transition">
            {mode === 'signin' ? 'Sign in' : 'Create account'}
          </button>
        </form>
        <button onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
          className="text-xs text-ink-faint hover:text-ink-dim transition w-full text-center mt-5">
          {mode === 'signin' ? "Need an account? Sign up" : 'Have an account? Sign in'}
        </button>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}