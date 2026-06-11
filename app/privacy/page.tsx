import Link from 'next/link'
import Image from 'next/image'
import Navbar from '@/components/Navbar'

export const metadata = {
  title: 'Privacy Policy — Hostel Finder',
  description: 'How Hostel Finder collects, uses, and protects your data.',
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F4F6F5' }}>
      <Navbar />

      {/* Header */}
      <div style={{ backgroundColor: '#034338' }} className="px-4 sm:px-6 py-16">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl sm:text-4xl font-black text-white mb-3">Privacy Policy</h1>
          <p className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.6)' }}>
            Last updated: June 2026
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
        <div className="bg-white rounded-2xl p-8 shadow-sm">
          <div className="flex flex-col gap-8 text-sm leading-relaxed" style={{ color: '#3D6058' }}>

            <div>
              <h2 className="text-base font-black mb-3" style={{ color: '#0A2A23' }}>1. Overview</h2>
              <p>
                Hostel Finder ("we", "us", "our") is committed to protecting your privacy. This policy explains what information we collect, how we use it, and your rights regarding your data. By using Hostel Finder, you agree to the practices described here.
              </p>
            </div>

            <div>
              <h2 className="text-base font-black mb-3" style={{ color: '#0A2A23' }}>2. Information we collect</h2>
              <p className="mb-3">We collect the following when you create an account or use our platform:</p>
              <ul className="flex flex-col gap-2 pl-4">
                {[
                  'Name and email address (required for account creation)',
                  'Phone number (required for agent accounts)',
                  'Role selection — student or agent',
                  'Hostel listing details submitted by agents (name, description, photos, location, price)',
                  'Device and browser information collected automatically when you visit the site',
                ].map(item => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: '#37D76A' }} />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h2 className="text-base font-black mb-3" style={{ color: '#0A2A23' }}>3. How we use your information</h2>
              <ul className="flex flex-col gap-2 pl-4">
                {[
                  'To create and manage your account',
                  'To display hostel listings to students browsing the platform',
                  'To allow students to contact agents via WhatsApp or phone',
                  'To send account-related emails (password reset, email verification)',
                  'To improve the platform based on usage patterns',
                ].map(item => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: '#37D76A' }} />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h2 className="text-base font-black mb-3" style={{ color: '#0A2A23' }}>4. Data sharing</h2>
              <p className="mb-3">
                We do not sell your personal data to third parties. Your data is shared only in the following circumstances:
              </p>
              <ul className="flex flex-col gap-2 pl-4">
                {[
                  'Agent contact details (name, phone number) are visible to logged-in users who view a listing — this is necessary for the platform to function',
                  'We use Supabase to store data securely — their privacy policy applies to infrastructure-level data handling',
                  'If required by Nigerian law or a valid legal process',
                ].map(item => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: '#37D76A' }} />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h2 className="text-base font-black mb-3" style={{ color: '#0A2A23' }}>5. Data security</h2>
              <p>
                Your data is stored on Supabase's secure infrastructure with encryption at rest and in transit. We enforce Row-Level Security (RLS) on our database — meaning each user can only access data they are permitted to see. Passwords are never stored in plain text.
              </p>
            </div>

            <div>
              <h2 className="text-base font-black mb-3" style={{ color: '#0A2A23' }}>6. Photos and media</h2>
              <p>
                Photos and videos uploaded by agents are stored on Supabase Storage and are publicly accessible by URL. Do not upload images containing personal or sensitive information beyond what is needed to describe the hostel.
              </p>
            </div>

            <div>
              <h2 className="text-base font-black mb-3" style={{ color: '#0A2A23' }}>7. Your rights</h2>
              <p className="mb-3">You have the right to:</p>
              <ul className="flex flex-col gap-2 pl-4">
                {[
                  'Access the personal data we hold about you',
                  'Request correction of inaccurate data',
                  'Request deletion of your account and associated data',
                  'Withdraw consent at any time by deleting your account',
                ].map(item => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: '#37D76A' }} />
                    {item}
                  </li>
                ))}
              </ul>
              <p className="mt-3">
                To exercise any of these rights, contact us at{' '}
                <a href="mailto:hello@hostelfinder.com.ng" className="font-bold hover:underline" style={{ color: '#034338' }}>
                  hello@hostelfinder.com.ng
                </a>
              </p>
            </div>

            <div>
              <h2 className="text-base font-black mb-3" style={{ color: '#0A2A23' }}>8. Cookies</h2>
              <p>
                Hostel Finder uses only essential session cookies required for authentication. We do not use advertising or tracking cookies.
              </p>
            </div>

            <div>
              <h2 className="text-base font-black mb-3" style={{ color: '#0A2A23' }}>9. Children's privacy</h2>
              <p>
                Hostel Finder is intended for university students aged 16 and above. We do not knowingly collect data from anyone under the age of 16.
              </p>
            </div>

            <div>
              <h2 className="text-base font-black mb-3" style={{ color: '#0A2A23' }}>10. Changes to this policy</h2>
              <p>
                We may update this policy as the platform evolves. We will notify registered users of significant changes via email. Continued use of the platform after changes constitutes acceptance of the updated policy.
              </p>
            </div>

            <div className="pt-4 border-t" style={{ borderColor: '#E8EDEB' }}>
              <p>
                Questions about this policy? Contact us at{' '}
                <a href="mailto:hello@hostelfinder.com.ng" className="font-bold hover:underline" style={{ color: '#034338' }}>
                  hello@hostelfinder.com.ng
                </a>{' '}
                or via <Link href="/contact" className="font-bold hover:underline" style={{ color: '#034338' }}>our contact page</Link>.
              </p>
            </div>
          </div>
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
