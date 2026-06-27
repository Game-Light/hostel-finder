'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

interface UserProfile {
  full_name: string
  role: string
  is_suspended: boolean
}

const CACHE_KEY = 'hf_user_profile'

export default function Navbar() {
  const router = useRouter()
  const [profile, setProfile]   = useState<UserProfile | null>(null)
  const [loading, setLoading]   = useState(true)
  const [menuOpen, setMenuOpen] = useState(false)

  const checkSuspension = async (userId: string): Promise<UserProfile | null> => {
    const { data } = await supabase
      .from('users')
      .select('full_name, role, is_suspended')
      .eq('id', userId)
      .single()
    return data || null
  }

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession()

      if (session?.user) {
        // Always fetch fresh — never cache, so suspension is instant
        const data = await checkSuspension(session.user.id)
        if (data?.is_suspended) {
          await supabase.auth.signOut()
          router.push('/suspended')
          return
        }
        if (data) setProfile(data)
      }
      setLoading(false)
    }

    init()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT') {
        setProfile(null)
        setLoading(false)
        return
      }

      if (event === 'SIGNED_IN' && session?.user) {
        const data = await checkSuspension(session.user.id)
        if (data?.is_suspended) {
          await supabase.auth.signOut()
          router.push('/suspended')
          return
        }
        if (data) setProfile(data)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [router])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setProfile(null)
    setMenuOpen(false)
    router.push('/')
  }

  const firstName = profile?.full_name?.split(' ')[0] || ''

  return (
    <nav style={{ backgroundColor: '#034338' }} className="sticky top-0 z-50 border-b border-white/10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">

        <Link href="/" onClick={() => setMenuOpen(false)}>
          <Image src="/logo/Logo-horizontal.svg" alt="Hostel Finder" width={140} height={36} priority />
        </Link>

        <div className="flex items-center gap-3">
          {loading ? (
            <div className="w-24 h-8 rounded-full animate-pulse" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }} />
          ) : profile ? (
            <div className="relative">
              <button onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-full transition-all hover:bg-white/10 cursor-pointer">
                <div className="w-8 h-8 rounded-full flex items-center justify-center font-black text-sm shrink-0"
                  style={{ backgroundColor: '#37D76A', color: '#034338' }}>
                  {firstName.charAt(0).toUpperCase()}
                </div>
                <span className="text-white text-sm font-semibold hidden sm:block">Hi, {firstName}</span>
                <svg className="w-4 h-4 text-white/60 transition-transform"
                  style={{ transform: menuOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
                  fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {menuOpen && (
                <div className="absolute right-0 top-full mt-2 w-52 rounded-2xl shadow-xl overflow-hidden border"
                  style={{ backgroundColor: '#FFFFFF', borderColor: '#E8EDEB' }}>
                  <div className="px-4 py-3 border-b" style={{ borderColor: '#E8EDEB' }}>
                    <p className="text-sm font-bold" style={{ color: '#0A2A23' }}>{profile.full_name}</p>
                    <p className="text-xs font-medium capitalize mt-0.5" style={{ color: '#4B6B62' }}>
                      {profile.role === 'agent' ? 'Hostel Agent' : 'Student'}
                    </p>
                  </div>
                  <div className="py-1">
                    {profile.role === 'agent' ? (
                      <>
                        <Link href="/agent/dashboard" onClick={() => setMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium hover:bg-gray-50 transition-colors cursor-pointer"
                          style={{ color: '#0A2A23' }}>
                          <svg className="w-4 h-4" style={{ color: '#4B6B62' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                          </svg>
                          My Dashboard
                        </Link>
                        <Link href="/agent/listings/new" onClick={() => setMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium hover:bg-gray-50 transition-colors cursor-pointer"
                          style={{ color: '#0A2A23' }}>
                          <svg className="w-4 h-4" style={{ color: '#4B6B62' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                          Add New Listing
                        </Link>
                      </>
                    ) : (
                      <Link href="/listings" onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium hover:bg-gray-50 transition-colors cursor-pointer"
                        style={{ color: '#0A2A23' }}>
                        <svg className="w-4 h-4" style={{ color: '#4B6B62' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        Browse Hostels
                      </Link>
                    )}
                  </div>
                  <div className="border-t py-1" style={{ borderColor: '#E8EDEB' }}>
                    <button onClick={handleLogout}
                      className="flex items-center gap-3 w-full px-4 py-2.5 text-sm font-medium hover:bg-red-50 transition-colors cursor-pointer"
                      style={{ color: '#DC2626' }}>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Log out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link href="/login" style={{ color: '#FFFFFF' }}
                className="text-sm font-medium px-3 py-2 hover:text-[#37D76A] transition-colors">
                Log in
              </Link>
              <Link href="/register" style={{ backgroundColor: '#37D76A' }}
                className="text-[#034338] font-bold text-sm px-5 py-2.5 rounded-full hover:opacity-90 transition-opacity">
                List your hostel
              </Link>
            </>
          )}
        </div>
      </div>

      {menuOpen && (
        <div className="fixed inset-0 z-[-1]" onClick={() => setMenuOpen(false)} />
      )}
    </nav>
  )
}