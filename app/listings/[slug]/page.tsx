'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useParams } from 'next/navigation'
import Navbar from '@/components/Navbar'
import { supabase } from '@/lib/supabase'

interface Photo { photo_url: string; is_cover: boolean; sort_order: number }
interface ListingDetail {
  id: string; name: string; description: string; area: string
  distance_tag: string; price: number; room_type: string
  rooms_available: number; facilities: string[]; whatsapp_number: string
  video_url: string | null; slug: string; views: number; address: string | null
  status: string
  listing_photos: Photo[]
  users: { full_name: string; phone: string | null }
}

const roomTypeMap: Record<string, string> = {
  self_contain: 'Self-contain', single: 'Single Room',
  shared: 'Shared Room',       mini_flat: 'Mini Flat',
}
const roomTypeBadge: Record<string, { bg: string; text: string }> = {
  'Self-contain': { bg: '#DCFCE7', text: '#166534' },
  'Single Room':  { bg: '#DBEAFE', text: '#1E40AF' },
  'Shared Room':  { bg: '#FEF3C7', text: '#92400E' },
  'Mini Flat':    { bg: '#EDE9FE', text: '#5B21B6' },
}
const facilityIcons: Record<string, string> = {
  'Running water': '💧', '24hr electricity': '⚡', 'Prepaid meter': '🔌',
  'Security': '🔒', 'Parking': '🚗', 'Wi-Fi': '📶',
  'Fence/gate': '🏠', 'Borehole': '🚰',
}

