import Link from 'next/link'
import Image from 'next/image'
import Navbar from '@/components/Navbar'

const featuredListings = [
  {
    id: '1',
    name: 'Sunview Hostel',
    area: 'Oye Town',
    distance: '5 mins walk',
    price: 120000,
    roomType: 'Self-contain',
    rooms: 4,
    slug: 'sunview-hostel',
    color: '#1a4a3a',
  },
  {
    id: '2',
    name: 'Grace Court Lodge',
    area: 'Ikole Road',
    distance: '10 mins walk',
    price: 80000,
    roomType: 'Single Room',
    rooms: 6,
    slug: 'grace-court-lodge',
    color: '#2d5a3d',
  },
  {
    id: '3',
    name: 'Favour Hostel',
    area: 'Behind Campus',
    distance: 'Walking distance',
    price: 65000,
    roomType: 'Shared Room',
    rooms: 8,
    slug: 'favour-hostel',
    color: '#1e3a2f',
  },
  {
    id: '4',
    name: 'Royal Suites',
    area: 'Oye Town',
    distance: '5 mins walk',
    price: 180000,
    roomType: 'Mini Flat',
    rooms: 2,
    slug: 'royal-suites',
    color: '#0f2d24',
  },
  {
    id: '5',
    name: 'Campus View Hostel',
    area: 'School Road',
    distance: 'Walking distance',
    price: 95000,
    roomType: 'Self-contain',
    rooms: 5,
    slug: 'campus-view-hostel',
    color: '#234d3a',
  },
  {
    id: '6',
    name: 'Peace Haven',
    area: 'Ikole Road',
    distance: '15 mins walk',
    price: 55000,
    roomType: 'Single Room',
    rooms: 10,
    slug: 'peace-haven',
    color: '#163028',
  },
]

const roomTypeBadge: Record<string, { bg: string; text: string }> = {
  'Self-contain': { bg: '#DCFCE7', text: '#166534' },
  'Single Room':  { bg: '#DBEAFE', text: '#1E40AF' },
  'Shared Room':  { bg: '#FEF3C7', text: '#92400E' },
  'Mini Flat':    { bg: '#EDE9FE', text: '#5B21B6' },
}

