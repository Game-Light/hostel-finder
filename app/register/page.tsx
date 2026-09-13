'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'
import SchoolSelect from '@/components/SchoolSelect'

type Role = 'student' | 'agent'
type Step = 'role' | 'details' | 'verify'

const AGENT_INVITE_CODE = process.env.NEXT_PUBLIC_AGENT_INVITE_CODE

function generateReferralCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let code = ''
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

function generateTempPassword(): string {
  return crypto.randomUUID() + crypto.randomUUID()
}

// Shared by both the email/password path and the Google path — validates
// an agent's invite/referral code without creating any account yet.
async function validateAgentInvite(code: string): Promise<{ ok: boolean; referredById: string | null; error?: string }> {
  if (!AGENT_INVITE_CODE) {
    console.error('NEXT_PUBLIC_AGENT_INVITE_CODE is not set in the environment.')
    return { ok: false, referredById: null, error: 'Agent signup is temporarily unavailable. Please try again later.' }
  }

  if (!code.trim()) {
    return { ok: false, referredById: null, error: 'An invite code or referral code is required.' }
  }

  const isGlobalCode = code.trim().toUpperCase() === AGENT_INVITE_CODE.toUpperCase()
  if (isGlobalCode) return { ok: true, referredById: null }

  const { data: referrer } = await supabase
    .from('users')
    .select('id')
    .eq('referral_code', code.trim().toUpperCase())
    .eq('role', 'agent')
    .single()

  if (!referrer) {
    return { ok: false, referredById: null, error: 'Invalid invite or referral code. Check the code and try again.' }
  }

  return { ok: true, referredById: referrer.id }
}

