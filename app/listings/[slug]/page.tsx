'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useParams } from 'next/navigation'
import Navbar from '@/components/Navbar'

const ALL_LISTINGS = [
  {
    id: '1', slug: 'sunview-hostel', name: 'Sunview Hostel',
    area: 'Oye Town', distance: '5 mins walk', price: 120000,
    roomType: 'Self-contain', rooms: 4, color: '#1a4a3a',
    description: 'Sunview Hostel offers clean, comfortable self-contain rooms just 5 minutes from the FUOYE main gate. Each room comes with a private bathroom, kitchenette, and reliable electricity. The compound is well-fenced with 24-hour security, making it one of the safest options near campus.',
    facilities: ['Running water', '24hr electricity', 'Prepaid meter', 'Security', 'Fence/gate', 'Borehole'],
    agent: { name: 'Mr. Adebayo Tunde', phone: '08012345678', whatsapp: '2348012345678' },
  },
  {
    id: '2', slug: 'grace-court-lodge', name: 'Grace Court Lodge',
    area: 'Ikole Road', distance: '10 mins walk', price: 80000,
    roomType: 'Single Room', rooms: 6, color: '#2d5a3d',
    description: 'Grace Court Lodge provides affordable single rooms with shared bathroom facilities on Ikole Road. The hostel has consistent water supply from a borehole and prepaid electricity meters. A great option for students on a budget who want decent accommodation.',
    facilities: ['Running water', 'Prepaid meter', 'Borehole', 'Fence/gate'],
    agent: { name: 'Mrs. Folake Adeyemi', phone: '08023456789', whatsapp: '2348023456789' },
  },
  {
    id: '3', slug: 'favour-hostel', name: 'Favour Hostel',
    area: 'Behind Campus', distance: 'Walking distance', price: 65000,
    roomType: 'Shared Room', rooms: 8, color: '#1e3a2f',
    description: 'Favour Hostel is the most affordable option right behind campus. Shared rooms accommodate 2-3 students each. The hostel has regular water supply and is just a short walk to the lecture halls, making it ideal for students who want to minimise transport costs.',
    facilities: ['Running water', 'Borehole', 'Security'],
    agent: { name: 'Alhaji Musa Bello', phone: '08034567890', whatsapp: '2348034567890' },
  },
  {
    id: '4', slug: 'royal-suites', name: 'Royal Suites',
    area: 'Oye Town', distance: '5 mins walk', price: 180000,
    roomType: 'Mini Flat', rooms: 2, color: '#0f2d24',
    description: 'Royal Suites offers premium mini flats for students who want more space and privacy. Each flat has a sitting room, bedroom, and full kitchen. With Wi-Fi included and a parking space, this is the best option for postgraduate students or those with cars.',
    facilities: ['Running water', '24hr electricity', 'Prepaid meter', 'Security', 'Parking', 'Wi-Fi', 'Fence/gate', 'Borehole'],
    agent: { name: 'Chief Emmanuel Obi', phone: '08045678901', whatsapp: '2348045678901' },
  },
  {
    id: '5', slug: 'campus-view-hostel', name: 'Campus View Hostel',
    area: 'School Road', distance: 'Walking distance', price: 95000,
    roomType: 'Self-contain', rooms: 5, color: '#234d3a',
    description: 'Campus View Hostel sits directly on School Road with a clear view of the FUOYE campus. Self-contain rooms with private bathrooms, dedicated prepaid meters, and reliable borehole water. The compound is secure and well-maintained.',
    facilities: ['Running water', '24hr electricity', 'Prepaid meter', 'Security', 'Borehole', 'Fence/gate'],
    agent: { name: 'Mrs. Ngozi Eze', phone: '08056789012', whatsapp: '2348056789012' },
  },
  {
    id: '6', slug: 'peace-haven', name: 'Peace Haven',
    area: 'Ikole Road', distance: '15 mins walk', price: 55000,
    roomType: 'Single Room', rooms: 10, color: '#163028',
    description: 'Peace Haven is the most budget-friendly option on Ikole Road with single rooms at very competitive rates. The hostel has basic amenities and plenty of rooms available. Best suited for students looking to save on accommodation costs.',
    facilities: ['Running water', 'Borehole', 'Fence/gate'],
    agent: { name: 'Mr. Segun Lawal', phone: '08067890123', whatsapp: '2348067890123' },
  },
  {
    id: '7', slug: 'destiny-hostel', name: 'Destiny Hostel',
    area: 'Oye Town', distance: '5 mins walk', price: 70000,
    roomType: 'Single Room', rooms: 7, color: '#1c4535',
    description: 'Destiny Hostel offers well-maintained single rooms in a quiet part of Oye Town. The compound has 24-hour security and consistent power from prepaid meters. A solid mid-range option close to campus.',
    facilities: ['Running water', 'Prepaid meter', 'Security', 'Borehole', 'Fence/gate'],
    agent: { name: 'Pastor James Okoro', phone: '08078901234', whatsapp: '2348078901234' },
  },
  {
    id: '8', slug: 'green-gate-lodge', name: 'Green Gate Lodge',
    area: 'School Road', distance: 'Walking distance', price: 150000,
    roomType: 'Self-contain', rooms: 3, color: '#2a5240',
    description: 'Green Gate Lodge is a well-known name on School Road. Self-contain rooms with modern finishes, reliable electricity, and 24-hour water supply. Very few rooms left so book early.',
    facilities: ['Running water', '24hr electricity', 'Prepaid meter', 'Security', 'Borehole', 'Fence/gate'],
    agent: { name: 'Mrs. Blessing Nwosu', phone: '08089012345', whatsapp: '2348089012345' },
  },
  {
    id: '9', slug: 'blessed-suites', name: 'Blessed Suites',
    area: 'Behind Campus', distance: '10 mins walk', price: 200000,
    roomType: 'Mini Flat', rooms: 1, color: '#113326',
    description: 'Blessed Suites is the premium mini flat option behind campus. Spacious, modern, and quiet. Only one unit currently available. Includes dedicated parking, Wi-Fi, and all utilities covered.',
    facilities: ['Running water', '24hr electricity', 'Prepaid meter', 'Security', 'Parking', 'Wi-Fi', 'Fence/gate', 'Borehole'],
    agent: { name: 'Dr. Chuka Amara', phone: '08090123456', whatsapp: '2348090123456' },
  },
  {
    id: '10', slug: 'unity-hostel', name: 'Unity Hostel',
    area: 'Ikole Road', distance: '15 mins walk', price: 50000,
    roomType: 'Shared Room', rooms: 12, color: '#1f4838',
    description: 'Unity Hostel has the most rooms available near FUOYE at the lowest price point. Shared rooms are clean and well-ventilated. Borehole water is available all day and the compound has basic security.',
    facilities: ['Running water', 'Borehole', 'Security'],
    agent: { name: 'Alhaja Aminat Sule', phone: '08001234567', whatsapp: '2348001234567' },
  },
  {
    id: '11', slug: 'pinnacle-lodge', name: 'Pinnacle Lodge',
    area: 'Oye Town', distance: '10 mins walk', price: 110000,
    roomType: 'Self-contain', rooms: 4, color: '#255040',
    description: 'Pinnacle Lodge is a well-established self-contain hostel in the heart of Oye Town. Clean rooms, consistent power, and a friendly management team. Highly rated by returning students.',
    facilities: ['Running water', '24hr electricity', 'Prepaid meter', 'Security', 'Borehole', 'Fence/gate'],
    agent: { name: 'Mr. Rotimi Fadare', phone: '08011223344', whatsapp: '2348011223344' },
  },
  {
    id: '12', slug: 'comfort-court', name: 'Comfort Court',
    area: 'School Road', distance: 'Walking distance', price: 85000,
    roomType: 'Single Room', rooms: 6, color: '#173530',
    description: 'Comfort Court on School Road is a popular choice for 200-level and above students. Single rooms with private bathrooms, prepaid meters, and borehole water. Walking distance to all faculties.',
    facilities: ['Running water', 'Prepaid meter', 'Security', 'Borehole', 'Fence/gate'],
    agent: { name: 'Mrs. Taiwo Adegoke', phone: '08022334455', whatsapp: '2348022334455' },
  },
]

