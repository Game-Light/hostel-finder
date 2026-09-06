'use client'

import { useState } from 'react'

interface Props {
  title: string
  description: string
  confirmLabel: string
  confirmColor?: string
  requireReason?: boolean
  onCancel: () => void
  onConfirm: (reason: string) => void
  submitting?: boolean
}

// Generic confirm-with-reason modal. The parent decides what actually
// happens on confirm — this component just collects the reason text.
export default function AdminActionModal({
  title,
  description,
  confirmLabel,
  confirmColor = '#034338',
  requireReason = true,
  onCancel,
  onConfirm,
  submitting = false,
}: Props) {
  const [reason, setReason] = useState('')
  const [error, setError]   = useState('')

  const handleConfirm = () => {
    if (requireReason && !reason.trim()) {
      setError('Please provide a reason before continuing.')
      return
    }
    onConfirm(reason.trim())
  }

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center px-4"
      style={{ backgroundColor: 'rgba(3,67,56,0.85)' }}
      onClick={onCancel}>
      <div className="w-full max-w-sm bg-white rounded-2xl p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
        <h2 className="text-lg font-black mb-1" style={{ color: '#0A2A23' }}>{title}</h2>
        <p className="text-sm font-medium mb-4" style={{ color: '#4B6B62' }}>{description}</p>

        {error && (
          <div className="mb-3 px-4 py-3 rounded-xl text-sm font-medium" style={{ backgroundColor: '#FEE2E2', color: '#991B1B' }}>
            {error}
          </div>
        )}

        {requireReason && (
          <>
            <label className="block text-xs font-bold mb-1.5" style={{ color: '#0A2A23' }}>Reason</label>
            <textarea
              value={reason}
              onChange={e => setReason(e.target.value)}
              rows={3}
              autoFocus
              placeholder="Explain why — the agent will see this exact text"
              className="w-full px-4 py-3 rounded-xl text-sm outline-none border resize-none mb-4"
              style={{ borderColor: '#E8EDEB', color: '#0A2A23' }}
            />
          </>
        )}

        <button
          onClick={handleConfirm}
          disabled={submitting}
          className="w-full py-3.5 rounded-xl font-bold text-sm text-white hover:opacity-90 transition-opacity disabled:opacity-60 cursor-pointer"
          style={{ backgroundColor: confirmColor }}>
          {submitting ? 'Submitting...' : confirmLabel}
        </button>
        <button onClick={onCancel}
          className="w-full mt-3 py-2 text-sm font-semibold cursor-pointer"
          style={{ color: '#4B6B62' }}>
          Cancel
        </button>
      </div>
    </div>
  )
}