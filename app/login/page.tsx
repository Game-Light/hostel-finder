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

  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
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

            <p className="text-sm font-medium text-center mt-6 mb-3" style={{ color: '#4B6B62' }}>
                Or continue with
            </p>

            <button
              type="button"
              onClick={handleGoogleLogin}
              className="w-full flex items-center justify-center gap-3 py-3.5 rounded-xl font-bold text-sm border transition-colors hover:bg-gray-50 cursor-pointer mb-5"
              style={{ borderColor: '#E8EDEB', color: '#0A2A23' }}
              >
              <svg className="w-4.5 h-4.5" viewBox="0 0 48 48">
                <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/>
                <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"/>
                <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0124 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"/>
                <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 01-4.087 5.571l6.19 5.238C39.802 36.556 44 30.865 44 24c0-1.341-.138-2.65-.389-3.917z"/>
              </svg>
              Continue with Google
            </button>

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
