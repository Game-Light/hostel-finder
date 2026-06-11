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
            Have a question, suggestion, or issue? We're here to help.
          </p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-16">

        {/* Contact options */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
          {[
            {
              icon: '💬',
              title: 'WhatsApp',
              desc: 'Fastest response. Message us directly.',
              action: 'Chat on WhatsApp',
              href: 'https://wa.me/2349122781346?text=Hi, I have a question about Hostel Finder.',
              primary: true,
            },
            {
              icon: '📧',
              title: 'Email',
              desc: 'For detailed enquiries and partnership requests.',
              action: 'Send an email',
              href: 'mailto:hello@hostelfinder.com.ng',
              primary: false,
            },
          ].map(item => (
            <div key={item.title} className="bg-white rounded-2xl p-6 shadow-sm flex flex-col gap-4">
              <span className="text-3xl">{item.icon}</span>
              <div>
                <h3 className="font-black text-base mb-1" style={{ color: '#0A2A23' }}>{item.title}</h3>
                <p className="text-sm font-medium" style={{ color: '#4B6B62' }}>{item.desc}</p>
              </div>
              <a
                href={item.href}
                target={item.href.startsWith('http') ? '_blank' : undefined}
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center py-3 rounded-xl font-bold text-sm transition-opacity hover:opacity-90 mt-auto"
                style={item.primary
                  ? { backgroundColor: '#37D76A', color: '#034338' }
                  : { backgroundColor: '#034338', color: '#FFFFFF' }
                }
              >
                {item.action}
              </a>
            </div>
          ))}
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
                a: 'Create a free agent account, go to your dashboard, and click "Add new listing". Your listing goes live after a quick review.',
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
                a: 'Contact us on WhatsApp or email with the listing name and the issue. We take fraud reports seriously and act fast.',
              },
            ].map(item => (
              <div key={item.q} className="border-b pb-5 last:border-0 last:pb-0" style={{ borderColor: '#E8EDEB' }}>
                <h3 className="text-sm font-bold mb-1.5" style={{ color: '#0A2A23' }}>{item.q}</h3>
                <p className="text-sm leading-relaxed" style={{ color: '#3D6058' }}>{item.a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* For agents */}
        <div className="rounded-2xl p-8 text-center" style={{ backgroundColor: '#034338' }}>
          <h2 className="text-lg font-black text-white mb-2">Want to list your hostel?</h2>
          <p className="text-sm font-medium mb-6" style={{ color: 'rgba(255,255,255,0.7)' }}>
            Join agents already reaching FUOYE students on Hostel Finder.
          </p>
          <Link href="/register"
            className="inline-flex items-center gap-2 font-bold text-sm px-6 py-3 rounded-full hover:opacity-90 transition-opacity"
            style={{ backgroundColor: '#37D76A', color: '#034338' }}>
            Create agent account →
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
