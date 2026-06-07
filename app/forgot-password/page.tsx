'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })

    setLoading(false)

    if (resetError) {
      setError(resetError.message)
      return
    }

    setSent(true)
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

          {!sent ? (
            <>
              {/* Icon */}
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6" style={{ backgroundColor: '#E8F5EE' }}>
                <svg className="w-8 h-8" style={{ color: '#034338' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
              </div>

              <h1 className="text-2xl font-black mb-2" style={{ color: '#0A2A23' }}>Forgot your password?</h1>
              <p className="text-sm font-medium mb-8" style={{ color: '#4B6B62' }}>
                Enter your email and we'll send you a link to reset your password.
              </p>

              {error && (
                <div className="mb-5 px-4 py-3 rounded-xl text-sm font-medium" style={{ backgroundColor: '#FEE2E2', color: '#991B1B' }}>
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div>
                  <label className="block text-xs font-bold mb-1.5" style={{ color: '#0A2A23' }}>
                    Email address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@example.com"
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
                  className="w-full py-3.5 rounded-xl font-bold text-sm text-white transition-opacity hover:opacity-90 disabled:opacity-60"
                  style={{ backgroundColor: '#034338' }}
                >
                  {loading ? 'Sending...' : 'Send reset link'}
                </button>
              </form>

              <p className="text-center text-sm font-medium mt-6" style={{ color: '#4B6B62' }}>
                Remember your password?{' '}
                <Link href="/login" className="font-bold hover:underline" style={{ color: '#034338' }}>
                  Log in
                </Link>
              </p>
            </>
          ) : (
            // Success state
            <>
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6" style={{ backgroundColor: '#E8F5EE' }}>
                <svg className="w-8 h-8" style={{ color: '#034338' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>

              <h1 className="text-2xl font-black mb-2" style={{ color: '#0A2A23' }}>Check your email</h1>
              <p className="text-sm font-medium mb-2" style={{ color: '#4B6B62' }}>
                We sent a password reset link to:
              </p>
              <p className="text-sm font-black mb-6" style={{ color: '#034338' }}>{email}</p>
              <p className="text-sm font-medium mb-8" style={{ color: '#4B6B62' }}>
                Click the link in the email to set a new password. Check your spam folder if you don't see it.
              </p>

              <Link
                href="/login"
                className="inline-flex items-center justify-center w-full py-3.5 rounded-xl font-bold text-sm text-white hover:opacity-90 transition-opacity"
                style={{ backgroundColor: '#034338' }}
              >
                Back to login
              </Link>

              <p className="text-center text-xs font-medium mt-4" style={{ color: '#4B6B62' }}>
                Didn't get it?{' '}
                <button
                  onClick={() => setSent(false)}
                  className="font-bold hover:underline"
                  style={{ color: '#034338' }}
                >
                  Try again
                </button>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
