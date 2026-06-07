'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import { supabase } from '@/lib/supabase'

interface Listing {
  id: string
  name: string
  area: string
  price: number
  room_type: string
  rooms_available: number
  status: 'pending' | 'active' | 'inactive'
  views: number
  created_at: string
  slug: string
}

const roomTypeLabel: Record<string, string> = {
  self_contain: 'Self-contain',
  single:       'Single Room',
  shared:       'Shared Room',
  mini_flat:    'Mini Flat',
}

const statusStyle: Record<string, { bg: string; text: string; label: string }> = {
  active:   { bg: '#DCFCE7', text: '#166534', label: 'Active' },
  pending:  { bg: '#FEF3C7', text: '#92400E', label: 'Pending review' },
  inactive: { bg: '#F3F4F6', text: '#6B7280', label: 'Inactive' },
}

export default function AgentDashboardPage() {
  const router = useRouter()
  const [listings, setListings] = useState<Listing[]>([])
  const [profile, setProfile] = useState<{ full_name: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      // Get profile
      const { data: profileData } = await supabase
        .from('users')
        .select('full_name, role')
        .eq('id', user.id)
        .single()

      if (profileData?.role !== 'agent') {
        router.push('/listings')
        return
      }

      setProfile(profileData)

      // Get listings
      const { data: listingData } = await supabase
        .from('listings')
        .select('id, name, area, price, room_type, rooms_available, status, views, created_at, slug')
        .eq('agent_id', user.id)
        .order('created_at', { ascending: false })

      setListings(listingData || [])
      setLoading(false)
    }

    init()
  }, [router])

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this listing? This cannot be undone.')) return
    setDeletingId(id)
    await supabase.from('listings').delete().eq('id', id)
    setListings(prev => prev.filter(l => l.id !== id))
    setDeletingId(null)
  }

  const handleToggleStatus = async (listing: Listing) => {
    const newStatus = listing.status === 'active' ? 'inactive' : 'active'
    await supabase.from('listings').update({ status: newStatus }).eq('id', listing.id)
    setListings(prev => prev.map(l => l.id === listing.id ? { ...l, status: newStatus } : l))
  }

  const activeCount   = listings.filter(l => l.status === 'active').length
  const pendingCount  = listings.filter(l => l.status === 'pending').length
  const totalViews    = listings.reduce((sum, l) => sum + (l.views || 0), 0)

  if (loading) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: '#F4F6F5' }}>
        <Navbar />
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 rounded-full border-4 border-t-transparent animate-spin" style={{ borderColor: '#034338', borderTopColor: 'transparent' }} />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F4F6F5' }}>
      <Navbar />

      {/* Page header */}
      <div style={{ backgroundColor: '#034338' }} className="px-4 sm:px-6 py-10">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-white">My Dashboard</h1>
            <p className="text-sm font-medium mt-1" style={{ color: 'rgba(255,255,255,0.6)' }}>
              Manage your hostel listings
            </p>
          </div>
          <Link
            href="/agent/listings/new"
            style={{ backgroundColor: '#37D76A' }}
            className="inline-flex items-center gap-2 text-[#034338] font-bold text-sm px-5 py-3 rounded-full hover:opacity-90 transition-opacity self-start sm:self-auto"
          >
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
            { label: 'Pending review', value: pendingCount },
            { label: 'Total views',    value: totalViews },
          ].map(stat => (
            <div key={stat.label} className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm text-center">
              <div className="text-2xl sm:text-3xl font-black" style={{ color: '#034338' }}>{stat.value}</div>
              <div className="text-xs sm:text-sm font-medium mt-1" style={{ color: '#4B6B62' }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Listings */}
        {listings.length === 0 ? (
          // Empty state
          <div className="bg-white rounded-2xl p-12 text-center shadow-sm">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5" style={{ backgroundColor: '#F4F6F5' }}>
              <svg className="w-8 h-8" style={{ color: '#4B6B62' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                <polyline strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} points="9 22 9 12 15 12 15 22" />
              </svg>
            </div>
            <h2 className="text-lg font-black mb-2" style={{ color: '#0A2A23' }}>No listings yet</h2>
            <p className="text-sm font-medium mb-6 max-w-xs mx-auto" style={{ color: '#4B6B62' }}>
              Add your first hostel listing and start reaching students near FUOYE.
            </p>
            <Link
              href="/agent/listings/new"
              style={{ backgroundColor: '#034338' }}
              className="inline-flex items-center gap-2 text-white font-bold text-sm px-6 py-3 rounded-full hover:opacity-90 transition-opacity"
            >
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

                  {/* Listing info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h3 className="font-black text-base" style={{ color: '#0A2A23' }}>{listing.name}</h3>
                      <span
                        className="text-xs font-bold px-2.5 py-1 rounded-full"
                        style={{ backgroundColor: statusStyle[listing.status].bg, color: statusStyle[listing.status].text }}
                      >
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

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    {/* Preview */}
                    <Link
                      href={`/listings/${listing.slug}`}
                      className="text-xs font-bold px-3 py-2 rounded-xl border transition-colors hover:bg-gray-50"
                      style={{ color: '#034338', borderColor: '#E8EDEB' }}
                    >
                      Preview
                    </Link>

                    {/* Edit */}
                    <Link
                      href={`/agent/listings/${listing.id}/edit`}
                      className="text-xs font-bold px-3 py-2 rounded-xl border transition-colors hover:bg-gray-50"
                      style={{ color: '#034338', borderColor: '#E8EDEB' }}
                    >
                      Edit
                    </Link>

                    {/* Toggle active/inactive */}
                    {listing.status !== 'pending' && (
                      <button
                        onClick={() => handleToggleStatus(listing)}
                        className="text-xs font-bold px-3 py-2 rounded-xl border transition-colors hover:bg-gray-50"
                        style={{
                          color: listing.status === 'active' ? '#92400E' : '#166534',
                          borderColor: '#E8EDEB',
                        }}
                      >
                        {listing.status === 'active' ? 'Deactivate' : 'Activate'}
                      </button>
                    )}

                    {/* Delete */}
                    <button
                      onClick={() => handleDelete(listing.id)}
                      disabled={deletingId === listing.id}
                      className="text-xs font-bold px-3 py-2 rounded-xl border transition-colors hover:bg-red-50 disabled:opacity-50"
                      style={{ color: '#DC2626', borderColor: '#E8EDEB' }}
                    >
                      {deletingId === listing.id ? '...' : 'Delete'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <footer style={{ backgroundColor: '#034338' }} className="mt-16 py-10 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <p className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.5)' }}>
            © 2026 Hostel Finder. All rights reserved.
          </p>
          <div className="flex items-center gap-6 text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.75)' }}>
            <Link href="/listings" className="hover:text-white transition-colors">Browse listings</Link>
            <Link href="/contact" className="hover:text-white transition-colors">Contact support</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
