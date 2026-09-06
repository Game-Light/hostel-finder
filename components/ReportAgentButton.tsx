'use client'

import { useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

const REPORT_REASONS = [
  'Listing details were inaccurate',
  'Agent was unresponsive',
  'Requested payment before a viewing',
  'Suspicious or scam behaviour',
  'Other',
]

interface Props {
  agentId: string
  agentName: string
  listingId: string
}

export default function ReportAgentButton({ agentId, agentName, listingId }: Props) {
  const [open, setOpen]         = useState(false)
  const [studentId, setStudentId] = useState<string | null>(null)
  const [checkingAuth, setCheckingAuth] = useState(true)

  const [reason, setReason]     = useState(REPORT_REASONS[0])
  const [details, setDetails]   = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError]       = useState('')
  const [success, setSuccess]   = useState('')

  const openModal = async () => {
    setOpen(true)
    setError('')
    setSuccess('')
    setCheckingAuth(true)
    const { data: { user } } = await supabase.auth.getUser()
    setStudentId(user?.id || null)
    setCheckingAuth(false)
  }

  const closeModal = () => {
    setOpen(false)
    setReason(REPORT_REASONS[0])
    setDetails('')
    setError('')
    setSuccess('')
  }

  const handleSubmit = async () => {
    if (!studentId) return
    setSubmitting(true)
    setError('')

    const { error: insertError } = await supabase.from('agent_reports').insert({
      agent_id: agentId,
      listing_id: listingId,
      reporter_id: studentId,
      reason,
      details: details.trim() || null,
    })

    setSubmitting(false)
    if (insertError) {
      console.error('Report submit error:', insertError)
      setError('Could not submit your report. Please try again.')
      return
    }
    setSuccess('Report received. Our team will review it.')
    setTimeout(closeModal, 1500)
  }

  return (
    <>
      <button
        onClick={openModal}
        className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
        style={{ backgroundColor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)' }}
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3v18m0-18h13l-2 5 2 5H3" />
        </svg>
        Report
      </button>

      {open && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center px-4"
          style={{ backgroundColor: 'rgba(3,67,56,0.85)' }}
          onClick={closeModal}>
          <div className="w-full max-w-sm bg-white rounded-2xl p-6 shadow-2xl" onClick={e => e.stopPropagation()}>

            {!checkingAuth && !studentId ? (
              <div className="text-center">
                <h2 className="text-lg font-black mb-2" style={{ color: '#0A2A23' }}>Log in to continue</h2>
                <p className="text-sm font-medium mb-5" style={{ color: '#4B6B62' }}>
                  Please log in as a student to report an agent.
                </p>
                <Link href="/login"
                  className="inline-flex items-center justify-center w-full py-3 rounded-xl font-bold text-sm text-white hover:opacity-90 transition-opacity"
                  style={{ backgroundColor: '#034338' }}>
                  Go to login
                </Link>
                <button onClick={closeModal}
                  className="w-full mt-3 py-2 text-sm font-semibold cursor-pointer"
                  style={{ color: '#4B6B62' }}>
                  Cancel
                </button>
              </div>
            ) : (
              <>
                {error && (
                  <div className="mb-4 px-4 py-3 rounded-xl text-sm font-medium" style={{ backgroundColor: '#FEE2E2', color: '#991B1B' }}>
                    {error}
                  </div>
                )}
                {success && (
                  <div className="mb-4 px-4 py-3 rounded-xl text-sm font-medium" style={{ backgroundColor: '#DCFCE7', color: '#166534' }}>
                    {success}
                  </div>
                )}

                {!success && (
                  <>
                    <h2 className="text-lg font-black mb-1" style={{ color: '#0A2A23' }}>Report {agentName}</h2>
                    <p className="text-sm font-medium mb-5" style={{ color: '#4B6B62' }}>
                      Let us know what happened. Our admin team will review this.
                    </p>
                    <label className="block text-xs font-bold mb-1.5" style={{ color: '#0A2A23' }}>Reason</label>
                    <select
                      value={reason}
                      onChange={e => setReason(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl text-sm outline-none border mb-4 cursor-pointer"
                      style={{ borderColor: '#E8EDEB', color: '#0A2A23' }}
                    >
                      {REPORT_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                    <label className="block text-xs font-bold mb-1.5" style={{ color: '#0A2A23' }}>
                      Details <span className="font-normal" style={{ color: '#4B6B62' }}>(optional)</span>
                    </label>
                    <textarea
                      value={details}
                      onChange={e => setDetails(e.target.value)}
                      placeholder="Add any details that would help us look into this"
                      rows={3}
                      className="w-full px-4 py-3 rounded-xl text-sm outline-none border resize-none mb-4"
                      style={{ borderColor: '#E8EDEB', color: '#0A2A23' }}
                    />
                    <button
                      onClick={handleSubmit}
                      disabled={submitting}
                      className="w-full py-3.5 rounded-xl font-bold text-sm text-white hover:opacity-90 transition-opacity disabled:opacity-60 cursor-pointer"
                      style={{ backgroundColor: '#DC2626' }}>
                      {submitting ? 'Submitting...' : 'Submit report'}
                    </button>
                    <button onClick={closeModal}
                      className="w-full mt-3 py-2 text-sm font-semibold cursor-pointer"
                      style={{ color: '#4B6B62' }}>
                      Cancel
                    </button>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
