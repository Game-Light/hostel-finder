import Link from 'next/link'
import Image from 'next/image'
import Navbar from '@/components/Navbar'

export const metadata = {
  title: 'Contact — Hostel Finder',
  description: 'Get in touch with the Hostel Finder team.',
}

export default function ContactPage() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F4F6F5' }}>
      <Navbar />

      {/* Header */}
      <div style={{ backgroundColor: '#034338' }} className="px-4 sm:px-6 py-16">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-3xl sm:text-4xl font-black text-white mb-4">Get in touch</h1>
          <p className="text-base font-medium" style={{ color: 'rgba(255,255,255,0.7)' }}>
            Have a question, suggestion, or issue? We are here to help.
          </p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-16">

        {/* Contact options */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
          <div className="bg-white rounded-2xl p-6 shadow-sm flex flex-col gap-4">
            <span className="text-3xl">💬</span>
            <div>
              <h3 className="font-black text-base mb-1" style={{ color: '#0A2A23' }}>WhatsApp</h3>
              <p className="text-sm font-medium" style={{ color: '#4B6B62' }}>
                Fastest response. Message us directly.
              </p>
            </div>
            <a
              href="https://wa.me/2349122781346?text=Hi, I have a question about Hostel Finder."
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center py-3 rounded-xl font-bold text-sm hover:opacity-90 transition-opacity mt-auto"
              style={{ backgroundColor: '#37D76A', color: '#034338' }}
            >
              Chat on WhatsApp
            </a>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm flex flex-col gap-4">
            <span className="text-3xl">📧</span>
            <div>
              <h3 className="font-black text-base mb-1" style={{ color: '#0A2A23' }}>Email</h3>
              <p className="text-sm font-medium" style={{ color: '#4B6B62' }}>
                For detailed enquiries and partnerships.
              </p>
            </div>
            <a
              href="mailto:hello@hostelfinder.com.ng"
              className="flex items-center justify-center py-3 rounded-xl font-bold text-sm hover:opacity-90 transition-opacity mt-auto"
              style={{ backgroundColor: '#034338', color: '#FFFFFF' }}
            >
              Send an email
            </a>
          </div>
        </div>

        {/* Agent listing code note */}
        <div className="rounded-2xl p-5 mb-8 flex items-start gap-3" style={{ backgroundColor: '#E8F5EE' }}>
          <span className="text-xl mt-0.5">🏠</span>
          <div>
            <p className="text-sm font-bold mb-0.5" style={{ color: '#034338' }}>Want to list your hostel?</p>
            <p className="text-sm font-medium" style={{ color: '#3D6058' }}>
              Contact us on WhatsApp to get your agent invite code and start listing for free.
            </p>
          </div>
        </div>

        {/* FAQ */}
        <div className="bg-white rounded-2xl p-8 shadow-sm mb-10">
          <h2 className="text-lg font-black mb-6" style={{ color: '#0A2A23' }}>Common questions</h2>
          <div className="flex flex-col gap-5">
            {[
              {
                q: 'Is Hostel Finder free for students?',
                a: 'Yes, completely. Students never pay anything to browse listings, view photos, or contact agents.',
              },
              {
                q: 'How do I list my hostel?',
                a: 'Contact us on WhatsApp to get your agent invite code. Then create an agent account, go to your dashboard, and click "Add new listing".',
              },
              {
                q: 'How long does listing approval take?',
                a: 'Usually within 24 hours. We review every listing to make sure it meets our quality standards.',
              },
              {
                q: 'My listing is showing wrong information. How do I fix it?',
                a: 'Log in to your agent dashboard and click "Edit" on the listing. Changes are applied immediately.',
              },
              {
                q: 'I found a fraudulent listing. How do I report it?',
                a: 'Contact us on WhatsApp with the listing name and the issue. We take fraud reports seriously and act fast.',
              },
            ].map(item => (
              <div key={item.q} className="border-b pb-5 last:border-0 last:pb-0" style={{ borderColor: '#E8EDEB' }}>
                <h3 className="text-sm font-bold mb-1.5" style={{ color: '#0A2A23' }}>{item.q}</h3>
                <p className="text-sm leading-relaxed" style={{ color: '#3D6058' }}>{item.a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="rounded-2xl p-8 text-center" style={{ backgroundColor: '#034338' }}>
          <h2 className="text-lg font-black text-white mb-2">Ready to find your hostel?</h2>
          <p className="text-sm font-medium mb-6" style={{ color: 'rgba(255,255,255,0.7)' }}>
            Browse verified hostels near FUOYE for free.
          </p>
          <Link
            href="/listings"
            className="inline-flex items-center gap-2 font-bold text-sm px-6 py-3 rounded-full hover:opacity-90 transition-opacity"
            style={{ backgroundColor: '#37D76A', color: '#034338' }}
          >
            Browse hostels
          </Link>
        </div>
      </div>

      {/* Footer */}
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
              { label: 'Privacy', href: '/privacy' },
            ].map(link => (
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
