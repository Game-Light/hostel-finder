import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Hostel Finder — Find Student Hostels Near FUOYE',
  description: 'Discover affordable off-campus hostels near Federal University Oye-Ekiti. Browse listings with real photos, prices, and agent contacts.',
  openGraph: {
    title: 'Hostel Finder',
    description: 'Find student hostels near FUOYE',
    images: ['/logo/og-image.png'],
    type: 'website',
  },
  icons: {
  icon: '/logo/favicon.svg',
  apple: '/logo/apple-touch-icon.svg',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="min-h-screen font-sans" suppressHydrationWarning>
        {children}
      </body>
    </html>
  )
}