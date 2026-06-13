import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

function isAuthorized(req: NextRequest) {
  return req.headers.get('x-admin-auth') === process.env.ADMIN_PASSWORD
}

// GET — fetch all listings and users
export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = getAdminClient()

  const [{ data: listings }, { data: users }] = await Promise.all([
    supabase
      .from('listings')
      .select('id, name, area, price, room_type, status, created_at, slug, users(full_name, email)')
      .order('created_at', { ascending: false }),
    supabase
      .from('users')
      .select('id, full_name, email, role, created_at')
      .order('created_at', { ascending: false }),
  ])

  return NextResponse.json({ listings: listings || [], users: users || [] })
}

// PATCH — update listing status
export async function PATCH(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id, status } = await req.json()
  const supabase = getAdminClient()

  const { error } = await supabase
    .from('listings')
    .update({ status })
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

// DELETE — delete a listing
export async function DELETE(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await req.json()
  const supabase = getAdminClient()

  const { error } = await supabase
    .from('listings')
    .delete()
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
