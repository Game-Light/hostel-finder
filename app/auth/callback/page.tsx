'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'
import SchoolSelect from '@/components/SchoolSelect'

export default function AuthCallbackPage() {
  const router = useRouter()
  const [checking, setChecking] = useState(true)
  const [validSession, setValidSession] = useState(false)
  const [needsSchool, setNeedsSchool] = useState(false)
  const [school, setSchool] = useState('Federal University Oye-Ekiti (FUOYE)')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const finish = async (userId: string, email: string | undefined, metadata: Record<string, unknown>) => {
      // Was this Google click a signup (pending info stashed) or just a
      // regular login? Read it once, then clear it either way.
      const pendingRaw = localStorage.getItem('hf_pending_google_signup')
      localStorage.removeItem('hf_pending_google_signup')
      const pending = pendingRaw ? JSON.parse(pendingRaw) : null

      const { data: profile } = await supabase
        .from('users')
        .select('university, role')
        .eq('id', userId)
        .single()

      // Apply anything stashed before the redirect (role, referral info) —
      // safe to run even on a repeat login since it only ever sets real values.
      if (pending) {
        const updates: Record<string, unknown> = { role: pending.role }
        if (pending.referralCode) updates.referral_code = pending.referralCode
        if (pending.referredById) updates.referred_by = pending.referredById
        await supabase.from('users').update(updates).eq('id', userId)

        if (pending.referredById) {
          await supabase.rpc('increment_referral_points', { referrer_id: pending.referredById })
        }
      }

      // Google's avatar comes through as either avatar_url or picture
      // depending on how Supabase maps it — check both, save whichever exists.
      const avatarUrl = (metadata.avatar_url || metadata.picture) as string | undefined
      if (avatarUrl) {
        await supabase.from('users').update({ avatar_url: avatarUrl }).eq('id', userId)
      }

      // First time through (no school set yet) — ask for it before continuing.
      // Returning users already have this, so they skip straight past.
      if (!profile?.university) {
        setNeedsSchool(true)
        setValidSession(true)
        setChecking(false)
        return
      }

      const role = pending?.role || profile?.role
      router.push(role === 'agent' ? '/agent/dashboard' : '/listings')
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        finish(session.user.id, session.user.email, session.user.user_metadata || {})
      } else if (event !== 'SIGNED_IN') {
        setChecking(false)
      }
    })

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        finish(session.user.id, session.user.email, session.user.user_metadata || {})
      } else {
        setChecking(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [router])

  const handleFinishProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!school.trim()) {
      setError('Please select or enter your school.')
      return
    }

    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setError('Something went wrong. Please try signing in again.')
      setSaving(false)
      return
    }

        await supabase.from('users').update({ university: school.trim() }).eq('id', user.id)

        const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()

        // This form only ever shows for brand-new accounts (returning users skip
        // straight past it), so this is exactly the right moment to welcome them.
        fetch('/api/email/welcome', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email, name: user.user_metadata?.full_name, role: profile?.role }),
        }).catch(() => {})

        setSaving(false)
        router.push(profile?.role === 'agent' ? '/agent/dashboard' : '/listings')
  }

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F4F6F5' }}>
        <div className="w-8 h-8 rounded-full border-4 border-t-transparent animate-spin" style={{ borderColor: '#034338', borderTopColor: 'transparent' }} />
      </div>
    )
  }

  if (!validSession) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: '#F4F6F5' }}>
        <div className="w-full max-w-sm text-center">
          <h1 className="text-xl font-black mb-2" style={{ color: '#0A2A23' }}>Something went wrong</h1>
          <p className="text-sm font-medium mb-6" style={{ color: '#4B6B62' }}>
            We couldn't complete your Google sign-in. Please try again.
          </p>
          <Link href="/register" className="inline-flex items-center justify-center w-full py-3.5 rounded-xl font-bold text-sm text-white hover:opacity-90 transition-opacity"
            style={{ backgroundColor: '#034338' }}>
            Back to sign up
          </Link>
        </div>
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
          <h1 className="text-2xl font-black mb-2" style={{ color: '#0A2A23' }}>One last thing</h1>
          <p className="text-sm font-medium mb-8" style={{ color: '#4B6B62' }}>
            What school are you at?
          </p>

          {error && (
            <div className="mb-5 px-4 py-3 rounded-xl text-sm font-medium" style={{ backgroundColor: '#FEE2E2', color: '#991B1B' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleFinishProfile} className="flex flex-col gap-4">
            <div>
              <label className="block text-xs font-bold mb-1.5" style={{ color: '#0A2A23' }}>School</label>
              <SchoolSelect value={school} onChange={setSchool} required />
            </div>
            <button type="submit" disabled={saving}
              className="w-full py-3.5 rounded-xl font-bold text-sm text-white transition-opacity hover:opacity-90 mt-2 disabled:opacity-60 cursor-pointer"
              style={{ backgroundColor: '#034338' }}>
              {saving ? 'Finishing up...' : 'Continue'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}