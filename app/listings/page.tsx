'use client'

import { useState, useMemo, useEffect, useCallback, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import Navbar from '@/components/Navbar'
import AuthGateModal from '@/components/AuthGateModal'
import { supabase } from '@/lib/supabase'

interface Listing {
  id: string; name: string; area: string; distance_tag: string
  price: number; room_type: string; rooms_available: number; slug: string
  listing_photos: { photo_url: string; is_cover: boolean }[]
}

const ROOM_TYPES = ['All', 'Self-contain', 'Single Room', 'Shared Room', 'Mini Flat']

const roomTypeMap: Record<string, string> = {
  self_contain: 'Self-contain', single: 'Single Room',
  shared: 'Shared Room',       mini_flat: 'Mini Flat',
}
const roomTypeToDb: Record<string, string> = {
  'Self-contain': 'self_contain', 'Single Room': 'single',
  'Shared Room':  'shared',       'Mini Flat':   'mini_flat',
}
const urlTypeToLabel: Record<string, string> = {
  self_contain: 'Self-contain', single: 'Single Room',
  shared: 'Shared Room',        mini_flat: 'Mini Flat',
}
const roomTypeBadge: Record<string, { bg: string; text: string }> = {
  'Self-contain': { bg: '#DCFCE7', text: '#166534' },
  'Single Room':  { bg: '#DBEAFE', text: '#1E40AF' },
  'Shared Room':  { bg: '#FEF3C7', text: '#92400E' },
  'Mini Flat':    { bg: '#EDE9FE', text: '#5B21B6' },
}
const SORT_OPTIONS = [
  { label: 'Newest first',    value: 'newest' },
  { label: 'Price: Low–High', value: 'price_asc' },
  { label: 'Price: High–Low', value: 'price_desc' },
]

function ListingsContent() {
  const searchParams = useSearchParams()

  const [allListings, setAllListings]   = useState<Listing[]>([])
  const [loadingData, setLoadingData]   = useState(true)
  const [isLoggedIn, setIsLoggedIn]     = useState(false)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [showFilters, setShowFilters]   = useState(false)

  const [search, setSearch]     = useState(searchParams.get('search') || '')
  const [roomType, setRoomType] = useState(() => {
    const t = searchParams.get('type')
    return t ? (urlTypeToLabel[t] || 'All') : 'All'
  })
  const [maxPrice, setMaxPrice] = useState(250000)
  const [sort, setSort]         = useState('newest')

  const fetchData = useCallback(async () => {
    setLoadingData(true)
    const [{ data: { user } }, { data }] = await Promise.all([
      supabase.auth.getUser(),
      supabase
        .from('listings')
        .select('id, name, area, distance_tag, price, room_type, rooms_available, slug, listing_photos(photo_url, is_cover)')
        .eq('status', 'active')
        .gt('rooms_available', 0)
        .order('created_at', { ascending: false }),
    ])
    setIsLoggedIn(!!user)
    setAllListings(data || [])
    setLoadingData(false)
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setIsLoggedIn(!!session?.user)
    })
    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    const onFocus = () => fetchData()
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [fetchData])

  const handleCardClick = useCallback((e: React.MouseEvent) => {
    if (!isLoggedIn) {
      e.preventDefault()
      setShowAuthModal(true)
    }
  }, [isLoggedIn])

  const filtered = useMemo(() => {
    let list = [...allListings]
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(l => l.name.toLowerCase().includes(q) || l.area.toLowerCase().includes(q))
    }
    if (roomType !== 'All') list = list.filter(l => l.room_type === roomTypeToDb[roomType])
    list = list.filter(l => l.price <= maxPrice)
    if (sort === 'price_asc')  list.sort((a, b) => a.price - b.price)
    if (sort === 'price_desc') list.sort((a, b) => b.price - a.price)
    return list
  }, [allListings, search, roomType, maxPrice, sort])

  const resetFilters = () => { setRoomType('All'); setMaxPrice(250000); setSearch('') }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F4F6F5' }}>
      <Navbar />

      {showAuthModal && <AuthGateModal onClose={() => setShowAuthModal(false)} />}

      {/* Header */}
      <div style={{ backgroundColor: '#034338' }} className="px-4 sm:px-6 py-10">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-2xl sm:text-3xl font-black text-white mb-1">Hostels near FUOYE</h1>
          <p style={{ color: 'rgba(255,255,255,0.65)' }} className="text-sm font-medium">
            {loadingData ? 'Loading...' : `${filtered.length} listing${filtered.length !== 1 ? 's' : ''} available`}
          </p>
          <div className="mt-5 bg-white rounded-xl flex items-center gap-3 px-4 py-3 max-w-lg">
            <svg className="w-4 h-4 shrink-0 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search by area or hostel name..."
              className="flex-1 text-sm outline-none bg-transparent text-[#0A2A23] placeholder-gray-400" />
            {search && (
              <button onClick={() => setSearch('')} className="text-gray-400 hover:text-gray-600 cursor-pointer">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex gap-8">

          {/* Sidebar */}
          <aside className="hidden lg:block w-56 shrink-0">
            <div className="bg-white rounded-2xl p-5 sticky top-24 shadow-sm">
              <h2 className="font-black text-sm mb-5" style={{ color: '#0A2A23' }}>Filters</h2>
              <div className="mb-6">
                <p className="text-xs font-bold mb-3" style={{ color: '#4B6B62' }}>ROOM TYPE</p>
                <div className="flex flex-col gap-1.5">
                  {ROOM_TYPES.map(type => (
                    <button key={type} onClick={() => setRoomType(type)}
                      className="text-left text-sm px-3 py-2 rounded-lg font-medium transition-all cursor-pointer"
                      style={roomType === type ? { backgroundColor: '#034338', color: '#FFFFFF' } : { color: '#3D6058' }}>
                      {type}
                    </button>
                  ))}
                </div>
              </div>
              <div className="mb-6">
                <p className="text-xs font-bold mb-3" style={{ color: '#4B6B62' }}>MAX PRICE / YEAR</p>
                <p className="text-lg font-black mb-3" style={{ color: '#034338' }}>₦{maxPrice.toLocaleString()}</p>
                <input type="range" min={40000} max={250000} step={5000} value={maxPrice}
                  onChange={e => setMaxPrice(Number(e.target.value))} className="w-full accent-[#37D76A] cursor-pointer" />
                <div className="flex justify-between text-xs mt-1" style={{ color: '#4B6B62' }}>
                  <span>₦40k</span><span>₦250k</span>
                </div>
              </div>
              <button onClick={resetFilters}
                className="w-full text-sm font-bold py-2 rounded-lg border transition-colors cursor-pointer hover:bg-gray-50"
                style={{ color: '#034338', borderColor: '#E8EDEB' }}>
                Reset filters
              </button>
            </div>
          </aside>

          {/* Main */}
          <div className="flex-1 min-w-0">

            <div className="flex items-center justify-between mb-5 gap-3">
              <button onClick={() => setShowFilters(!showFilters)}
                className="lg:hidden flex items-center gap-2 text-sm font-bold px-4 py-2 rounded-xl bg-white shadow-sm cursor-pointer"
                style={{ color: '#034338' }}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 010 2H4a1 1 0 01-1-1zM6 10h12M9 16h6" />
                </svg>
                Filters
                {(roomType !== 'All' || maxPrice < 250000) && (
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: '#37D76A' }} />
                )}
              </button>
              <select value={sort} onChange={e => setSort(e.target.value)}
                className="ml-auto text-sm font-semibold px-4 py-2 rounded-xl bg-white shadow-sm outline-none cursor-pointer"
                style={{ color: '#034338' }}>
                {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>

            {/* Mobile filters */}
            {showFilters && (
              <div className="lg:hidden bg-white rounded-2xl p-5 mb-5 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-black text-sm" style={{ color: '#0A2A23' }}>Filters</h2>
                  <button onClick={() => setShowFilters(false)} className="cursor-pointer" style={{ color: '#4B6B62' }}>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <p className="text-xs font-bold mb-3" style={{ color: '#4B6B62' }}>ROOM TYPE</p>
                <div className="flex flex-wrap gap-2 mb-5">
                  {ROOM_TYPES.map(type => (
                    <button key={type} onClick={() => setRoomType(type)}
                      className="text-sm px-4 py-2 rounded-full font-semibold transition-all cursor-pointer"
                      style={roomType === type ? { backgroundColor: '#034338', color: '#FFFFFF' } : { backgroundColor: '#F4F6F5', color: '#3D6058' }}>
                      {type}
                    </button>
                  ))}
                </div>
                <p className="text-xs font-bold mb-2" style={{ color: '#4B6B62' }}>MAX PRICE: ₦{maxPrice.toLocaleString()}/yr</p>
                <input type="range" min={40000} max={250000} step={5000} value={maxPrice}
                  onChange={e => setMaxPrice(Number(e.target.value))} className="w-full accent-[#37D76A] cursor-pointer" />
                <button onClick={resetFilters} className="mt-4 w-full text-sm font-bold py-2 rounded-lg border cursor-pointer"
                  style={{ color: '#034338', borderColor: '#E8EDEB' }}>Reset filters</button>
              </div>
            )}

            {/* Desktop pills */}
            <div className="hidden lg:flex flex-wrap gap-2 mb-6">
              {ROOM_TYPES.map(type => (
                <button key={type} onClick={() => setRoomType(type)}
                  className="text-sm px-4 py-1.5 rounded-full font-semibold transition-all cursor-pointer"
                  style={roomType === type ? { backgroundColor: '#034338', color: '#FFFFFF' } : { backgroundColor: '#FFFFFF', color: '#3D6058' }}>
                  {type}
                </button>
              ))}
            </div>

            {/* Active filter chips */}
            {(search || roomType !== 'All' || maxPrice < 250000) && !loadingData && (
              <div className="flex items-center gap-2 mb-4 flex-wrap">
                <span className="text-xs font-bold" style={{ color: '#4B6B62' }}>Active:</span>
                {search && (
                  <span className="flex items-center gap-1 text-xs font-semibold px-3 py-1 rounded-full" style={{ backgroundColor: '#E8F5EE', color: '#034338' }}>
                    "{search}" <button onClick={() => setSearch('')} className="cursor-pointer">×</button>
                  </span>
                )}
                {roomType !== 'All' && (
                  <span className="flex items-center gap-1 text-xs font-semibold px-3 py-1 rounded-full" style={{ backgroundColor: '#E8F5EE', color: '#034338' }}>
                    {roomType} <button onClick={() => setRoomType('All')} className="cursor-pointer">×</button>
                  </span>
                )}
                {maxPrice < 250000 && (
                  <span className="flex items-center gap-1 text-xs font-semibold px-3 py-1 rounded-full" style={{ backgroundColor: '#E8F5EE', color: '#034338' }}>
                    Max ₦{maxPrice.toLocaleString()} <button onClick={() => setMaxPrice(250000)} className="cursor-pointer">×</button>
                  </span>
                )}
              </div>
            )}

            {/* Auth nudge for logged-out users */}
            {!isLoggedIn && !loadingData && allListings.length > 0 && (
              <div className="flex items-center gap-3 px-4 py-3 rounded-xl mb-5 text-sm font-medium" style={{ backgroundColor: '#E8F5EE' }}>
                <svg className="w-4 h-4 shrink-0" style={{ color: '#034338' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span style={{ color: '#034338' }}>
                  <Link href="/register" className="font-bold underline">Create a free account</Link> or{' '}
                  <Link href="/login" className="font-bold underline">log in</Link> to view hostel details and contact agents.
                </span>
              </div>
            )}

            {/* Loading */}
            {loadingData ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-white rounded-2xl overflow-hidden shadow-sm animate-pulse">
                    <div className="h-44" style={{ backgroundColor: '#E8EDEB' }} />
                    <div className="p-4">
                      <div className="h-4 rounded mb-2" style={{ backgroundColor: '#E8EDEB', width: '70%' }} />
                      <div className="h-3 rounded" style={{ backgroundColor: '#E8EDEB', width: '50%' }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 text-center">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: '#F4F6F5' }}>
                  <svg className="w-7 h-7" style={{ color: '#4B6B62' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <h3 className="font-bold text-base mb-1" style={{ color: '#0A2A23' }}>No hostels found</h3>
                <p className="text-sm mb-4" style={{ color: '#4B6B62' }}>Try adjusting your filters or search term.</p>
                <button onClick={resetFilters} className="text-sm font-bold px-5 py-2 rounded-full text-white cursor-pointer" style={{ backgroundColor: '#034338' }}>
                  Clear filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {filtered.map(listing => {
                  const cover = listing.listing_photos?.find(p => p.is_cover) || listing.listing_photos?.[0]
                  const label = roomTypeMap[listing.room_type] || listing.room_type
                  const badge = roomTypeBadge[label] || { bg: '#F4F6F5', text: '#4B6B62' }
                  return (
                    <Link
                      href={`/listings/${listing.slug}`}
                      key={listing.id}
                      onClick={handleCardClick}
                      className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                    >
                      <div className="h-44 relative overflow-hidden" style={{ backgroundColor: '#1a4a3a' }}>
                        {cover ? (
                          <img src={cover.photo_url} alt={listing.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center opacity-10">
                            <svg className="w-20 h-20 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                            </svg>
                          </div>
                        )}
                        {!isLoggedIn && (
                          <div className="absolute inset-0 flex items-end justify-center pb-3 opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="text-xs font-bold px-3 py-1.5 rounded-full" style={{ backgroundColor: 'rgba(3,67,56,0.9)', color: '#37D76A' }}>
                              Sign in to view details
                            </span>
                          </div>
                        )}
                        <div className="absolute top-3 left-3">
                          <span className="text-xs font-black px-3 py-1.5 rounded-full" style={{ backgroundColor: '#37D76A', color: '#034338' }}>
                            ₦{listing.price.toLocaleString()}/yr
                          </span>
                        </div>
                        <div className="absolute top-3 right-3">
                          <span className="bg-black/40 text-white text-xs font-semibold px-2.5 py-1 rounded-full">
                            {listing.rooms_available} room{listing.rooms_available !== 1 ? 's' : ''} left
                          </span>
                        </div>
                      </div>
                      <div className="p-4">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h3 className="font-bold text-base leading-snug" style={{ color: '#0A2A23' }}>{listing.name}</h3>
                          <span className="shrink-0 text-xs font-bold px-2.5 py-1 rounded-full" style={{ backgroundColor: badge.bg, color: badge.text }}>{label}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-sm font-medium" style={{ color: '#4B6B62' }}>
                          <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          {listing.area} · {listing.distance_tag}
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      <footer style={{ backgroundColor: '#034338' }} className="mt-16 py-10 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <p className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.5)' }}>© 2026 Hostel Finder. All rights reserved.</p>
          <div className="flex items-center gap-6 text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.75)' }}>
            {[{ label: 'Browse', href: '/listings' }, { label: 'List a hostel', href: '/register' }, { label: 'About', href: '/about' }, { label: 'Contact', href: '/contact' }].map(link => (
              <Link key={link.href} href={link.href} className="hover:text-white transition-colors">{link.label}</Link>
            ))}
          </div>
        </div>
      </footer>
    </div>
  )
}

export default function ListingsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F4F6F5' }}>
        <div className="w-8 h-8 rounded-full border-4 border-t-transparent animate-spin" style={{ borderColor: '#034338', borderTopColor: 'transparent' }} />
      </div>
    }>
      <ListingsContent />
    </Suspense>
  )
}
