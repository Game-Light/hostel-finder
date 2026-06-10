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
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const { data: profile } = await supabase
      .from('users').select('role').eq('id', user.id).single()
    if (profile?.role !== 'agent') { router.push('/listings'); return }

    const { data } = await supabase
      .from('listings')
      .select('id, name, area, price, room_type, rooms_available, status, views, created_at, slug')
      .eq('agent_id', user.id)
      .order('created_at', { ascending: false })

    setListings(data || [])
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
    </div>
  )
}
