// Canonical shapes for data fetched from Supabase. Extra fields are marked
// optional since different pages select different subsets of columns —
// importing this doesn't force every page to fetch every field, it just
// gives them one consistent shape to agree on instead of hand-writing
// their own (and drifting from each other) every time.

export interface ListingPhoto {
  photo_url: string
  is_cover: boolean
  sort_order?: number
}

export interface ListingAgent {
  full_name: string
  email: string
  phone: string | null
}

export interface Listing {
  id: string
  name: string
  description?: string
  area: string
  distance_tag?: string
  price: number
  room_type: string
  rooms_available: number
  facilities?: string[]
  whatsapp_number?: string
  whatsapp_clicks?: number
  video_url?: string | null
  address?: string | null
  status?: string
  views?: number
  slug: string
  created_at?: string
  agent_id?: string
  listing_photos?: ListingPhoto[]
  users?: ListingAgent | null
}

export interface User {
  id: string
  full_name: string
  email: string
  role: string
  phone: string | null
  university?: string
  avatar_url?: string | null
  created_at: string
  is_suspended: boolean
  suspension_reason?: string | null
}

export interface Report {
  id: string
  agent_id: string
  listing_id: string | null
  reporter_id: string
  reason: string
  details: string | null
  status: 'pending' | 'actioned' | 'dismissed'
  admin_notes: string | null
  created_at: string
  resolved_at: string | null
  agent: { full_name: string; email: string } | null
  reporter: { full_name: string; email: string } | null
  listing: { name: string; slug: string } | null
}

export interface Feedback {
  id: string
  user_id: string
  message: string
  is_read: boolean
  created_at: string
  user: { full_name: string; email: string; role: string } | null
}

export interface Warning {
  id: string
  agent_id: string
  reason: string
  report_id: string | null
  created_at: string
  acknowledged: boolean
}