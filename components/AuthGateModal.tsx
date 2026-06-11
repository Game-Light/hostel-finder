'use client'

import Link from 'next/link'
import Image from 'next/image'

interface AuthGateModalProps {
  onClose: () => void
}

export default function AuthGateModal({ onClose }: AuthGateModalProps) {
  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center px-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm bg-white rounded-3xl overflow-hidden shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 pt-8 pb-6 text-center" style={{ backgroundColor: '#034338' }}>
          <Image
            src="/logo/Logo-horizontal.svg"
            alt="Hostel Finder"
            width={120}
            height={32}
            className="mx-auto mb-5"
          />
          <h2 className="text-xl font-black text-white mb-2">
            Create a free account
          </h2>
          <p className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.7)' }}>
            Sign up to view hostel details, see agent contacts, and find your perfect home near FUOYE.
          </p>
        </div>

        {/* Actions */}
        <div className="p-6 flex flex-col gap-3">
          <Link
            href="/register"
            className="flex items-center justify-center w-full py-3.5 rounded-xl font-bold text-sm text-white transition-opacity hover:opacity-90 cursor-pointer"
            style={{ backgroundColor: '#034338' }}
          >
            Create free account
          </Link>

          <Link
            href="/login"
            className="flex items-center justify-center w-full py-3.5 rounded-xl font-bold text-sm border transition-colors hover:bg-gray-50 cursor-pointer"
            style={{ color: '#034338', borderColor: '#E8EDEB' }}
          >
            Log in to existing account
          </Link>

          <button
            onClick={onClose}
            className="text-xs font-medium text-center mt-1 cursor-pointer"
            style={{ color: '#4B6B62' }}
          >
            Continue browsing
          </button>
        </div>

        {/* Benefits */}
        <div className="px-6 pb-6">
          <div className="rounded-2xl p-4" style={{ backgroundColor: '#F4F6F5' }}>
            {[
              { icon: '🆓', text: 'Always free for students' },
              { icon: '📸', text: 'View real hostel photos and videos' },
              { icon: '💬', text: 'Contact agents directly on WhatsApp' },
            ].map(item => (
              <div key={item.text} className="flex items-center gap-3 py-1.5">
                <span className="text-base">{item.icon}</span>
                <p className="text-xs font-medium" style={{ color: '#3D6058' }}>{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
