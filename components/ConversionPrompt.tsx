'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

interface PendingConversion {
  listingId: string
  listingName: string
  agentName: string
  clickedAt: number
}

const STORAGE_KEY = 'hf_pending_conversion'
const PROMPT_DELAY = 3000 // show after 3 seconds

export default function ConversionPrompt() {
  const [pending, setPending]   = useState<PendingConversion | null>(null)
  const [visible, setVisible]   = useState(false)
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    // Check for pending conversion after a short delay
    const timer = setTimeout(async () => {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) return

      const data: PendingConversion = JSON.parse(raw)

      // Only show if clicked more than 1 minute ago (they've had time to chat)
      const minuteAgo = Date.now() - 60 * 1000
      if (data.clickedAt > minuteAgo) return

      // Only show to logged-in users
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Don't show to agents
      const { data: profile } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single()
      if (profile?.role === 'agent') return

      setPending(data)
      setVisible(true)
    }, PROMPT_DELAY)

    return () => clearTimeout(timer)
  }, [])

  const handleResponse = async (confirmed: boolean) => {
    if (!pending) return
    setSubmitted(true)

    const { data: { user } } = await supabase.auth.getUser()

    await supabase.from('conversions').insert({
      listing_id: pending.listingId,
      student_id: user?.id || null,
      confirmed,
    })

    localStorage.removeItem(STORAGE_KEY)

    // Hide after short delay
    setTimeout(() => setVisible(false), 1500)
  }

  const handleDismiss = () => {
    localStorage.removeItem(STORAGE_KEY)
    setVisible(false)
  }

  if (!visible || !pending) return null

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[300] w-full max-w-sm px-4">
      <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border" style={{ borderColor: '#E8EDEB' }}>
        {submitted ? (
          <div className="p-5 text-center">
            <div className="text-2xl mb-2">🎉</div>
            <p className="text-sm font-bold" style={{ color: '#0A2A23' }}>Thanks for letting us know!</p>
          </div>
        ) : (
          <div className="p-5">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ backgroundColor: '#E8F5EE' }}>
                <svg className="w-5 h-5" style={{ color: '#034338' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </div>
              <button onClick={handleDismiss} className="text-gray-400 hover:text-gray-600 cursor-pointer mt-0.5">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <p className="text-sm font-black mb-1" style={{ color: '#0A2A23' }}>
              Did you secure a hostel?
            </p>
            <p className="text-xs font-medium mb-4" style={{ color: '#4B6B62' }}>
              You contacted an agent for <span className="font-bold">{pending.listingName}</span>. Did you end up getting it?
            </p>

            <div className="flex gap-2">
              <button
                onClick={() => handleResponse(true)}
                className="flex-1 py-2.5 rounded-xl font-bold text-sm text-white hover:opacity-90 transition-opacity cursor-pointer"
                style={{ backgroundColor: '#034338' }}>
                Yes, I got it! 🎉
              </button>
              <button
                onClick={() => handleResponse(false)}
                className="flex-1 py-2.5 rounded-xl font-bold text-sm border hover:bg-gray-50 transition-colors cursor-pointer"
                style={{ color: '#4B6B62', borderColor: '#E8EDEB' }}>
                Not yet
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}