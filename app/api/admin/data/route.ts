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
      .select('id, full_name, email, role, created_at, is_suspended')
      .order('created_at', { ascending: false }),
  ])

  return NextResponse.json({ listings: listings || [], users: users || [] })
}

export async function PATCH(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const supabase = getAdminClient()

  // Listing status update
  if (body.type === 'listing' || body.status) {
    const { error } = await supabase
      .from('listings')
      .update({ status: body.status })
      .eq('id', body.id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  }

  // User suspend/unsuspend
  if (body.type === 'user_suspend') {
    const { error } = await supabase
      .from('users')
      .update({ is_suspended: body.is_suspended })
      .eq('id', body.id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
}

export async function DELETE(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id, type } = await req.json()
  const supabase = getAdminClient()

  if (type === 'user') {
    // Delete user's listings first, then the user
    await supabase.from('listings').delete().eq('agent_id', id)
    const { error } = await supabase.auth.admin.deleteUser(id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    // Also delete from users table
    await supabase.from('users').delete().eq('id', id)
    return NextResponse.json({ success: true })
  }

  // Default: delete listing
  const { error } = await supabase
    .from('listings')
    .delete()
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}