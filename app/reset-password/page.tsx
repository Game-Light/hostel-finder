'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function ResetPasswordPage() {
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
    // Supabase puts the access token in the URL hash after clicking the reset link
    // onAuthStateChange picks this up automatically
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setValidSession(true)
      }
      setChecking(false)
    })

    // Also check if already in a valid session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setValidSession(true)
        setChecking(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleReset = async (e: React.FormEvent) => {
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

    setLoading(false)

    if (updateError) {
      setError(updateError.message)
      return
    }

    setDone(true)

    // Redirect to login after 3 seconds
    setTimeout(() => router.push('/login'), 3000)
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

      {/* Header */}
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
            // Success
            <>
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6" style={{ backgroundColor: '#E8F5EE' }}>
                <svg className="w-8 h-8" style={{ color: '#034338' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="text-2xl font-black mb-2" style={{ color: '#0A2A23' }}>Password updated!</h1>
              <p className="text-sm font-medium mb-6" style={{ color: '#4B6B62' }}>
                Your password has been changed successfully. Redirecting you to login...
              </p>
              <Link
                href="/login"
                className="inline-flex items-center justify-center w-full py-3.5 rounded-xl font-bold text-sm text-white hover:opacity-90 transition-opacity"
                style={{ backgroundColor: '#034338' }}
              >
                Go to login now
              </Link>
            </>
          ) : !validSession ? (
            // Invalid or expired link
            <>
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6" style={{ backgroundColor: '#FEE2E2' }}>
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M12 3a9 9 0 100 18A9 9 0 0012 3z" />
                </svg>
              </div>
              <h1 className="text-2xl font-black mb-2" style={{ color: '#0A2A23' }}>Link expired</h1>
              <p className="text-sm font-medium mb-6" style={{ color: '#4B6B62' }}>
                This reset link is invalid or has expired. Request a new one.
              </p>
              <Link
                href="/forgot-password"
                className="inline-flex items-center justify-center w-full py-3.5 rounded-xl font-bold text-sm text-white hover:opacity-90 transition-opacity"
                style={{ backgroundColor: '#034338' }}
              >
                Request new link
              </Link>
            </>
          ) : (
            // Reset form
            <>
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6" style={{ backgroundColor: '#E8F5EE' }}>
                <svg className="w-8 h-8" style={{ color: '#034338' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>

              <h1 className="text-2xl font-black mb-2" style={{ color: '#0A2A23' }}>Set new password</h1>
              <p className="text-sm font-medium mb-8" style={{ color: '#4B6B62' }}>
                Choose a strong password for your account.
              </p>

              {error && (
                <div className="mb-5 px-4 py-3 rounded-xl text-sm font-medium" style={{ backgroundColor: '#FEE2E2', color: '#991B1B' }}>
                  {error}
                </div>
              )}

              <form onSubmit={handleReset} className="flex flex-col gap-4">
                <div>
                  <label className="block text-xs font-bold mb-1.5" style={{ color: '#0A2A23' }}>
                    New password
                  </label>
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
                  <label className="block text-xs font-bold mb-1.5" style={{ color: '#0A2A23' }}>
                    Confirm new password
                  </label>
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
                  {loading ? 'Updating...' : 'Update password'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