export default function HostelDetailPage() {
  const params = useParams()
  const slug = params.slug as string

  const [listing, setListing]     = useState<ListingDetail | null>(null)
  const [similar, setSimilar]     = useState<ListingDetail[]>([])
  const [loading, setLoading]     = useState(true)
  const [notFound, setNotFound]   = useState(false)
  const [activeMedia, setActiveMedia] = useState(0)
  const [copied, setCopied]       = useState(false)
  const [lightbox, setLightbox]   = useState(false)

  const fetchListing = useCallback(async () => {
    setLoading(true)
    setActiveMedia(0)

    const { data } = await supabase
      .from('listings')
      .select('*, listing_photos(photo_url, is_cover, sort_order), users(full_name, phone)')
      .eq('slug', slug)

      .single()

    if (!data) { setNotFound(true); setLoading(false); return }
    data.listing_photos = [...(data.listing_photos || [])].sort(
      (a: Photo, b: Photo) => a.sort_order - b.sort_order
    )
    setListing(data)

    const { data: sim } = await supabase
      .from('listings')
      .select('*, listing_photos(photo_url, is_cover, sort_order), users(full_name, phone)')
      .eq('status', 'active').eq('room_type', data.room_type)
      .neq('slug', slug).gt('rooms_available', 0).limit(3)
    setSimilar(sim || [])
    setLoading(false)
  }, [slug])

  useEffect(() => { fetchListing() }, [fetchListing])

  // Refetch when tab regains focus (fixes back-navigation stale data)
  useEffect(() => {
    const onFocus = () => fetchListing()
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [fetchListing])

  // Increment views
  useEffect(() => {
    if (!listing?.id) return
    supabase.from('listings').update({ views: (listing.views || 0) + 1 }).eq('id', listing.id)
  }, [listing?.id])

  // Lightbox keyboard nav
  useEffect(() => {
    if (!lightbox) return
    const photos = listing?.listing_photos || []
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightbox(false)
      if (e.key === 'ArrowRight') setActiveMedia(p => Math.min(p + 1, photos.length - 1))
      if (e.key === 'ArrowLeft')  setActiveMedia(p => Math.max(p - 1, 0))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [lightbox, listing])

  const handleCopyPhone = () => {
    if (!listing) return
    navigator.clipboard.writeText(listing.whatsapp_number || listing.users?.phone || '')
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) return (
    <div className="min-h-screen" style={{ backgroundColor: '#F4F6F5' }}>
      <Navbar />
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 rounded-full border-4 border-t-transparent animate-spin" style={{ borderColor: '#034338', borderTopColor: 'transparent' }} />
      </div>
    </div>
  )

  if (notFound || !listing) return (
    <div className="min-h-screen" style={{ backgroundColor: '#F4F6F5' }}>
      <Navbar />
      <div className="flex items-center justify-center h-64 text-center px-4">
        <div>
          <h1 className="text-2xl font-black mb-2" style={{ color: '#0A2A23' }}>Hostel not found</h1>
          <p className="text-sm mb-6" style={{ color: '#4B6B62' }}>This listing may have been removed.</p>
          <Link href="/listings" className="font-bold text-sm px-6 py-3 rounded-full text-white" style={{ backgroundColor: '#034338' }}>Browse all listings</Link>
        </div>
      </div>
    </div>
  )

  const label = roomTypeMap[listing.room_type] || listing.room_type
  const badge = roomTypeBadge[label] || { bg: '#F4F6F5', text: '#4B6B62' }
  const photos = listing.listing_photos || []
  const hasVideo = !!listing.video_url
  const totalMedia = photos.length + (hasVideo ? 1 : 0)
  const isActiveVideo = hasVideo && activeMedia === photos.length
  const whatsappNumber = listing.whatsapp_number?.replace(/^0/, '234') || ''
  const whatsappMessage = encodeURIComponent(`Hi, I found your hostel "${listing.name}" on Hostel Finder. I'm interested in a room. Is it still available?`)

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F4F6F5' }}>
      <Navbar />

      {/* ── Lightbox ── */}
      {lightbox && photos[activeMedia] && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center"
          style={{ backgroundColor: 'rgba(0,0,0,0.92)' }}
          onClick={() => setLightbox(false)}
        >
          {/* Close */}
          <button className="absolute top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center text-white hover:bg-white/10 transition-colors z-10"
            onClick={() => setLightbox(false)}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Counter */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 text-white/60 text-sm font-medium">
            {activeMedia + 1} / {photos.length}
          </div>

          {/* Prev */}
          {activeMedia > 0 && (
            <button
              className="absolute left-4 w-10 h-10 rounded-full flex items-center justify-center text-white hover:bg-white/10 transition-colors"
              onClick={e => { e.stopPropagation(); setActiveMedia(p => p - 1) }}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}

          {/* Image */}
          <img
            src={photos[activeMedia].photo_url}
            alt={listing.name}
            className="max-w-[90vw] max-h-[85vh] object-contain rounded-xl"
            onClick={e => e.stopPropagation()}
          />

          {/* Next */}
          {activeMedia < photos.length - 1 && (
            <button
              className="absolute right-4 w-10 h-10 rounded-full flex items-center justify-center text-white hover:bg-white/10 transition-colors"
              onClick={e => { e.stopPropagation(); setActiveMedia(p => p + 1) }}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}

          {/* Thumbnail strip */}
          {photos.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
              {photos.map((_, i) => (
                <button key={i} onClick={e => { e.stopPropagation(); setActiveMedia(i) }}
                  className="w-2 h-2 rounded-full transition-all"
                  style={{ backgroundColor: i === activeMedia ? '#37D76A' : 'rgba(255,255,255,0.4)' }} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Breadcrumb */}
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

          {/* Left column */}
          <div className="flex-1 min-w-0">

            {/* Media gallery */}
            <div className="bg-white rounded-2xl overflow-hidden shadow-sm mb-6">
              <div className="h-64 sm:h-80 relative overflow-hidden group" style={{ backgroundColor: '#1a4a3a' }}>
                {isActiveVideo ? (
                  <video src={listing.video_url!} controls className="w-full h-full object-contain" />
                ) : photos[activeMedia] ? (
                  <>
                    <img src={photos[activeMedia].photo_url} alt={listing.name} className="w-full h-full object-cover cursor-zoom-in" onClick={() => setLightbox(true)} />
                    {/* Fullscreen icon */}
                    <button
                      onClick={() => setLightbox(true)}
                      className="absolute top-3 right-3 w-9 h-9 rounded-lg flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 cursor-pointer"
                      style={{ backgroundColor: 'rgba(0,0,0,0.5)', color: '#FFFFFF' }}
                      title="View full size"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                      </svg>
                    </button>
                  </>
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center opacity-10">
                    <svg className="w-24 h-24 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                )}
                {totalMedia > 0 && (
                  <div className="absolute bottom-3 left-3 bg-black/40 text-white text-xs font-semibold px-2.5 py-1 rounded-full">
                    {activeMedia + 1} / {totalMedia}
                  </div>
                )}
              </div>

              {totalMedia > 1 && (
                <div className="flex gap-2 p-3 overflow-x-auto">
                  {photos.map((photo, i) => (
                    <button key={i} onClick={() => setActiveMedia(i)}
                      className="shrink-0 w-16 h-12 rounded-lg overflow-hidden transition-all cursor-pointer"
                      style={{ outline: activeMedia === i ? '2px solid #37D76A' : '2px solid transparent', outlineOffset: '2px' }}>
                      <img src={photo.photo_url} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                  {hasVideo && (
                    <button onClick={() => setActiveMedia(photos.length)}
                      className="shrink-0 w-16 h-12 rounded-lg flex items-center justify-center cursor-pointer transition-all"
                      style={{ backgroundColor: '#034338', outline: isActiveVideo ? '2px solid #37D76A' : '2px solid transparent', outlineOffset: '2px' }}>
                      <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Pending/inactive banner */}
            {listing.status !== 'active' && (
              <div className="flex items-center gap-3 px-4 py-3 rounded-xl mb-4 text-sm font-medium" style={{ backgroundColor: listing.status === 'pending' ? '#FEF3C7' : '#F3F4F6', color: listing.status === 'pending' ? '#92400E' : '#6B7280' }}>
                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                {listing.status === 'pending' ? 'This listing is pending review and not yet visible to students.' : 'This listing is inactive and not visible to students.'}
              </div>
            )}
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
                    {listing.area} · {listing.distance_tag} to FUOYE main gate
                  </div>
                </div>
                <span className="text-sm font-bold px-3 py-1.5 rounded-full" style={{ backgroundColor: badge.bg, color: badge.text }}>{label}</span>
              </div>

              <div className="grid grid-cols-3 gap-3 mb-6">
                {[
                  { label: 'Price / year', value: `₦${listing.price.toLocaleString()}` },
                  { label: 'Rooms left', value: listing.rooms_available > 0 ? `${listing.rooms_available} rooms` : 'No vacancy' },
                  { label: 'Room type', value: label },
                ].map(stat => (
                  <div key={stat.label} className="rounded-xl p-3 text-center" style={{ backgroundColor: '#F4F6F5' }}>
                    <div className="text-base font-black" style={{ color: listing.rooms_available === 0 && stat.label === 'Rooms left' ? '#DC2626' : '#034338' }}>{stat.value}</div>
                    <div className="text-xs font-medium mt-0.5" style={{ color: '#4B6B62' }}>{stat.label}</div>
                  </div>
                ))}
              </div>

              <h2 className="text-base font-bold mb-2" style={{ color: '#0A2A23' }}>About this hostel</h2>
              <p className="text-sm leading-relaxed" style={{ color: '#3D6058' }}>{listing.description}</p>
            </div>

            {/* Facilities */}
            {listing.facilities?.length > 0 && (
              <div className="bg-white rounded-2xl p-6 shadow-sm mb-6">
                <h2 className="text-base font-bold mb-4" style={{ color: '#0A2A23' }}>Facilities</h2>
                <div className="flex flex-wrap gap-2">
                  {listing.facilities.map(f => (
                    <div key={f} className="flex items-center gap-2 text-sm font-medium px-3 py-2 rounded-xl" style={{ backgroundColor: '#F4F6F5', color: '#0A2A23' }}>
                      <span>{facilityIcons[f] || '✓'}</span>{f}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Similar listings */}
            {similar.length > 0 && (
              <div>
                <h2 className="text-lg font-black mb-4" style={{ color: '#0A2A23' }}>Similar listings</h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {similar.map(l => {
                    const cover = l.listing_photos?.find(p => p.is_cover) || l.listing_photos?.[0]
                    return (
                      <Link href={`/listings/${l.slug}`} key={l.id}
                        className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                        <div className="h-28 relative overflow-hidden" style={{ backgroundColor: '#1a4a3a' }}>
                          {cover && <img src={cover.photo_url} alt={l.name} className="w-full h-full object-cover" />}
                          <div className="absolute top-2 left-2">
                            <span className="text-xs font-black px-2 py-1 rounded-full" style={{ backgroundColor: '#37D76A', color: '#034338' }}>
                              ₦{l.price.toLocaleString()}/yr
                            </span>
                          </div>
                        </div>
                        <div className="p-3">
                          <p className="font-bold text-sm mb-1" style={{ color: '#0A2A23' }}>{l.name}</p>
                          <p className="text-xs font-medium" style={{ color: '#4B6B62' }}>{l.area} · {l.distance_tag}</p>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Agent card */}
          <div className="w-full lg:w-72 shrink-0">
            <div className="sticky top-24">
              <div className="rounded-2xl overflow-hidden shadow-lg mb-4" style={{ backgroundColor: '#034338' }}>
                <div className="p-5">
                  <p className="text-xs font-bold mb-4" style={{ color: 'rgba(255,255,255,0.55)' }}>LISTED BY</p>
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center font-black text-lg shrink-0" style={{ backgroundColor: '#37D76A', color: '#034338' }}>
                      {(listing.users?.full_name || 'A').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-bold text-white text-sm">{listing.users?.full_name || 'Agent'}</p>
                      <p className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.55)' }}>Hostel Agent</p>
                    </div>
                  </div>
                  <div className="rounded-xl p-3 mb-5" style={{ backgroundColor: 'rgba(255,255,255,0.08)' }}>
                    <p className="text-xs font-medium mb-0.5" style={{ color: 'rgba(255,255,255,0.55)' }}>Annual rent</p>
                    <p className="text-xl font-black" style={{ color: '#37D76A' }}>₦{listing.price.toLocaleString()}</p>
                    <p className="text-xs font-medium" style={{ color: listing.rooms_available === 0 ? '#FCA5A5' : 'rgba(255,255,255,0.55)' }}>
                      {listing.rooms_available === 0 ? 'No rooms available' : `${listing.rooms_available} room${listing.rooms_available !== 1 ? 's' : ''} available`}
                    </p>
                  </div>

                  {listing.rooms_available > 0 ? (
                    <>
                      <a href={`https://wa.me/${whatsappNumber}?text=${whatsappMessage}`} target="_blank" rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl font-bold text-sm mb-3 transition-opacity hover:opacity-90 cursor-pointer"
                        style={{ backgroundColor: '#37D76A', color: '#034338' }}>
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                        </svg>
                        WhatsApp Agent
                      </a>
                      <button onClick={handleCopyPhone} className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl font-bold text-sm transition-all border cursor-pointer"
                        style={{ backgroundColor: 'transparent', color: copied ? '#37D76A' : '#FFFFFF', borderColor: copied ? '#37D76A' : 'rgba(255,255,255,0.25)' }}>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        {copied ? 'Number copied!' : 'Copy phone number'}
                      </button>
                    </>
                  ) : (
                    <div className="w-full py-3.5 rounded-xl font-bold text-sm text-center" style={{ backgroundColor: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.4)' }}>
                      No vacancy at this time
                    </div>
                  )}
                </div>
              </div>
              <div className="rounded-xl p-4" style={{ backgroundColor: '#E8F5EE' }}>
                <p className="text-xs font-medium leading-relaxed" style={{ color: '#3D6058' }}>
                  <span className="font-bold" style={{ color: '#034338' }}>Stay safe.</span> Always visit in person before making any payment.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <footer style={{ backgroundColor: '#034338' }} className="py-10 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <Image src="/logo/Logo-horizontal.svg" alt="Hostel Finder" width={120} height={32} />
            <p className="text-xs mt-2 font-medium" style={{ color: 'rgba(255,255,255,0.5)' }}>© 2026 Hostel Finder. All rights reserved.</p>
          </div>
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
