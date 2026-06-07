import Link from 'next/link'
import Image from 'next/image'

export default function CheckEmailPage() {
  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#F4F6F5' }}>

      {/* Header */}
      <div style={{ backgroundColor: '#034338' }} className="px-4 py-4 border-b border-white/10">
        <div className="max-w-6xl mx-auto">
          <Link href="/">
            <Image src="/logo/Logo-horizontal.svg" alt="Hostel Finder" width={130} height={34} />
          </Link>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md text-center">

          {/* Email icon */}
          <div
            className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6"
            style={{ backgroundColor: '#E8F5EE' }}
          >
            <svg className="w-10 h-10" style={{ color: '#034338' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>

          <h1 className="text-2xl font-black mb-3" style={{ color: '#0A2A23' }}>
            Check your email
          </h1>
          <p className="text-sm font-medium leading-relaxed mb-2" style={{ color: '#4B6B62' }}>
            We sent a confirmation link to your email address.
          </p>
          <p className="text-sm font-medium leading-relaxed mb-8" style={{ color: '#4B6B62' }}>
            Click the link in the email to activate your account and start using Hostel Finder.
          </p>

          {/* Steps */}
          <div className="bg-white rounded-2xl p-5 mb-8 text-left shadow-sm">
            {[
              { step: '1', text: 'Open your email inbox' },
              { step: '2', text: 'Find the email from Hostel Finder' },
              { step: '3', text: 'Click the "Confirm your account" link' },
            ].map(item => (
              <div key={item.step} className="flex items-center gap-3 py-2.5">
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black shrink-0"
                  style={{ backgroundColor: '#034338', color: '#FFFFFF' }}
                >
                  {item.step}
                </div>
                <p className="text-sm font-medium" style={{ color: '#0A2A23' }}>{item.text}</p>
              </div>
            ))}
          </div>

          {/* Actions */}
          <Link
            href="/login"
            className="inline-flex items-center justify-center w-full py-3.5 rounded-xl font-bold text-sm text-white mb-3 hover:opacity-90 transition-opacity"
            style={{ backgroundColor: '#034338' }}
          >
            Go to login
          </Link>

          <p className="text-xs font-medium" style={{ color: '#4B6B62' }}>
            Didn't get the email? Check your spam folder or{' '}
            <Link href="/register" className="font-bold hover:underline" style={{ color: '#034338' }}>
              try again
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
