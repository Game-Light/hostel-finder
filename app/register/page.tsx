'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

type Role = 'student' | 'agent'
type Step = 'role' | 'details'

export default function RegisterPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('role')
  const [role, setRole] = useState<Role>('student')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }

    if (role === 'agent' && !phone.trim()) {
      setError('Phone number is required for agents.')
      return
    }

    setLoading(true)

    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role,
          phone: phone || null,
        },
      },
    })

    setLoading(false)

    if (signUpError) {
      setError(signUpError.message)
      return
    }

    // After successful signUp, replace the router.push lines with:
    router.push('/register/check-email')
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
            Your perfect home away from home starts here.
          </h2>
          <p className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.6)' }}>
            Join hundreds of FUOYE students and agents already using Hostel Finder.
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

            {/* Step 1 — Choose role */}
            {step === 'role' && (
              <div>
                <h1 className="text-2xl font-black mb-1" style={{ color: '#0A2A23' }}>Create your account</h1>
                <p className="text-sm font-medium mb-8" style={{ color: '#4B6B62' }}>I am joining as a...</p>

                <div className="flex flex-col gap-4 mb-8">
                  {[
                    {
                      value: 'student' as Role,
                      title: 'Student',
                      desc: 'I want to find a hostel near FUOYE',
                      icon: '🎓',
                    },
                    {
                      value: 'agent' as Role,
                      title: 'Hostel Agent / Landlord',
                      desc: 'I want to list my hostel and reach students',
                      icon: '🏠',
                    },
                  ].map(option => (
                    <button
                      key={option.value}
                      onClick={() => setRole(option.value)}
                      className="flex items-center gap-4 p-5 rounded-2xl border-2 text-left transition-all"
                      style={{
                        borderColor: role === option.value ? '#034338' : '#E8EDEB',
                        backgroundColor: role === option.value ? '#F0FAF4' : '#FFFFFF',
                      }}
                    >
                      <span className="text-2xl">{option.icon}</span>
                      <div>
                        <p className="font-bold text-sm" style={{ color: '#0A2A23' }}>{option.title}</p>
                        <p className="text-xs font-medium mt-0.5" style={{ color: '#4B6B62' }}>{option.desc}</p>
                      </div>
                      <div
                        className="ml-auto w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0"
                        style={{ borderColor: role === option.value ? '#034338' : '#D1D5DB' }}
                      >
                        {role === option.value && (
                          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#034338' }} />
                        )}
                      </div>
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setStep('details')}
                  className="w-full py-3.5 rounded-xl font-bold text-sm text-white transition-opacity hover:opacity-90"
                  style={{ backgroundColor: '#034338' }}
                >
                  Continue as {role === 'student' ? 'Student' : 'Agent'} →
                </button>

                <p className="text-center text-sm font-medium mt-6" style={{ color: '#4B6B62' }}>
                  Already have an account?{' '}
                  <Link href="/login" className="font-bold hover:underline" style={{ color: '#034338' }}>
                    Log in
                  </Link>
                </p>
              </div>
            )}

            {/* Step 2 — Fill details */}
            {step === 'details' && (
              <div>
                <button
                  onClick={() => setStep('role')}
                  className="flex items-center gap-1.5 text-sm font-semibold mb-6 hover:underline"
                  style={{ color: '#4B6B62' }}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Back
                </button>

                <h1 className="text-2xl font-black mb-1" style={{ color: '#0A2A23' }}>
                  {role === 'student' ? 'Student' : 'Agent'} account
                </h1>
                <p className="text-sm font-medium mb-8" style={{ color: '#4B6B62' }}>
                  Fill in your details to get started
                </p>

                {error && (
                  <div className="mb-5 px-4 py-3 rounded-xl text-sm font-medium" style={{ backgroundColor: '#FEE2E2', color: '#991B1B' }}>
                    {error}
                  </div>
                )}

                <form onSubmit={handleRegister} className="flex flex-col gap-4">
                  {/* Full name */}
                  <div>
                    <label className="block text-xs font-bold mb-1.5" style={{ color: '#0A2A23' }}>
                      Full name
                    </label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={e => setFullName(e.target.value)}
                      placeholder="e.g. Enoch Light"
                      required
                      className="w-full px-4 py-3 rounded-xl text-sm outline-none border transition-colors"
                      style={{ borderColor: '#E8EDEB', backgroundColor: '#FFFFFF', color: '#0A2A23' }}
                      onFocus={e => e.target.style.borderColor = '#034338'}
                      onBlur={e => e.target.style.borderColor = '#E8EDEB'}
                    />
                  </div>

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

                  {/* Phone (agents only) */}
                  {role === 'agent' && (
                    <div>
                      <label className="block text-xs font-bold mb-1.5" style={{ color: '#0A2A23' }}>
                        Phone / WhatsApp number
                      </label>
                      <input
                        type="tel"
                        value={phone}
                        onChange={e => setPhone(e.target.value)}
                        placeholder="080XXXXXXXX"
                        required
                        className="w-full px-4 py-3 rounded-xl text-sm outline-none border transition-colors"
                        style={{ borderColor: '#E8EDEB', backgroundColor: '#FFFFFF', color: '#0A2A23' }}
                        onFocus={e => e.target.style.borderColor = '#034338'}
                        onBlur={e => e.target.style.borderColor = '#E8EDEB'}
                      />
                    </div>
                  )}

                  {/* Password */}
                  <div>
                    <label className="block text-xs font-bold mb-1.5" style={{ color: '#0A2A23' }}>
                      Password
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
                    {loading ? 'Creating account...' : 'Create account'}
                  </button>
                </form>

                <p className="text-center text-xs font-medium mt-5" style={{ color: '#4B6B62' }}>
                  By signing up you agree to our{' '}
                  <Link href="/privacy" className="underline" style={{ color: '#034338' }}>Privacy Policy</Link>
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
