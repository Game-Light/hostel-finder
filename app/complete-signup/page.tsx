'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function CompleteSignupPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')
  const [validSession, setValidSession] = useState(false)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    // Clicking the confirmation link in the email lands here with a session
    // already established (Supabase puts tokens in the URL, supabase-js
    // auto-detects and fires SIGNED_IN) — same mechanism as password reset,
    // just a different auth event.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') {
        setValidSession(true)
      }
      setChecking(false)
    })

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setValidSession(true)
        setChecking(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)

    const { error: updateError } = await supabase.auth.updateUser({ password })

    if (updateError) {
      setError(updateError.message)
      setLoading(false)
      return
    }

    // Now that a real session exists, apply the details collected at
    // signup (school, referral info) — couldn't be written earlier since
    // there was no session until email verification.
    const { data: { user } } = await supabase.auth.getUser()
    let role: string | null = null

    if (user) {
      const meta = user.user_metadata || {}
      const updates: Record<string, unknown> = {}
      if (meta.university) updates.university = meta.university
      if (meta.referral_code) updates.referral_code = meta.referral_code
      if (meta.referred_by) updates.referred_by = meta.referred_by

      if (Object.keys(updates).length > 0) {
        await supabase.from('users').update(updates).eq('id', user.id)
      }

      if (meta.referred_by) {
        await supabase.rpc('increment_referral_points', { referrer_id: meta.referred_by })
      }

      const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
      role = profile?.role || null
    }

      // Best-effort — don't block signup completion if the email fails
      fetch('/api/email/welcome', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user?.email, name: user?.user_metadata?.full_name, role }),
      }).catch(() => {})

      setLoading(false)
      setDone(true)

      setTimeout(() => {
        router.push(role === 'agent' ? '/agent/dashboard' : '/listings')
      }, 2000)
  }

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F4F6F5' }}>
        <div className="w-8 h-8 rounded-full border-4 border-t-transparent animate-spin" style={{ borderColor: '#034338', borderTopColor: 'transparent' }} />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#F4F6F5' }}>
      <div style={{ backgroundColor: '#034338' }} className="px-4 py-4 border-b border-white/10">
        <div className="max-w-6xl mx-auto">
          <Link href="/">
            <Image src="/logo/Logo-horizontal.svg" alt="Hostel Finder" width={130} height={34} />
          </Link>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">

          {done ? (
            <>
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6" style={{ backgroundColor: '#E8F5EE' }}>
                <svg className="w-8 h-8" style={{ color: '#034338' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="text-2xl font-black mb-2" style={{ color: '#0A2A23' }}>You're all set!</h1>
              <p className="text-sm font-medium mb-6" style={{ color: '#4B6B62' }}>
                Your email is verified and your password is set. Taking you in...
              </p>
            </>
          ) : !validSession ? (
            <>
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6" style={{ backgroundColor: '#FEE2E2' }}>
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M12 3a9 9 0 100 18A9 9 0 0012 3z" />
                </svg>
              </div>
              <h1 className="text-2xl font-black mb-2" style={{ color: '#0A2A23' }}>Link expired</h1>
              <p className="text-sm font-medium mb-6" style={{ color: '#4B6B62' }}>
                This verification link is invalid or has expired. Please sign up again.
              </p>
              <Link
                href="/register"
                className="inline-flex items-center justify-center w-full py-3.5 rounded-xl font-bold text-sm text-white hover:opacity-90 transition-opacity"
                style={{ backgroundColor: '#034338' }}
              >
                Back to sign up
              </Link>
            </>
          ) : (
            <>
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6" style={{ backgroundColor: '#E8F5EE' }}>
                <svg className="w-8 h-8" style={{ color: '#034338' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>

              <h1 className="text-2xl font-black mb-2" style={{ color: '#0A2A23' }}>Create your password</h1>
              <p className="text-sm font-medium mb-8" style={{ color: '#4B6B62' }}>
                Your email is verified. Choose a password to finish setting up your account.
              </p>

              {error && (
                <div className="mb-5 px-4 py-3 rounded-xl text-sm font-medium" style={{ backgroundColor: '#FEE2E2', color: '#991B1B' }}>
                  {error}
                </div>
              )}

              <form onSubmit={handleSetPassword} className="flex flex-col gap-4">
                <div>
                  <label className="block text-xs font-bold mb-1.5" style={{ color: '#0A2A23' }}>Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="Min. 6 characters"
                      required
                      className="w-full px-4 py-3 rounded-xl text-sm outline-none border transition-colors pr-12"
                      style={{ borderColor: '#E8EDEB', backgroundColor: '#FFFFFF', color: '#0A2A23' }}
                      onFocus={e => e.target.style.borderColor = '#034338'}
                      onBlur={e => e.target.style.borderColor = '#E8EDEB'}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2"
                      style={{ color: '#4B6B62' }}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold mb-1.5" style={{ color: '#0A2A23' }}>Confirm password</label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="Repeat your password"
                    required
                    className="w-full px-4 py-3 rounded-xl text-sm outline-none border transition-colors"
                    style={{ borderColor: '#E8EDEB', backgroundColor: '#FFFFFF', color: '#0A2A23' }}
                    onFocus={e => e.target.style.borderColor = '#034338'}
                    onBlur={e => e.target.style.borderColor = '#E8EDEB'}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 rounded-xl font-bold text-sm text-white transition-opacity hover:opacity-90 mt-2 disabled:opacity-60"
                  style={{ backgroundColor: '#034338' }}
                >
                  {loading ? 'Creating account...' : 'Create account'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}