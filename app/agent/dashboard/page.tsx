'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import { supabase } from '@/lib/supabase'

interface Listing {
  id: string; name: string; area: string; price: number
  room_type: string; rooms_available: number
  status: 'pending' | 'active' | 'inactive'
  views: number; created_at: string; slug: string
}

const roomTypeLabel: Record<string, string> = {
  self_contain: 'Self-contain', single: 'Single Room',
  shared: 'Shared Room',       mini_flat: 'Mini Flat',
}

const statusStyle: Record<string, { bg: string; text: string; label: string }> = {
  active:   { bg: '#DCFCE7', text: '#166534', label: 'Active' },
  pending:  { bg: '#FEF3C7', text: '#92400E', label: 'Pending review' },
  inactive: { bg: '#F3F4F6', text: '#6B7280', label: 'Inactive' },
}

export default function AgentDashboardPage() {
  const router = useRouter()
  const [listings, setListings]   = useState<Listing[]>([])
  const [loading, setLoading]     = useState(true)
  const [deletingId, setDeletingId]   = useState<string | null>(null)
  const [togglingId, setTogglingId]   = useState<string | null>(null)
  const [successMsg, setSuccessMsg]   = useState('')
  const [fetchError, setFetchError] = useState(false)
  const [showPhoneModal, setShowPhoneModal] = useState(false)
  const [phoneInput, setPhoneInput]         = useState('')
  const [savingPhone, setSavingPhone]       = useState(false)
  const [phoneError, setPhoneError]         = useState('')
  const [referralCode, setReferralCode]   = useState('')
  const [referralPoints, setReferralPoints] = useState(0)
  const [codeCopied, setCodeCopied]       = useState(false)

  // Check for redirect after create
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href)
      if (url.searchParams.get('created') === 'true') {
        setSuccessMsg('Listing submitted! It will go live after review.')
        window.history.replaceState({}, '', '/agent/dashboard')
        setTimeout(() => setSuccessMsg(''), 5000)
      }
    }
  }, [])

  const fetchListings = async () => {
  setFetchError(false)
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const { data: profile } = await supabase
      .from('users').select('role, phone, referral_code, referral_points').eq('id', user.id).single()
    if (profile?.role !== 'agent') { router.push('/listings'); return }
    if (!profile?.phone) { setShowPhoneModal(true) }
    if (profile?.referral_code) setReferralCode(profile.referral_code)
    if (profile?.referral_points) setReferralPoints(profile.referral_points)

    const { data, error } = await supabase
      .from('listings')
      .select('id, name, area, price, room_type, rooms_available, status, views, created_at, slug')
      .eq('agent_id', user.id)
      .order('created_at', { ascending: false })

    if (error) throw error
    setListings(data || [])
  } catch {
    setFetchError(true)
  }
  setLoading(false)
}

  useEffect(() => { fetchListings() }, [])

  // Refetch on tab focus (fixes back-navigation stale data)
  useEffect(() => {
    const onFocus = () => { setLoading(true); fetchListings() }
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [])

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this listing? This cannot be undone.')) return
    setDeletingId(id)
    await supabase.from('listings').delete().eq('id', id)
    setListings(prev => prev.filter(l => l.id !== id))
    setDeletingId(null)
  }

  const handleToggleStatus = async (listing: Listing) => {
    setTogglingId(listing.id)
    const newStatus = listing.status === 'active' ? 'inactive' : 'active'
    await supabase.from('listings').update({ status: newStatus }).eq('id', listing.id)
    setListings(prev => prev.map(l => l.id === listing.id ? { ...l, status: newStatus } : l))
    setTogglingId(null)
  }

  const handleSavePhone = async () => {
    setPhoneError('')
    const digits = phoneInput.trim().replace(/\D/g, '')
    if (!phoneInput.trim()) {
      setPhoneError('Please enter your WhatsApp number.')
      return
    }
    if (digits.length !== 11) {
      setPhoneError('Enter a valid 11-digit Nigerian phone number.')
      return
    }
    setSavingPhone(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { error } = await supabase
      .from('users')
      .update({ phone: phoneInput.trim() })
      .eq('id', user.id)
    setSavingPhone(false)
    if (error) {
      setPhoneError('Failed to save. Try again.')
      return
    }
    setShowPhoneModal(false)
  }

  const handleCopyCode = () => {
    navigator.clipboard.writeText(referralCode)
    setCodeCopied(true)
    setTimeout(() => setCodeCopied(false), 2000)
  }

  const activeCount  = listings.filter(l => l.status === 'active').length
  const pendingCount = listings.filter(l => l.status === 'pending').length
  const totalViews   = listings.reduce((sum, l) => sum + (l.views || 0), 0)

  if (loading) return (
    <div className="min-h-screen" style={{ backgroundColor: '#F4F6F5' }}>
      <Navbar />
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 rounded-full border-4 border-t-transparent animate-spin" style={{ borderColor: '#034338', borderTopColor: 'transparent' }} />
      </div>
    </div>
  )

  if (fetchError) return (
  <div className="min-h-screen" style={{ backgroundColor: '#F4F6F5' }}>
    <Navbar />
    <div className="flex items-center justify-center min-h-[60vh] px-4">
      <div className="text-center max-w-sm">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5" style={{ backgroundColor: '#FEE2E2' }}>
          <svg className="w-8 h-8" style={{ color: '#DC2626' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h1 className="text-xl font-black mb-2" style={{ color: '#0A2A23' }}>Couldn't load your listings</h1>
        <p className="text-sm font-medium mb-6" style={{ color: '#4B6B62' }}>
          Something went wrong. Check your connection and try again.
        </p>
        <button onClick={() => { setLoading(true); fetchListings() }}
          className="w-full py-3 rounded-xl font-bold text-sm text-white hover:opacity-90 transition-opacity"
          style={{ backgroundColor: '#034338' }}>
          Try again
        </button>
      </div>
    </div>
  </div>
)

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F4F6F5' }}>
      <Navbar />

      {/* Success toast */}
      {successMsg && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl shadow-lg text-sm font-bold text-white"
          style={{ backgroundColor: '#034338' }}>
          ✓ {successMsg}
        </div>
      )}

      {/* Header */}
      <div style={{ backgroundColor: '#034338' }} className="px-4 sm:px-6 py-10">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-white">My Dashboard</h1>
            <p className="text-sm font-medium mt-1" style={{ color: 'rgba(255,255,255,0.6)' }}>Manage your hostel listings</p>
          </div>
          <Link href="/agent/listings/new" style={{ backgroundColor: '#37D76A' }}
            className="inline-flex items-center gap-2 text-[#034338] font-bold text-sm px-5 py-3 rounded-full hover:opacity-90 transition-opacity self-start sm:self-auto cursor-pointer">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add new listing
          </Link>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Active listings', value: activeCount },
            { label: 'Pending review',  value: pendingCount },
            { label: 'Total views',     value: totalViews },
          ].map(stat => (
            <div key={stat.label} className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm text-center">
              <div className="text-2xl sm:text-3xl font-black" style={{ color: '#034338' }}>{stat.value}</div>
              <div className="text-xs sm:text-sm font-medium mt-1" style={{ color: '#4B6B62' }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Referral card */}
        {referralCode && (
          <div className="bg-white rounded-2xl p-5 shadow-sm mb-8 flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold mb-1" style={{ color: '#4B6B62' }}>YOUR REFERRAL CODE</p>
              <p className="text-sm font-medium mb-1" style={{ color: '#3D6058' }}>
                Share this code with other agents to earn referral points when they sign up.
              </p>
              <div className="flex items-center gap-3 mt-2">
                <span className="text-xl font-black tracking-widest" style={{ color: '#034338' }}>{referralCode}</span>
                <button
                  onClick={handleCopyCode}
                  className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg transition-all"
                  style={{
                    backgroundColor: codeCopied ? '#DCFCE7' : '#F4F6F5',
                    color: codeCopied ? '#166534' : '#034338',
                  }}>
                  {codeCopied ? (
                    <>
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Copied!
                    </>
                  ) : (
                    <>
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      Copy
                    </>
                  )}
                </button>
              </div>
            </div>
            <div className="shrink-0 text-center px-5 py-3 rounded-2xl" style={{ backgroundColor: '#F4F6F5' }}>
              <div className="text-3xl font-black" style={{ color: '#034338' }}>{referralPoints}</div>
              <div className="text-xs font-bold mt-0.5" style={{ color: '#4B6B62' }}>Referral points</div>
            </div>
          </div>
        )}

        {/* Listings */}
        {listings.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center shadow-sm">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5" style={{ backgroundColor: '#F4F6F5' }}>
              <svg className="w-8 h-8" style={{ color: '#4B6B62' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h2 className="text-lg font-black mb-2" style={{ color: '#0A2A23' }}>No listings yet</h2>
            <p className="text-sm font-medium mb-6 max-w-xs mx-auto" style={{ color: '#4B6B62' }}>
              Add your first hostel listing and start reaching students near FUOYE.
            </p>
            <Link href="/agent/listings/new" style={{ backgroundColor: '#034338' }}
              className="inline-flex items-center gap-2 text-white font-bold text-sm px-6 py-3 rounded-full hover:opacity-90 transition-opacity cursor-pointer">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add your first listing
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {listings.map(listing => (
              <div key={listing.id} className="bg-white rounded-2xl p-5 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h3 className="font-black text-base" style={{ color: '#0A2A23' }}>{listing.name}</h3>
                      <span className="text-xs font-bold px-2.5 py-1 rounded-full"
                        style={{ backgroundColor: statusStyle[listing.status].bg, color: statusStyle[listing.status].text }}>
                        {statusStyle[listing.status].label}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-3 text-xs font-medium" style={{ color: '#4B6B62' }}>
                      <span>📍 {listing.area}</span>
                      <span>🏠 {roomTypeLabel[listing.room_type] || listing.room_type}</span>
                      <span>₦{listing.price.toLocaleString()}/yr</span>
                      <span>{listing.rooms_available} room{listing.rooms_available !== 1 ? 's' : ''} left</span>
                      <span>👁 {listing.views} views</span>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center gap-2 shrink-0 flex-wrap">
                    <Link href={`/listings/${listing.slug}`}
                      className="text-xs font-bold px-3 py-2 rounded-xl border transition-colors hover:bg-gray-50 cursor-pointer"
                      style={{ color: '#034338', borderColor: '#E8EDEB' }}>
                      Preview
                    </Link>

                    <Link href={`/agent/listings/${listing.id}/edit`}
                      className="text-xs font-bold px-3 py-2 rounded-xl border transition-colors hover:bg-gray-50 cursor-pointer"
                      style={{ color: '#034338', borderColor: '#E8EDEB' }}>
                      Edit
                    </Link>

                    {listing.status !== 'pending' && (
                      <button
                        onClick={() => handleToggleStatus(listing)}
                        disabled={togglingId === listing.id}
                        className="text-xs font-bold px-3 py-2 rounded-xl border transition-colors hover:bg-gray-50 cursor-pointer disabled:opacity-60 flex items-center gap-1.5 min-w-[90px] justify-center"
                        style={{ color: listing.status === 'active' ? '#92400E' : '#166534', borderColor: '#E8EDEB' }}>
                        {togglingId === listing.id ? (
                          <>
                            <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                            </svg>
                            Working...
                          </>
                        ) : listing.status === 'active' ? 'Deactivate' : 'Activate'}
                      </button>
                    )}

                    <button
                      onClick={() => handleDelete(listing.id)}
                      disabled={deletingId === listing.id}
                      className="text-xs font-bold px-3 py-2 rounded-xl border transition-colors hover:bg-red-50 cursor-pointer disabled:opacity-50 flex items-center gap-1.5 min-w-[70px] justify-center"
                      style={{ color: '#DC2626', borderColor: '#E8EDEB' }}>
                      {deletingId === listing.id ? (
                        <>
                          <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                          </svg>
                          Deleting...
                        </>
                      ) : 'Delete'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <footer style={{ backgroundColor: '#034338' }} className="mt-16 py-10 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <p className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.5)' }}>© 2026 Hostel Finder. All rights reserved.</p>
          <div className="flex items-center gap-6 text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.75)' }}>
            <Link href="/listings" className="hover:text-white transition-colors cursor-pointer">Browse listings</Link>
            <Link href="/contact" className="hover:text-white transition-colors cursor-pointer">Contact support</Link>
          </div>
        </div>
      </footer>
      {showPhoneModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center px-4"
          style={{ backgroundColor: 'rgba(3,67,56,0.85)' }}>
          <div className="w-full max-w-sm bg-white rounded-2xl p-6 shadow-2xl">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4"
              style={{ backgroundColor: '#E8F5EE' }}>
              <svg className="w-6 h-6" style={{ color: '#034338' }} viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
            </div>

            <h2 className="text-lg font-black mb-1" style={{ color: '#0A2A23' }}>Add your WhatsApp number</h2>
            <p className="text-sm font-medium mb-5" style={{ color: '#4B6B62' }}>
              Students contact you directly via WhatsApp. Without a number, they can't reach you — add it now to activate your listings.
            </p>

            {phoneError && (
              <div className="mb-4 px-4 py-3 rounded-xl text-sm font-medium" style={{ backgroundColor: '#FEE2E2', color: '#991B1B' }}>
                {phoneError}
              </div>
            )}

            <div className="mb-4">
              <label className="block text-xs font-bold mb-1.5" style={{ color: '#0A2A23' }}>
                WhatsApp number <span style={{ color: '#DC2626' }}>*</span>
              </label>
              <input
                type="tel"
                value={phoneInput}
                onChange={e => setPhoneInput(e.target.value)}
                placeholder="080XXXXXXXX"
                autoFocus
                className="w-full px-4 py-3 rounded-xl text-sm outline-none border transition-colors"
                style={{ borderColor: '#E8EDEB', color: '#0A2A23' }}
                onFocus={e => e.target.style.borderColor = '#034338'}
                onBlur={e => e.target.style.borderColor = '#E8EDEB'}
                onKeyDown={e => e.key === 'Enter' && handleSavePhone()}
              />
            </div>

            <button
              onClick={handleSavePhone}
              disabled={savingPhone}
              className="w-full py-3.5 rounded-xl font-bold text-sm text-white hover:opacity-90 transition-opacity disabled:opacity-60"
              style={{ backgroundColor: '#034338' }}>
              {savingPhone ? 'Saving...' : 'Save and continue'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
