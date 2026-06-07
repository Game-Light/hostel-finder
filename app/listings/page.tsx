'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import Navbar from '@/components/Navbar'

const ALL_LISTINGS = [
  { id: '1',  name: 'Sunview Hostel',       area: 'Oye Town',      distance: '5 mins walk',      price: 120000, roomType: 'Self-contain', rooms: 4,  slug: 'sunview-hostel',       color: '#1a4a3a' },
  { id: '2',  name: 'Grace Court Lodge',    area: 'Ikole Road',    distance: '10 mins walk',     price: 80000,  roomType: 'Single Room',  rooms: 6,  slug: 'grace-court-lodge',    color: '#2d5a3d' },
  { id: '3',  name: 'Favour Hostel',        area: 'Behind Campus', distance: 'Walking distance', price: 65000,  roomType: 'Shared Room',  rooms: 8,  slug: 'favour-hostel',        color: '#1e3a2f' },
  { id: '4',  name: 'Royal Suites',         area: 'Oye Town',      distance: '5 mins walk',      price: 180000, roomType: 'Mini Flat',    rooms: 2,  slug: 'royal-suites',         color: '#0f2d24' },
  { id: '5',  name: 'Campus View Hostel',   area: 'School Road',   distance: 'Walking distance', price: 95000,  roomType: 'Self-contain', rooms: 5,  slug: 'campus-view-hostel',   color: '#234d3a' },
  { id: '6',  name: 'Peace Haven',          area: 'Ikole Road',    distance: '15 mins walk',     price: 55000,  roomType: 'Single Room',  rooms: 10, slug: 'peace-haven',          color: '#163028' },
  { id: '7',  name: 'Destiny Hostel',       area: 'Oye Town',      distance: '5 mins walk',      price: 70000,  roomType: 'Single Room',  rooms: 7,  slug: 'destiny-hostel',       color: '#1c4535' },
  { id: '8',  name: 'Green Gate Lodge',     area: 'School Road',   distance: 'Walking distance', price: 150000, roomType: 'Self-contain', rooms: 3,  slug: 'green-gate-lodge',     color: '#2a5240' },
  { id: '9',  name: 'Blessed Suites',       area: 'Behind Campus', distance: '10 mins walk',     price: 200000, roomType: 'Mini Flat',    rooms: 1,  slug: 'blessed-suites',       color: '#113326' },
  { id: '10', name: 'Unity Hostel',         area: 'Ikole Road',    distance: '15 mins walk',     price: 50000,  roomType: 'Shared Room',  rooms: 12, slug: 'unity-hostel',         color: '#1f4838' },
  { id: '11', name: 'Pinnacle Lodge',       area: 'Oye Town',      distance: '10 mins walk',     price: 110000, roomType: 'Self-contain', rooms: 4,  slug: 'pinnacle-lodge',       color: '#255040' },
  { id: '12', name: 'Comfort Court',        area: 'School Road',   distance: 'Walking distance', price: 85000,  roomType: 'Single Room',  rooms: 6,  slug: 'comfort-court',        color: '#173530' },
]

const ROOM_TYPES = ['All', 'Self-contain', 'Single Room', 'Shared Room', 'Mini Flat']
const SORT_OPTIONS = [
  { label: 'Newest first',    value: 'newest' },
  { label: 'Price: Low–High', value: 'price_asc' },
  { label: 'Price: High–Low', value: 'price_desc' },
]

const roomTypeBadge: Record<string, { bg: string; text: string }> = {
  'Self-contain': { bg: '#DCFCE7', text: '#166534' },
  'Single Room':  { bg: '#DBEAFE', text: '#1E40AF' },
  'Shared Room':  { bg: '#FEF3C7', text: '#92400E' },
  'Mini Flat':    { bg: '#EDE9FE', text: '#5B21B6' },
}

