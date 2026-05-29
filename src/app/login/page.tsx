'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setError(error.message); setLoading(false) }
    else router.push('/dashboard')
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) { setError(error.message) }
    else setError('Check your email to confirm your account.')
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f7f6f2] px-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2 mb-8 justify-center">
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-label="Card Ops Logo">
            <rect width="32" height="32" rx="8" fill="#01696f"/>
            <rect x="7" y="9" width="12" height="16" rx="2" fill="white" fillOpacity="0.9"/>
            <rect x="13" y="7" width="12" height="16" rx="2" fill="white" fillOpacity="0.4"/>
            <path d="M10 14h6M10 17h4" stroke="#01696f" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          <span className="text-lg font-bold text-[#28251d] tracking-tight">Card Ops</span>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-black/8 p-8">
          <h1 className="text-xl font-bold text-[#28251d] mb-1">Welcome back</h1>
          <p className="text-sm text-[#7a7974] mb-6">Sign in to your dashboard</p>

          <form className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#28251d] mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-3 py-2 text-sm border border-black/12 rounded-lg bg-[#f9f8f5] focus:outline-none focus:ring-2 focus:ring-[#01696f]/40 focus:border-[#01696f] transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#28251d] mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2 text-sm border border-black/12 rounded-lg bg-[#f9f8f5] focus:outline-none focus:ring-2 focus:ring-[#01696f]/40 focus:border-[#01696f] transition-all"
              />
            </div>

            {error && (
              <p className="text-sm text-rose-600 bg-rose-50 border border-rose-100 rounded-lg px-3 py-2">{error}</p>
            )}

            <button
              type="submit"
              onClick={handleLogin}
              disabled={loading}
              className="w-full bg-[#01696f] hover:bg-[#0c4e54] text-white text-sm font-medium py-2.5 rounded-lg transition-colors disabled:opacity-60"
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
            <button
              type="button"
              onClick={handleSignUp}
              disabled={loading}
              className="w-full bg-transparent hover:bg-[#f0fafa] text-[#01696f] text-sm font-medium py-2.5 rounded-lg border border-[#99dddd] transition-colors disabled:opacity-60"
            >
              Create account
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}