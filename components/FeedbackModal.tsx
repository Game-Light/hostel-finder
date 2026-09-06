'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

interface Props {
  onClose: () => void
}

// General "feedback about Hostel Finder" modal — opened from the Navbar,
// available to any logged-in user (student or agent). Not scoped to any
// specific agent or listing.
export default function FeedbackModal({ onClose }: Props) {
  const [message, setMessage]     = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError]         = useState('')
  const [success, setSuccess]     = useState(false)

  const handleSubmit = async () => {
    if (!message.trim()) {
      setError('Please write your feedback before submitting.')
      return
    }
    setSubmitting(true)
    setError('')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setError('You need to be logged in to send feedback.')
      setSubmitting(false)
      return
    }

    const { error: insertError } = await supabase.from('platform_feedback').insert({
      user_id: user.id,
      message: message.trim(),
    })

    setSubmitting(false)
    if (insertError) {
      console.error('Feedback submit error:', insertError)
      setError('Could not send your feedback. Please try again.')
      return
    }
    setSuccess(true)
    setTimeout(onClose, 1500)
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center px-4"
      style={{ backgroundColor: 'rgba(3,67,56,0.85)' }}
      onClick={onClose}>
      <div className="w-full max-w-sm bg-white rounded-2xl p-6 shadow-2xl" onClick={e => e.stopPropagation()}>

        {error && (
          <div className="mb-4 px-4 py-3 rounded-xl text-sm font-medium" style={{ backgroundColor: '#FEE2E2', color: '#991B1B' }}>
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 px-4 py-3 rounded-xl text-sm font-medium" style={{ backgroundColor: '#DCFCE7', color: '#166534' }}>
            Feedback sent. Thanks for helping us improve!
          </div>
        )}

        {!success && (
          <>
            <h2 className="text-lg font-black mb-1" style={{ color: '#0A2A23' }}>Send feedback</h2>
            <p className="text-sm font-medium mb-5" style={{ color: '#4B6B62' }}>
              Tell us what's working, what's not, or what you'd like to see on Hostel Finder.
            </p>
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="Type your feedback here..."
              rows={4}
              autoFocus
              className="w-full px-4 py-3 rounded-xl text-sm outline-none border resize-none mb-4"
              style={{ borderColor: '#E8EDEB', color: '#0A2A23' }}
            />
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full py-3.5 rounded-xl font-bold text-sm text-white hover:opacity-90 transition-opacity disabled:opacity-60 cursor-pointer"
              style={{ backgroundColor: '#034338' }}>
              {submitting ? 'Sending...' : 'Send feedback'}
            </button>
            <button onClick={onClose}
              className="w-full mt-3 py-2 text-sm font-semibold cursor-pointer"
              style={{ color: '#4B6B62' }}>
              Cancel
            </button>
          </>
        )}
      </div>
    </div>
  )
}
