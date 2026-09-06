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

  const [
    { data: listings },
    { data: users },
    { data: conversions },
    { data: reports },
    { data: feedback },
    { data: warnings },
    { data: viewEvents },
    { data: clickEvents },
  ] = await Promise.all([
    supabase
      .from('listings')
      .select('id, name, area, price, room_type, status, created_at, slug, views, whatsapp_clicks, users(full_name, email, phone)')
      .order('created_at', { ascending: false }),
    supabase
      .from('users')
      .select('id, full_name, email, phone, role, created_at, is_suspended, suspension_reason')
      .order('created_at', { ascending: false }),
    supabase
      .from('conversions')
      .select('id, confirmed, listing_id')
      .eq('confirmed', true),
    supabase
      .from('agent_reports')
      .select(`
        id, agent_id, listing_id, reporter_id, reason, details, status, admin_notes, created_at, resolved_at,
        agent:users!agent_reports_agent_id_fkey(full_name, email),
        reporter:users!agent_reports_reporter_id_fkey(full_name, email),
        listing:listings(name, slug)
      `)
      .order('created_at', { ascending: false }),
    supabase
      .from('platform_feedback')
      .select(`
        id, user_id, message, is_read, created_at,
        user:users(full_name, email, role)
      `)
      .order('created_at', { ascending: false }),
    // NEW: warning history — used for per-agent warning counts and to show
    // past warnings in the admin UI
    supabase
      .from('agent_warnings')
      .select('id, agent_id, reason, report_id, created_at, acknowledged')
      .order('created_at', { ascending: false }),
    // NEW: raw view events — powers the real views-over-time chart and
    // per-student "listings viewed" counts. Fine to fetch in full at
    // current scale; revisit with date-range filtering if this grows large.
    supabase
      .from('listing_view_events')
      .select('id, listing_id, viewer_id, created_at'),
    // NEW: raw click events — powers the clicks-over-time chart
    supabase
      .from('whatsapp_click_events')
      .select('id, listing_id, viewer_id, created_at'),
  ])

  return NextResponse.json({
    listings: listings || [],
    users: users || [],
    conversions: conversions || [],
    reports: reports || [],
    feedback: feedback || [],
    warnings: warnings || [],
    viewEvents: viewEvents || [],
    clickEvents: clickEvents || [],
  })
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

  // Generic user suspend/unsuspend toggle (used for students, and for
  // un-suspending agents — no reason needed to lift a suspension)
  if (body.type === 'user_suspend') {
    const { error } = await supabase
      .from('users')
      .update({
        is_suspended: body.is_suspended,
        suspension_reason: body.is_suspended ? body.suspension_reason ?? null : null,
      })
      .eq('id', body.id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  }

  // NEW: suspend an agent WITH a reason (from Reports tab or Agents "Manage" panel)
  if (body.type === 'agent_suspend') {
    const { error } = await supabase
      .from('users')
      .update({ is_suspended: true, suspension_reason: body.reason })
      .eq('id', body.agentId)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // If this suspension was triggered from a specific report, close that report out
    if (body.reportId) {
      await supabase
        .from('agent_reports')
        .update({ status: 'actioned', admin_notes: body.reason, resolved_at: new Date().toISOString() })
        .eq('id', body.reportId)
    }
    return NextResponse.json({ success: true })
  }

  // NEW: issue a warning to an agent
  if (body.type === 'agent_warn') {
    const { error } = await supabase
      .from('agent_warnings')
      .insert({ agent_id: body.agentId, reason: body.reason, report_id: body.reportId || null })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    if (body.reportId) {
      await supabase
        .from('agent_reports')
        .update({ status: 'actioned', admin_notes: body.reason, resolved_at: new Date().toISOString() })
        .eq('id', body.reportId)
    }
    return NextResponse.json({ success: true })
  }

  // NEW: dismiss a report (no action taken against the agent)
  if (body.type === 'report_dismiss') {
    const { error } = await supabase
      .from('agent_reports')
      .update({ status: 'dismissed', admin_notes: body.reason || null, resolved_at: new Date().toISOString() })
      .eq('id', body.id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  }

  // Mark feedback as read/unread
  if (body.type === 'feedback_read') {
    const { error } = await supabase
      .from('platform_feedback')
      .update({ is_read: body.is_read })
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