import Link from 'next/link'
import Image from 'next/image'
import Navbar from '@/components/Navbar'

export const metadata = {
  title: 'About — Hostel Finder',
  description: 'Learn about Hostel Finder — the platform connecting FUOYE students with verified off-campus hostels.',
}

export default function AboutPage() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F4F6F5' }}>
      <Navbar />

      {/* Hero */}
      <div style={{ backgroundColor: '#034338' }} className="px-4 sm:px-6 py-16">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-3xl sm:text-4xl font-black text-white mb-4">
            Built for FUOYE students.<br />
            <span style={{ color: '#37D76A' }}>By someone who gets it.</span>
          </h1>
          <p className="text-base font-medium max-w-xl mx-auto" style={{ color: 'rgba(255,255,255,0.7)' }}>
            Hostel Finder was built to solve one of the most stressful parts of university life in Nigeria — finding a safe, affordable place to live near campus.
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16">

        {/* The problem */}
        <div className="bg-white rounded-2xl p-8 shadow-sm mb-6">
          <h2 className="text-xl font-black mb-4" style={{ color: '#0A2A23' }}>The problem we're solving</h2>
          <p className="text-sm leading-relaxed mb-4" style={{ color: '#3D6058' }}>
            Every year, thousands of students arrive at FUOYE with no reliable way to find off-campus accommodation. They rely on word-of-mouth, WhatsApp broadcasts, handwritten notices, and tips from seniors — none of which are dependable or complete.
          </p>
          <p className="text-sm leading-relaxed" style={{ color: '#3D6058' }}>
            At the same time, hostel agents and landlords near campus have no dedicated digital channel to reach students. They miss serious prospects daily while rooms sit empty.
          </p>
        </div>

        {/* What we do */}
        <div className="bg-white rounded-2xl p-8 shadow-sm mb-6">
          <h2 className="text-xl font-black mb-4" style={{ color: '#0A2A23' }}>What Hostel Finder does</h2>
          <div className="flex flex-col gap-4">
            {[
              { icon: '🔍', title: 'One place to search', desc: 'Students can browse all available hostels near FUOYE in one place — with real photos, clear prices, and honest descriptions.' },
              { icon: '📞', title: 'Direct agent contact', desc: 'No middlemen. Students connect directly with hostel agents via WhatsApp or phone call.' },
              { icon: '🆓', title: 'Free for students, always', desc: 'Students never pay to use Hostel Finder. Revenue comes entirely from agents who list their properties.' },
              { icon: '✅', title: 'Verified listings only', desc: 'Every listing goes through a review before going live. No fake addresses, no misleading photos.' },
            ].map(item => (
              <div key={item.title} className="flex items-start gap-4">
                <span className="text-2xl mt-0.5">{item.icon}</span>
                <div>
                  <h3 className="text-sm font-bold mb-1" style={{ color: '#0A2A23' }}>{item.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: '#3D6058' }}>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Mission */}
        <div className="rounded-2xl p-8 mb-6" style={{ backgroundColor: '#034338' }}>
          <h2 className="text-xl font-black text-white mb-3">Our mission</h2>
          <p className="text-base font-medium leading-relaxed" style={{ color: 'rgba(255,255,255,0.8)' }}>
            To make finding student accommodation near Nigerian universities as simple and trustworthy as it should be — starting with FUOYE, and expanding to every campus in Nigeria.
          </p>
        </div>

        {/* For agents */}
        <div className="bg-white rounded-2xl p-8 shadow-sm mb-10">
          <h2 className="text-xl font-black mb-4" style={{ color: '#0A2A23' }}>For hostel agents</h2>
          <p className="text-sm leading-relaxed mb-6" style={{ color: '#3D6058' }}>
            Hostel Finder gives agents a free digital presence to reach students exactly when they're looking. List your hostel, upload photos, and start getting enquiries — no technical knowledge needed.
          </p>
          <Link href="/register"
             className="inline-flex items-center gap-2 font-bold text-sm px-6 py-3 rounded-full hover:opacity-90 transition-opacity"
             style={{ backgroundColor: '#37D76A', color: '#034338' }}>
            List your hostel free →
          </Link>
        </div>

        {/* Contact CTA */}
        <div className="text-center">
          <p className="text-sm font-medium mb-2" style={{ color: '#4B6B62' }}>Have questions or feedback?</p>
          <Link href="/contact" className="text-sm font-bold hover:underline" style={{ color: '#034338' }}>
            Get in touch →
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer style={{ backgroundColor: '#034338' }} className="py-10 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <Image src="/logo/Logo-horizontal.svg" alt="Hostel Finder" width={120} height={32} />
            <p className="text-xs mt-2 font-medium" style={{ color: 'rgba(255,255,255,0.5)' }}>© 2026 Hostel Finder. All rights reserved.</p>
          </div>
          <div className="flex items-center gap-6 text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.75)' }}>
            {[{ label: 'Browse', href: '/listings' }, { label: 'About', href: '/about' }, { label: 'Contact', href: '/contact' }, { label: 'Privacy', href: '/privacy' }].map(link => (
              <Link key={link.href} href={link.href} className="hover:text-white transition-colors">{link.label}</Link>
            ))}
          </div>
        </div>
      </footer>
    </div>
  )
}