const roomTypeBadge: Record<string, { bg: string; text: string }> = {
  'Self-contain': { bg: '#DCFCE7', text: '#166534' },
  'Single Room':  { bg: '#DBEAFE', text: '#1E40AF' },
  'Shared Room':  { bg: '#FEF3C7', text: '#92400E' },
  'Mini Flat':    { bg: '#EDE9FE', text: '#5B21B6' },
}

const facilityIcons: Record<string, string> = {
  'Running water':    '💧',
  '24hr electricity': '⚡',
  'Prepaid meter':    '🔌',
  'Security':         '🔒',
  'Parking':          '🚗',
  'Wi-Fi':            '📶',
  'Fence/gate':       '🏠',
  'Borehole':         '🚰',
}

// Placeholder colors for gallery slots
const GALLERY_COLORS = ['#1a4a3a', '#2d5a3d', '#1e3a2f', '#234d3a', '#163028', '#0f2d24']

export default function HostelDetailPage() {
  const params = useParams()
  const slug = params.slug as string

  const listing = ALL_LISTINGS.find(l => l.slug === slug)
  const similar = ALL_LISTINGS.filter(l => l.slug !== slug).slice(0, 3)

  const [activePhoto, setActivePhoto] = useState(0)
  const [copied, setCopied] = useState(false)

  if (!listing) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F4F6F5' }}>
        <div className="text-center">
          <h1 className="text-2xl font-black mb-2" style={{ color: '#0A2A23' }}>Hostel not found</h1>
          <p className="text-sm mb-6" style={{ color: '#4B6B62' }}>This listing may have been removed or the link is incorrect.</p>
          <Link href="/listings" className="font-bold text-sm px-6 py-3 rounded-full text-white" style={{ backgroundColor: '#034338' }}>
            Browse all listings
          </Link>
        </div>
      </div>
    )
  }

  const handleCopyPhone = () => {
    navigator.clipboard.writeText(listing.agent.phone)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F4F6F5' }}>

      {/* ── Navbar ── */}
      <Navbar />

      {/* ── Breadcrumb ── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4">
        <div className="flex items-center gap-2 text-sm font-medium" style={{ color: '#4B6B62' }}>
          <Link href="/" className="hover:text-[#034338] transition-colors">Home</Link>
          <span>/</span>
          <Link href="/listings" className="hover:text-[#034338] transition-colors">Listings</Link>
          <span>/</span>
          <span style={{ color: '#0A2A23' }}>{listing.name}</span>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-16">
        <div className="flex flex-col lg:flex-row gap-8">

          {/* ── Left column ── */}
          <div className="flex-1 min-w-0">

            {/* Photo gallery */}
            <div className="bg-white rounded-2xl overflow-hidden shadow-sm mb-6">
              {/* Main photo */}
              <div
                className="h-64 sm:h-80 relative flex items-center justify-center"
                style={{ backgroundColor: GALLERY_COLORS[activePhoto] }}
              >
                <div className="opacity-10">
                  <svg className="w-24 h-24 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                    <polyline strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} points="9 22 9 12 15 12 15 22" />
                  </svg>
                </div>
                <div className="absolute bottom-3 right-3 bg-black/40 text-white text-xs font-semibold px-2.5 py-1 rounded-full">
                  {activePhoto + 1} / 6
                </div>
              </div>
              {/* Thumbnail strip */}
              <div className="flex gap-2 p-3 overflow-x-auto">
                {GALLERY_COLORS.map((color, i) => (
                  <button
                    key={i}
                    onClick={() => setActivePhoto(i)}
                    className="shrink-0 w-16 h-12 rounded-lg overflow-hidden transition-all"
                    style={{
                      backgroundColor: color,
                      outline: activePhoto === i ? '2px solid #37D76A' : '2px solid transparent',
                      outlineOffset: '2px',
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Hostel info */}
            <div className="bg-white rounded-2xl p-6 shadow-sm mb-6">
              <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                <div>
                  <h1 className="text-2xl font-black mb-1" style={{ color: '#0A2A23' }}>{listing.name}</h1>
                  <div className="flex items-center gap-1.5 text-sm font-medium" style={{ color: '#4B6B62' }}>
                    <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {listing.area} · {listing.distance} to FUOYE main gate
                  </div>
                </div>
                <span
                  className="text-sm font-bold px-3 py-1.5 rounded-full"
                  style={{ backgroundColor: roomTypeBadge[listing.roomType].bg, color: roomTypeBadge[listing.roomType].text }}
                >
                  {listing.roomType}
                </span>
              </div>

              {/* Key stats */}
              <div className="grid grid-cols-3 gap-3 mb-6">
                {[
                  { label: 'Price / year', value: `₦${listing.price.toLocaleString()}` },
                  { label: 'Rooms left', value: `${listing.rooms} rooms` },
                  { label: 'Room type', value: listing.roomType },
                ].map(stat => (
                  <div key={stat.label} className="rounded-xl p-3 text-center" style={{ backgroundColor: '#F4F6F5' }}>
                    <div className="text-base font-black" style={{ color: '#034338' }}>{stat.value}</div>
                    <div className="text-xs font-medium mt-0.5" style={{ color: '#4B6B62' }}>{stat.label}</div>
                  </div>
                ))}
              </div>

              {/* Description */}
              <h2 className="text-base font-bold mb-2" style={{ color: '#0A2A23' }}>About this hostel</h2>
              <p className="text-sm leading-relaxed" style={{ color: '#3D6058' }}>{listing.description}</p>
            </div>

            {/* Facilities */}
            <div className="bg-white rounded-2xl p-6 shadow-sm mb-6">
              <h2 className="text-base font-bold mb-4" style={{ color: '#0A2A23' }}>Facilities</h2>
              <div className="flex flex-wrap gap-2">
                {listing.facilities.map(f => (
                  <div
                    key={f}
                    className="flex items-center gap-2 text-sm font-medium px-3 py-2 rounded-xl"
                    style={{ backgroundColor: '#F4F6F5', color: '#0A2A23' }}
                  >
                    <span>{facilityIcons[f] || '✓'}</span>
                    {f}
                  </div>
                ))}
              </div>
            </div>

            {/* Similar listings */}
            <div>
              <h2 className="text-lg font-black mb-4" style={{ color: '#0A2A23' }}>Similar listings</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {similar.map(l => (
                  <Link
                    href={`/listings/${l.slug}`}
                    key={l.id}
                    className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
                  >
                    <div className="h-28 relative" style={{ backgroundColor: l.color }}>
                      <div className="absolute top-2 left-2">
                        <span className="text-xs font-black px-2 py-1 rounded-full" style={{ backgroundColor: '#37D76A', color: '#034338' }}>
                          ₦{l.price.toLocaleString()}/yr
                        </span>
                      </div>
                    </div>
                    <div className="p-3">
                      <p className="font-bold text-sm mb-1" style={{ color: '#0A2A23' }}>{l.name}</p>
                      <p className="text-xs font-medium" style={{ color: '#4B6B62' }}>{l.area} · {l.distance}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* ── Right column — Agent card (sticky) ── */}
          <div className="w-full lg:w-72 shrink-0">
            <div className="sticky top-24">

              {/* Agent contact card */}
              <div className="rounded-2xl overflow-hidden shadow-lg mb-4" style={{ backgroundColor: '#034338' }}>
                <div className="p-5">
                  <p className="text-xs font-bold mb-4" style={{ color: 'rgba(255,255,255,0.55)' }}>LISTED BY</p>

                  {/* Agent info */}
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center font-black text-lg shrink-0" style={{ backgroundColor: '#37D76A', color: '#034338' }}>
                      {listing.agent.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold text-white text-sm">{listing.agent.name}</p>
                      <p className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.55)' }}>Hostel Agent</p>
                    </div>
                  </div>

                  {/* Price reminder */}
                  <div className="rounded-xl p-3 mb-5" style={{ backgroundColor: 'rgba(255,255,255,0.08)' }}>
                    <p className="text-xs font-medium mb-0.5" style={{ color: 'rgba(255,255,255,0.55)' }}>Annual rent</p>
                    <p className="text-xl font-black" style={{ color: '#37D76A' }}>₦{listing.price.toLocaleString()}</p>
                    <p className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.55)' }}>{listing.rooms} room{listing.rooms !== 1 ? 's' : ''} available</p>
                  </div>

                  {/* WhatsApp button */}
                  <a
                    href={`https://wa.me/${listing.agent.whatsapp}?text=Hi, I found your hostel "${listing.name}" on Hostel Finder. I'm interested in a room. Is it still available?`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl font-bold text-sm mb-3 transition-opacity hover:opacity-90"
                    style={{ backgroundColor: '#37D76A', color: '#034338' }}
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                    </svg>
                    WhatsApp Agent
                  </a>

                  {/* Call button */}
                  <button
                    onClick={handleCopyPhone}
                    className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl font-bold text-sm transition-all border"
                    style={{
                      backgroundColor: 'transparent',
                      color: copied ? '#37D76A' : '#FFFFFF',
                      borderColor: copied ? '#37D76A' : 'rgba(255,255,255,0.25)',
                    }}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    {copied ? 'Number copied!' : `Call ${listing.agent.phone}`}
                  </button>
                </div>
              </div>

              {/* Safety note */}
              <div className="rounded-xl p-4" style={{ backgroundColor: '#E8F5EE' }}>
                <p className="text-xs font-medium leading-relaxed" style={{ color: '#3D6058' }}>
                  <span className="font-bold" style={{ color: '#034338' }}>Stay safe.</span> Always visit the hostel in person before making any payment. Never transfer money without seeing the room first.
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* ── Footer ── */}
      <footer style={{ backgroundColor: '#034338' }} className="py-10 px-4 sm:px-6">
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