export default function ListingsPage() {
  const [search, setSearch]       = useState('')
  const [roomType, setRoomType]   = useState('All')
  const [maxPrice, setMaxPrice]   = useState(250000)
  const [sort, setSort]           = useState('newest')
  const [showFilters, setShowFilters] = useState(false)

  const filtered = useMemo(() => {
    let list = [...ALL_LISTINGS]

    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(l =>
        l.name.toLowerCase().includes(q) || l.area.toLowerCase().includes(q)
      )
    }

    if (roomType !== 'All') {
      list = list.filter(l => l.roomType === roomType)
    }

    list = list.filter(l => l.price <= maxPrice)

    if (sort === 'price_asc')  list.sort((a, b) => a.price - b.price)
    if (sort === 'price_desc') list.sort((a, b) => b.price - a.price)

    return list
  }, [search, roomType, maxPrice, sort])

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F4F6F5' }}>

      {/* ── Navbar ── */}
      <Navbar />

      {/* ── Page header ── */}
      <div style={{ backgroundColor: '#034338' }} className="px-4 sm:px-6 py-10">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-2xl sm:text-3xl font-black text-white mb-1">
            Hostels near FUOYE
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.65)' }} className="text-sm font-medium">
            {filtered.length} listing{filtered.length !== 1 ? 's' : ''} available
          </p>

          {/* Search bar */}
          <div className="mt-5 bg-white rounded-xl flex items-center gap-3 px-4 py-3 max-w-lg">
            <svg className="w-4 h-4 shrink-0 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by area or hostel name..."
              className="flex-1 text-sm outline-none bg-transparent text-[#0A2A23] placeholder-gray-400"
            />
            {search && (
              <button onClick={() => setSearch('')} className="text-gray-400 hover:text-gray-600">
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

          {/* ── Filter sidebar (desktop) ── */}
          <aside className="hidden lg:block w-56 shrink-0">
            <div className="bg-white rounded-2xl p-5 sticky top-24 shadow-sm">

              <h2 className="font-black text-sm mb-5" style={{ color: '#0A2A23' }}>Filters</h2>

              {/* Room type */}
              <div className="mb-6">
                <p className="text-xs font-bold mb-3" style={{ color: '#4B6B62' }}>ROOM TYPE</p>
                <div className="flex flex-col gap-1.5">
                  {ROOM_TYPES.map(type => (
                    <button
                      key={type}
                      onClick={() => setRoomType(type)}
                      className="text-left text-sm px-3 py-2 rounded-lg font-medium transition-all"
                      style={
                        roomType === type
                          ? { backgroundColor: '#034338', color: '#FFFFFF' }
                          : { color: '#3D6058' }
                      }
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {/* Max price */}
              <div className="mb-6">
                <p className="text-xs font-bold mb-3" style={{ color: '#4B6B62' }}>MAX PRICE / YEAR</p>
                <p className="text-lg font-black mb-3" style={{ color: '#034338' }}>
                  ₦{maxPrice.toLocaleString()}
                </p>
                <input
                  type="range"
                  min={40000}
                  max={250000}
                  step={5000}
                  value={maxPrice}
                  onChange={e => setMaxPrice(Number(e.target.value))}
                  className="w-full accent-[#37D76A]"
                />
                <div className="flex justify-between text-xs mt-1" style={{ color: '#4B6B62' }}>
                  <span>₦40k</span>
                  <span>₦250k</span>
                </div>
              </div>

              {/* Reset */}
              <button
                onClick={() => { setRoomType('All'); setMaxPrice(250000); setSearch('') }}
                className="w-full text-sm font-bold py-2 rounded-lg border transition-colors"
                style={{ color: '#034338', borderColor: '#E8EDEB' }}
              >
                Reset filters
              </button>
            </div>
          </aside>

          {/* ── Main content ── */}
          <div className="flex-1 min-w-0">

            {/* Sort + mobile filter bar */}
            <div className="flex items-center justify-between mb-5 gap-3">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="lg:hidden flex items-center gap-2 text-sm font-bold px-4 py-2 rounded-xl bg-white shadow-sm"
                style={{ color: '#034338' }}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 010 2H4a1 1 0 01-1-1zM6 10h12M9 16h6" />
                </svg>
                Filters
              </button>

              <select
                value={sort}
                onChange={e => setSort(e.target.value)}
                className="ml-auto text-sm font-semibold px-4 py-2 rounded-xl bg-white shadow-sm outline-none cursor-pointer"
                style={{ color: '#034338' }}
              >
                {SORT_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>

            {/* Mobile filters panel */}
            {showFilters && (
              <div className="lg:hidden bg-white rounded-2xl p-5 mb-5 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-black text-sm" style={{ color: '#0A2A23' }}>Filters</h2>
                  <button onClick={() => setShowFilters(false)} style={{ color: '#4B6B62' }}>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <p className="text-xs font-bold mb-3" style={{ color: '#4B6B62' }}>ROOM TYPE</p>
                <div className="flex flex-wrap gap-2 mb-5">
                  {ROOM_TYPES.map(type => (
                    <button
                      key={type}
                      onClick={() => setRoomType(type)}
                      className="text-sm px-4 py-2 rounded-full font-semibold transition-all"
                      style={
                        roomType === type
                          ? { backgroundColor: '#034338', color: '#FFFFFF' }
                          : { backgroundColor: '#F4F6F5', color: '#3D6058' }
                      }
                    >
                      {type}
                    </button>
                  ))}
                </div>
                <p className="text-xs font-bold mb-2" style={{ color: '#4B6B62' }}>MAX PRICE: ₦{maxPrice.toLocaleString()}/yr</p>
                <input
                  type="range"
                  min={40000}
                  max={250000}
                  step={5000}
                  value={maxPrice}
                  onChange={e => setMaxPrice(Number(e.target.value))}
                  className="w-full accent-[#37D76A]"
                />
              </div>
            )}

            {/* Room type pills (desktop quick filter) */}
            <div className="hidden lg:flex flex-wrap gap-2 mb-6">
              {ROOM_TYPES.map(type => (
                <button
                  key={type}
                  onClick={() => setRoomType(type)}
                  className="text-sm px-4 py-1.5 rounded-full font-semibold transition-all"
                  style={
                    roomType === type
                      ? { backgroundColor: '#034338', color: '#FFFFFF' }
                      : { backgroundColor: '#FFFFFF', color: '#3D6058' }
                  }
                >
                  {type}
                </button>
              ))}
            </div>

            {/* Grid */}
            {filtered.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 text-center">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: '#F4F6F5' }}>
                  <svg className="w-7 h-7" style={{ color: '#4B6B62' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <h3 className="font-bold text-base mb-1" style={{ color: '#0A2A23' }}>No hostels found</h3>
                <p className="text-sm mb-4" style={{ color: '#4B6B62' }}>Try adjusting your filters or search term.</p>
                <button
                  onClick={() => { setRoomType('All'); setMaxPrice(250000); setSearch('') }}
                  className="text-sm font-bold px-5 py-2 rounded-full"
                  style={{ backgroundColor: '#034338', color: '#FFFFFF' }}
                >
                  Clear filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {filtered.map(listing => (
                  <Link
                    href={`/listings/${listing.slug}`}
                    key={listing.id}
                    className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                  >
                    <div className="h-44 relative overflow-hidden" style={{ backgroundColor: listing.color }}>
                      <div className="absolute inset-0 flex items-center justify-center opacity-10">
                        <svg className="w-20 h-20 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                          <polyline strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} points="9 22 9 12 15 12 15 22" />
                        </svg>
                      </div>
                      <div className="absolute top-3 left-3">
                        <span className="text-xs font-black px-3 py-1.5 rounded-full" style={{ backgroundColor: '#37D76A', color: '#034338' }}>
                          ₦{listing.price.toLocaleString()}/yr
                        </span>
                      </div>
                      <div className="absolute top-3 right-3">
                        <span className="bg-black/40 text-white text-xs font-semibold px-2.5 py-1 rounded-full">
                          {listing.rooms} rooms left
                        </span>
                      </div>
                    </div>
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="font-bold text-base leading-snug" style={{ color: '#0A2A23' }}>{listing.name}</h3>
                        <span
                          className="shrink-0 text-xs font-bold px-2.5 py-1 rounded-full"
                          style={{ backgroundColor: roomTypeBadge[listing.roomType].bg, color: roomTypeBadge[listing.roomType].text }}
                        >
                          {listing.roomType}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-sm font-medium" style={{ color: '#4B6B62' }}>
                        <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {listing.area} · {listing.distance}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Footer ── */}
      <footer style={{ backgroundColor: '#034338' }} className="mt-16 py-10 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <Image src="/logo/Logo-horizontal.svg" alt="Hostel Finder" width={120} height={32} />
            <p className="text-xs mt-2 font-medium" style={{ color: 'rgba(255,255,255,0.5)' }}>
              © 2026 Hostel Finder. All rights reserved.
            </p>
          </div>
          <div className="flex items-center gap-6 text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.75)' }}>
            {[
              { label: 'Browse', href: '/listings' },
              { label: 'List a hostel', href: '/register' },
              { label: 'About', href: '/about' },
              { label: 'Contact', href: '/contact' },
            ].map(link => (
              <Link key={link.href} href={link.href} className="hover:text-white transition-colors">{link.label}</Link>
            ))}
          </div>
        </div>
      </footer>
    </div>
  )
}
