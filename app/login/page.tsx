'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
  e.preventDefault()
  setError('')
  setLoading(true)

  const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password })

  if (signInError) {
    setError('Incorrect email or password. Please try again.')
    setLoading(false)
    return
  }

  // Fetch role and suspension status in one query
  const { data: profile } = await supabase
    .from('users')
    .select('role, is_suspended')
    .eq('id', data.user.id)
    .single()

  if (profile?.is_suspended) {
    await supabase.auth.signOut()
    setError('Your account has been suspended. Contact us on WhatsApp.')
    setLoading(false)
    return
  }

  setLoading(false)

  if (profile?.role === 'agent') {
    router.push('/agent/dashboard')
  } else {
    router.push('/listings')
  }
}

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: '#F4F6F5' }}>

      {/* Left panel — branding (desktop only) */}
      <div
        className="hidden lg:flex flex-col justify-between w-[420px] shrink-0 p-10"
        style={{ backgroundColor: '#034338' }}
      >
        <Link href="/">
          <Image src="/logo/Logo-horizontal.svg" alt="Hostel Finder" width={140} height={36} />
        </Link>
        <div>
          <h2 className="text-3xl font-black text-white leading-tight mb-4">
            Welcome back.
          </h2>
          <p className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.6)' }}>
            Log in to manage your listings or continue your hostel search near FUOYE.
          </p>
        </div>
        <div className="flex flex-col gap-3">
          {[
            { icon: '🔍', text: 'Browse verified hostels near FUOYE' },
            { icon: '💬', text: 'Contact agents directly via WhatsApp' },
            { icon: '🆓', text: 'Completely free for students' },
          ].map(item => (
            <div key={item.text} className="flex items-center gap-3">
              <span className="text-lg">{item.icon}</span>
              <p className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.75)' }}>{item.text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex flex-col">
        {/* Mobile header */}
        <div className="lg:hidden flex items-center justify-between px-4 py-4 border-b" style={{ borderColor: '#E8EDEB', backgroundColor: '#034338' }}>
          <Link href="/">
            <Image src="/logo/Logo-horizontal.svg" alt="Hostel Finder" width={120} height={30} />
          </Link>
        </div>

        <div className="flex-1 flex items-center justify-center px-4 py-10">
          <div className="w-full max-w-md">
            <h1 className="text-2xl font-black mb-1" style={{ color: '#0A2A23' }}>Log in to your account</h1>
            <p className="text-sm font-medium mb-8" style={{ color: '#4B6B62' }}>
              Don't have an account?{' '}
              <Link href="/register" className="font-bold hover:underline" style={{ color: '#034338' }}>
                Sign up free
              </Link>
            </p>

            {error && (
              <div className="mb-5 px-4 py-3 rounded-xl text-sm font-medium" style={{ backgroundColor: '#FEE2E2', color: '#991B1B' }}>
                {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="flex flex-col gap-4">
              {/* Email */}
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

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold" style={{ color: '#0A2A23' }}>Password</label>
                  <Link href="/forgot-password" className="text-xs font-semibold hover:underline" style={{ color: '#034338' }}>
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Your password"
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
                    {showPassword ? (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl font-bold text-sm text-white transition-opacity hover:opacity-90 mt-2 disabled:opacity-60"
                style={{ backgroundColor: '#034338' }}
              >
                {loading ? 'Logging in...' : 'Log in'}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t text-center" style={{ borderColor: '#E8EDEB' }}>
              <p className="text-sm font-medium" style={{ color: '#4B6B62' }}>
                Want to list your hostel?{' '}
                <Link href="/register" className="font-bold hover:underline" style={{ color: '#034338' }}>
                  Create an agent account
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