export default function HomePage() {
  return (
    <div className="min-h-screen">

      {/* ── Navbar ── */}
      <Navbar />

      {/* ── Hero ── */}
      <section style={{ backgroundColor: '#034338' }} className="relative overflow-hidden pt-16 pb-24 px-4 sm:px-6">
        <div
          className="absolute inset-0 opacity-[0.06] pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='64' height='64' viewBox='0 0 64 64' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='28' cy='28' r='12' stroke='%2337D76A' stroke-width='3' fill='none'/%3E%3Cline x1='37' y1='37' x2='50' y2='50' stroke='%2337D76A' stroke-width='3' stroke-linecap='round'/%3E%3C/svg%3E")`,
            backgroundSize: '64px 64px',
          }}
        />
        <div className="relative max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-8 text-sm font-semibold border border-white/25 text-white/90">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: '#37D76A' }} />
            Now live at FUOYE
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-[3.75rem] font-black text-white leading-[1.1] tracking-tight mb-6">
            Discover Your{' '}
            <span style={{ color: '#37D76A' }}>Perfect Home</span>{' '}
            Away From Home.
          </h1>
          <p className="text-white/80 text-lg max-w-lg mx-auto mb-10 leading-relaxed">
            Browse verified off-campus hostels near FUOYE — real photos, clear prices, and direct agent contact.
          </p>
          <div className="bg-white rounded-2xl p-2 flex flex-col sm:flex-row gap-2 max-w-xl mx-auto shadow-2xl shadow-black/30">
            <div className="flex-1 flex items-center gap-3 px-4 py-2">
              <svg className="w-4 h-4 shrink-0 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search by area or hostel name..."
                className="flex-1 text-sm outline-none bg-transparent text-[#0A2A23] placeholder-gray-400"
              />
            </div>
            <Link
              href="/listings"
              style={{ backgroundColor: '#37D76A' }}
              className="text-[#034338] font-bold text-sm px-6 py-3.5 rounded-xl hover:opacity-90 transition-opacity text-center whitespace-nowrap"
            >
              Find Hostels
            </Link>
          </div>
          <div className="flex flex-wrap justify-center gap-2 mt-5">
            {['All', 'Self-contain', 'Single Room', 'Shared Room', 'Mini Flat'].map((type, i) => (
              <button
                key={type}
                className="px-4 py-1.5 rounded-full text-sm font-semibold transition-all"
                style={
                  i === 0
                    ? { backgroundColor: '#37D76A', color: '#034338' }
                    : { backgroundColor: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.85)' }
                }
              >
                {type}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── Stats bar ── */}
      <div className="border-b" style={{ backgroundColor: '#F4F6F5', borderColor: '#E8EDEB' }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-5 grid grid-cols-3 gap-4 text-center">
          {[
            { value: '50+', label: 'Active listings' },
            { value: 'FUOYE', label: 'Campus served' },
            { value: 'Free', label: 'For students' },
          ].map((s) => (
            <div key={s.label}>
              <div className="text-xl sm:text-2xl font-black" style={{ color: '#034338' }}>{s.value}</div>
              <div className="text-xs sm:text-sm mt-0.5 font-medium" style={{ color: '#4B6B62' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── How it works ── */}
      <section className="py-20 px-4 sm:px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-2xl sm:text-3xl font-black" style={{ color: '#0A2A23' }}>How it works</h2>
            <p className="mt-2 text-sm font-medium" style={{ color: '#4B6B62' }}>Find your hostel in three simple steps</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-10">
            {[
              {
                step: '01', title: 'Search',
                desc: 'Enter your preferred area near FUOYE or filter by price, room type, and distance from campus.',
                icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />,
              },
              {
                step: '02', title: 'Browse',
                desc: 'View real photos, compare prices, and check facilities for each hostel before reaching out.',
                icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h7" />,
              },
              {
                step: '03', title: 'Contact',
                desc: 'Reach the agent directly via WhatsApp or phone call. No middlemen, no hidden fees.',
                icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />,
              },
            ].map((item) => (
              <div key={item.step} className="flex flex-col gap-4">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ backgroundColor: '#E8F5EE' }}>
                  <svg className="w-6 h-6" style={{ color: '#034338' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {item.icon}
                  </svg>
                </div>
                <div>
                  <div className="text-xs font-black tracking-widest mb-1" style={{ color: '#37D76A' }}>STEP {item.step}</div>
                  <h3 className="text-lg font-bold mb-2" style={{ color: '#0A2A23' }}>{item.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: '#3D6058' }}>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Featured listings ── */}
      <section className="py-20 px-4 sm:px-6" style={{ backgroundColor: '#F4F6F5' }}>
        <div className="max-w-6xl mx-auto">
          <div className="flex items-end justify-between mb-10">
            <div>
              <h2 className="text-2xl sm:text-3xl font-black" style={{ color: '#0A2A23' }}>Recent listings</h2>
              <p className="mt-1 text-sm font-medium" style={{ color: '#4B6B62' }}>Verified hostels near FUOYE</p>
            </div>
            <Link href="/listings" className="text-sm font-bold hover:text-[#37D76A] transition-colors" style={{ color: '#034338' }}>
              View all →
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {featuredListings.map((listing) => (
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
        </div>
      </section>

      {/* ── Agent CTA ── */}
      <section style={{ backgroundColor: '#37D76A' }} className="py-16 px-4 sm:px-6">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-black mb-3" style={{ color: '#034338' }}>
            Have rooms to rent?
          </h2>
          <p className="mb-8 text-base max-w-md mx-auto leading-relaxed font-medium" style={{ color: '#035040' }}>
            List your hostel for free and reach hundreds of FUOYE students actively searching for accommodation.
          </p>
          <Link
            href="/register"
            style={{ backgroundColor: '#034338', color: '#FFFFFF' }}
            className="inline-flex items-center gap-2 text-white font-bold px-8 py-4 rounded-full hover:opacity-90 transition-opacity text-sm"
          >
            List your hostel — it's free
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>
      </section>

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
            ].map((link) => (
              <Link key={link.href} href={link.href} className="hover:text-white transition-colors">
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </footer>

    </div>
  )
}