export default function RegisterPage() {
  const [step, setStep]             = useState<Step>('role')
  const [role, setRole]             = useState<Role>('student')
  const [fullName, setFullName]     = useState('')
  const [email, setEmail]           = useState('')
  const [school, setSchool]         = useState('Federal University Oye-Ekiti (FUOYE)')
  const [inviteCode, setInviteCode] = useState('')
  const [nameConfirmed, setNameConfirmed] = useState(false)
  const [loading, setLoading]       = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError]           = useState('')
  const [resending, setResending]   = useState(false)
  const [resendMsg, setResendMsg]   = useState('')

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!school.trim()) {
      setError('Please select or enter your school.')
      return
    }

    if (!nameConfirmed) {
      setError('Please confirm the name you entered is your real name.')
      return
    }

    setLoading(true)

    let referredById: string | null = null
    let referralCode: string | null = null

    if (role === 'agent') {
      const check = await validateAgentInvite(inviteCode)
      if (!check.ok) {
        setError(check.error || 'Invalid invite code.')
        setLoading(false)
        return
      }
      referredById = check.referredById
      referralCode = generateReferralCode()
    }

    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email,
      password: generateTempPassword(),
      options: {
        data: {
          full_name: fullName,
          role,
          university: school.trim(),
          referral_code: referralCode,
          referred_by: referredById,
        },
        emailRedirectTo: `${window.location.origin}/complete-signup`,
      },
    })

    if (signUpError) {
      setError(signUpError.message)
      setLoading(false)
      return
    }

    if (!authData.user?.id) {
      setError('Something went wrong. Please try again.')
      setLoading(false)
      return
    }

    setLoading(false)
    setStep('verify')
  }

  const handleResend = async () => {
    setResending(true)
    setResendMsg('')
    const { error: resendError } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: { emailRedirectTo: `${window.location.origin}/complete-signup` },
    })
    setResending(false)
    setResendMsg(resendError ? 'Could not resend. Try again in a moment.' : 'Email resent — check your inbox.')
  }

  // Google path — for agents, the invite code is checked BEFORE we ever
  // redirect to Google, so an invalid code never even starts the OAuth flow.
  // Anything we need after the redirect (role, referral info) can't be
  // passed through Google's OAuth params, so it's stashed in localStorage
  // and picked up on /auth/callback once a session actually exists.
  const handleGoogleSignIn = async () => {
    setError('')

    let referredById: string | null = null
    let referralCode: string | null = null

    if (role === 'agent') {
      setGoogleLoading(true)
      const check = await validateAgentInvite(inviteCode)
      if (!check.ok) {
        setError(check.error || 'Invalid invite code.')
        setGoogleLoading(false)
        return
      }
      referredById = check.referredById
      referralCode = generateReferralCode()
    }

    localStorage.setItem('hf_pending_google_signup', JSON.stringify({
      role,
      referralCode,
      referredById,
    }))

    setGoogleLoading(true)
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })

    if (oauthError) {
      setError(oauthError.message)
      setGoogleLoading(false)
      localStorage.removeItem('hf_pending_google_signup')
    }
    // No further code runs on success — the browser navigates away to Google.
  }

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: '#F4F6F5' }}>

      {/* Left panel */}
      <div className="hidden lg:flex flex-col justify-between w-[420px] shrink-0 p-10" style={{ backgroundColor: '#034338' }}>
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

      {/* Right panel */}
      <div className="flex-1 flex flex-col">
        <div className="lg:hidden flex items-center px-4 py-4 border-b" style={{ borderColor: '#E8EDEB', backgroundColor: '#034338' }}>
          <Link href="/">
            <Image src="/logo/Logo-horizontal.svg" alt="Hostel Finder" width={120} height={30} />
          </Link>
        </div>

        <div className="flex-1 flex items-center justify-center px-4 py-10">
          <div className="w-full max-w-md">

            {/* Step 1 — Role selection */}
            {step === 'role' && (
              <div>
                <h1 className="text-2xl font-black mb-1" style={{ color: '#0A2A23' }}>Create your account</h1>
                <p className="text-sm font-medium mb-8" style={{ color: '#4B6B62' }}>How will you be using Hostel Finder?</p>

                <div className="flex flex-col gap-3 mb-6">
                  {[
                    { value: 'student' as Role, icon: '🎓', title: 'I\'m a student', desc: 'Looking for a hostel near school' },
                    { value: 'agent' as Role,   icon: '🏠', title: 'I\'m an agent',   desc: 'I manage or own hostel properties' },
                  ].map(option => (
                    <button
                      key={option.value}
                      onClick={() => setRole(option.value)}
                      className="flex items-center gap-4 p-5 rounded-2xl border-2 text-left transition-all cursor-pointer"
                      style={{
                        borderColor: role === option.value ? '#034338' : '#E8EDEB',
                        backgroundColor: role === option.value ? '#F0FAF4' : '#FFFFFF',
                      }}
                    >
                      <span className="text-2xl">{option.icon}</span>
                      <div className="flex-1">
                        <p className="font-bold text-sm" style={{ color: '#0A2A23' }}>{option.title}</p>
                        <p className="text-xs font-medium mt-0.5" style={{ color: '#4B6B62' }}>{option.desc}</p>
                      </div>
                      <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0"
                        style={{ borderColor: role === option.value ? '#034338' : '#D1D5DB' }}>
                        {role === option.value && (
                          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#034338' }} />
                        )}
                      </div>
                    </button>
                  ))}
                </div>

                {role === 'agent' && (
                  <div className="flex items-start gap-3 px-4 py-3 rounded-xl mb-6" style={{ backgroundColor: '#E8F5EE' }}>
                    <span className="text-base mt-0.5">ℹ️</span>
                    <p className="text-xs font-medium leading-relaxed" style={{ color: '#3D6058' }}>
                      Agent accounts require an invite code or a referral code from an existing agent.{' '}
                      <a href="https://wa.me/2349122781346?text=Hi, I want to list my hostel on Hostel Finder. Can I get the agent code?"
                        target="_blank" rel="noopener noreferrer"
                        className="font-bold hover:underline" style={{ color: '#034338' }}>
                        Contact us on WhatsApp
                      </a>{' '}
                      to get yours.
                    </p>
                  </div>
                )}

                <button
                  onClick={() => setStep('details')}
                  className="w-full py-3.5 rounded-xl font-bold text-sm text-white transition-opacity hover:opacity-90 cursor-pointer"
                  style={{ backgroundColor: '#034338' }}
                >
                  Continue as {role === 'student' ? 'Student' : 'Agent'} →
                </button>

                <p className="text-center text-sm font-medium mt-6" style={{ color: '#4B6B62' }}>
                  Already have an account?{' '}
                  <Link href="/login" className="font-bold hover:underline" style={{ color: '#034338' }}>Log in</Link>
                </p>
              </div>
            )}

            {/* Step 2 — Details */}
            {step === 'details' && (
              <div>
                <button onClick={() => setStep('role')}
                  className="flex items-center gap-1.5 text-sm font-semibold mb-6 hover:underline cursor-pointer"
                  style={{ color: '#4B6B62' }}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Back
                </button>

                <h1 className="text-2xl font-black mb-1" style={{ color: '#0A2A23' }}>
                  {role === 'student' ? 'Student' : 'Agent'} account
                </h1>
                <p className="text-sm font-medium mb-6" style={{ color: '#4B6B62' }}>Fill in your details to get started</p>

                {error && (
                  <div className="mb-5 px-4 py-3 rounded-xl text-sm font-medium" style={{ backgroundColor: '#FEE2E2', color: '#991B1B' }}>
                    {error}
                  </div>
                )}

                {/* Agent invite code — must be entered before Google sign-in works too,
                    since Google can't carry this value through the OAuth redirect. */}
                {role === 'agent' && (
                  <div className="mb-4">
                    <label className="block text-xs font-bold mb-1.5" style={{ color: '#0A2A23' }}>
                      Invite code or referral code <span style={{ color: '#DC2626' }}>*</span>
                    </label>
                    <input type="text" value={inviteCode} onChange={e => setInviteCode(e.target.value)}
                      placeholder="Enter invite or referral code"
                      className="w-full px-4 py-3 rounded-xl text-sm outline-none border transition-colors"
                      style={{ borderColor: '#E8EDEB', backgroundColor: '#FFFFFF', color: '#0A2A23' }}
                      onFocus={e => e.target.style.borderColor = '#034338'}
                      onBlur={e => e.target.style.borderColor = '#E8EDEB'} />
                    <p className="text-xs font-medium mt-1" style={{ color: '#4B6B62' }}>
                      Needed whether you sign up with email or Google.{' '}
                      <a href="https://wa.me/2349122781346?text=Hi, I want to list my hostel on Hostel Finder. Can I get the agent code?"
                        target="_blank" rel="noopener noreferrer"
                        className="font-bold hover:underline" style={{ color: '#034338' }}>
                        Get a code on WhatsApp
                      </a>
                    </p>
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={googleLoading}
                  className="w-full flex items-center justify-center gap-3 py-3.5 rounded-xl font-bold text-sm border transition-colors hover:bg-gray-50 disabled:opacity-60 cursor-pointer mb-5"
                  style={{ borderColor: '#E8EDEB', color: '#0A2A23' }}
                >
                  <svg className="w-4.5 h-4.5" viewBox="0 0 48 48">
                    <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/>
                    <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"/>
                    <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0124 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"/>
                    <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 01-4.087 5.571l6.19 5.238C39.802 36.556 44 30.865 44 24c0-1.341-.138-2.65-.389-3.917z"/>
                  </svg>
                  {googleLoading ? 'Connecting to Google...' : `Continue with Google as ${role === 'student' ? 'Student' : 'Agent'}`}
                </button>

                <div className="flex items-center gap-3 mb-5">
                  <div className="flex-1 h-px" style={{ backgroundColor: '#E8EDEB' }} />
                  <span className="text-xs font-bold" style={{ color: '#9CA3AF' }}>OR SIGN UP WITH EMAIL</span>
                  <div className="flex-1 h-px" style={{ backgroundColor: '#E8EDEB' }} />
                </div>

                <form onSubmit={handleRegister} className="flex flex-col gap-4">
                  <div>
                    <label className="block text-xs font-bold mb-1.5" style={{ color: '#0A2A23' }}>Full name</label>
                    <input type="text" value={fullName} onChange={e => setFullName(e.target.value)}
                      placeholder="e.g. Enoch Light" required
                      className="w-full px-4 py-3 rounded-xl text-sm outline-none border transition-colors"
                      style={{ borderColor: '#E8EDEB', backgroundColor: '#FFFFFF', color: '#0A2A23' }}
                      onFocus={e => e.target.style.borderColor = '#034338'}
                      onBlur={e => e.target.style.borderColor = '#E8EDEB'} />
                  </div>

                  <div>
                    <label className="block text-xs font-bold mb-1.5" style={{ color: '#0A2A23' }}>Email address</label>
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                      placeholder="you@example.com" required
                      className="w-full px-4 py-3 rounded-xl text-sm outline-none border transition-colors"
                      style={{ borderColor: '#E8EDEB', backgroundColor: '#FFFFFF', color: '#0A2A23' }}
                      onFocus={e => e.target.style.borderColor = '#034338'}
                      onBlur={e => e.target.style.borderColor = '#E8EDEB'} />
                  </div>

                  <div>
                    <label className="block text-xs font-bold mb-1.5" style={{ color: '#0A2A23' }}>School</label>
                    <SchoolSelect value={school} onChange={setSchool} required />
                  </div>

                  <label className="flex items-start gap-3 cursor-pointer mt-1">
                    <input
                      type="checkbox"
                      checked={nameConfirmed}
                      onChange={e => setNameConfirmed(e.target.checked)}
                      className="mt-0.5 w-4 h-4 shrink-0 cursor-pointer"
                    />
                    <span className="text-xs font-medium" style={{ color: '#4B6B62' }}>
                      I confirm the name above is my real name.
                    </span>
                  </label>

                  <button type="submit" disabled={loading}
                    className="w-full py-3.5 rounded-xl font-bold text-sm text-white transition-opacity hover:opacity-90 mt-2 disabled:opacity-60 cursor-pointer"
                    style={{ backgroundColor: '#034338' }}>
                    {loading ? 'Sending verification email...' : 'Continue'}
                  </button>
                </form>

                <p className="text-center text-xs font-medium mt-5" style={{ color: '#4B6B62' }}>
                  By signing up you agree to our{' '}
                  <Link href="/privacy" className="underline" style={{ color: '#034338' }}>Privacy Policy</Link>
                </p>
              </div>
            )}

            {/* Step 3 — Verify email (email/password path only; Google users skip this) */}
            {step === 'verify' && (
              <div className="text-center">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6" style={{ backgroundColor: '#E8F5EE' }}>
                  <svg className="w-8 h-8" style={{ color: '#034338' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <h1 className="text-2xl font-black mb-2" style={{ color: '#0A2A23' }}>Check your email</h1>
                <p className="text-sm font-medium mb-1" style={{ color: '#4B6B62' }}>
                  We sent a verification link to
                </p>
                <p className="text-sm font-bold mb-6" style={{ color: '#0A2A23' }}>{email}</p>
                <p className="text-xs font-medium mb-8 leading-relaxed" style={{ color: '#4B6B62' }}>
                  Click the link in that email to verify your address, then you'll be able to set your password and finish creating your account.
                </p>

                <div className="flex flex-col sm:flex-row gap-3 mb-6">
                  <a href="https://mail.google.com/mail/u/0/#inbox" target="_blank" rel="noopener noreferrer"
                    className="flex-1 py-3 rounded-xl font-bold text-sm text-white text-center hover:opacity-90 transition-opacity"
                    style={{ backgroundColor: '#034338' }}>
                    Open Gmail
                  </a>
                  <a href="https://outlook.live.com/mail/0/inbox" target="_blank" rel="noopener noreferrer"
                    className="flex-1 py-3 rounded-xl font-bold text-sm text-center border hover:bg-gray-50 transition-colors"
                    style={{ color: '#034338', borderColor: '#E8EDEB' }}>
                    Open Outlook
                  </a>
                </div>

                {resendMsg && (
                  <p className="text-xs font-medium mb-3" style={{ color: resendMsg.startsWith('Could not') ? '#DC2626' : '#166534' }}>
                    {resendMsg}
                  </p>
                )}

                <button onClick={handleResend} disabled={resending}
                  className="text-sm font-bold hover:underline cursor-pointer disabled:opacity-60"
                  style={{ color: '#034338' }}>
                  {resending ? 'Resending...' : "Didn't get it? Resend email"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}