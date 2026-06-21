import { createClient } from '@supabase/supabase-js'
import type { Metadata } from 'next'
import HostelDetailClient from './client'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const roomTypeMap: Record<string, string> = {
  self_contain: 'Self-contain', single: 'Single Room',
  shared: 'Shared Room', mini_flat: 'Mini Flat',
}

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params

  const { data } = await supabaseAdmin
    .from('listings')
    .select('name, area, price, room_type, description')
    .eq('slug', slug)
    .single()

  if (!data) return { title: 'Hostel not found — Hostel Finder' }

  const label = roomTypeMap[data.room_type] || data.room_type

  return {
    title: `${data.name} — ${label} in ${data.area} | Hostel Finder`,
    description: `${label} near FUOYE in ${data.area}. ₦${data.price.toLocaleString()}/year. ${(data.description || '').slice(0, 120)}`,
    openGraph: {
      title: `${data.name} | Hostel Finder`,
      description: `${label} near FUOYE in ${data.area}. ₦${data.price.toLocaleString()}/year.`,
      type: 'website',
    },
  }
}

export default async function HostelDetailPage({ params }: Props) {
  const { slug } = await params
  return <HostelDetailClient slug={slug} />
}