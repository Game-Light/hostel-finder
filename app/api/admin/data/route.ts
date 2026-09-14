import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendEmail } from '@/lib/email'
import { listingApprovedEmail, listingRejectedEmail } from '@/lib/emailTemplates'

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
      .select('id, name, area, price, room_type, status, created_at, slug, views, whatsapp_clicks, agent_id, users(full_name, email, phone)')
      .order('created_at', { ascending: false }),
    supabase
      .from('users')
      .select('id, full_name, email, phone, role, university, avatar_url, created_at, is_suspended, suspension_reason')
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

    // Listing status update — also emails the agent on approve/reject
    // (not on deactivate, which is a different situation for an already-live listing)
    if (body.type === 'listing' || body.status) {
      const { data: listing } = await supabase
        .from('listings')
        .select('name, slug, users(full_name, email)')
        .eq('id', body.id)
        .single()

      const updates: Record<string, unknown> = { status: body.status }
      if (body.status === 'rejected') {
        updates.rejection_reason = body.rejection_reason || null
      }

      const { error } = await supabase
        .from('listings')
        .update(updates)
        .eq('id', body.id)
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })

      const agent = listing?.users as { full_name: string; email: string } | undefined
      if (agent?.email && listing) {
        if (body.status === 'active') {
          await sendEmail({
            to: agent.email,
            subject: `Your listing "${listing.name}" is now live`,
            html: listingApprovedEmail(agent.full_name, listing.name, listing.slug),
          })
        } else if (body.status === 'rejected') {
          await sendEmail({
            to: agent.email,
            subject: `Your listing "${listing.name}" needs changes`,
            html: listingRejectedEmail(agent.full_name, listing.name, body.rejection_reason || 'No reason given'),
          })
        }
      }

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

  try {
    const { id, type } = await req.json()
    const supabase = getAdminClient()

    if (type === 'user') {
      // Each cleanup step is logged individually so if one specific table
      // is the problem, we'll know exactly which and why — instead of the
      // whole route crashing with no information, like last time.
      const cleanupSteps: [string, () => PromiseLike<{ error: unknown }>][] = [
        ['listings',          () => supabase.from('listings').delete().eq('agent_id', id)],
        ['agent_reports (agent)',    () => supabase.from('agent_reports').delete().eq('agent_id', id)],
        ['agent_reports (reporter)', () => supabase.from('agent_reports').delete().eq('reporter_id', id)],
        ['agent_warnings',    () => supabase.from('agent_warnings').delete().eq('agent_id', id)],
        ['platform_feedback', () => supabase.from('platform_feedback').delete().eq('user_id', id)],
        ['saved_listings',    () => supabase.from('saved_listings').delete().eq('student_id', id)],
        ['conversions',       () => supabase.from('conversions').delete().eq('student_id', id)],
      ]

      for (const [label, run] of cleanupSteps) {
        const { error } = await run()
        if (error) console.error(`Cleanup step failed (${label}):`, error)
        // Intentionally not aborting on these — a missing/empty table for
        // this user shouldn't block the actual account deletion below.
      }

      const { error: userDeleteError } = await supabase.from('users').delete().eq('id', id)
      if (userDeleteError) {
        console.error('public.users delete failed:', userDeleteError)
        return NextResponse.json({ error: `Could not delete profile row: ${userDeleteError.message}` }, { status: 500 })
      }

      const { error: authDeleteError } = await supabase.auth.admin.deleteUser(id)
      if (authDeleteError) {
        console.error('auth.admin.deleteUser failed:', authDeleteError)
        return NextResponse.json({ error: `Could not delete auth account: ${authDeleteError.message}` }, { status: 500 })
      }

      return NextResponse.json({ success: true })
    }

    // Default: delete listing
    const { error } = await supabase.from('listings').delete().eq('id', id)
    if (error) {
      console.error('Listing delete failed:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ success: true })

  } catch (err) {
    // Catches anything unexpected (bad JSON body, network issue, etc.)
    // so the route always returns real JSON instead of crashing to an
    // empty response — this is what caused the "{}" you just saw.
    console.error('DELETE /api/admin/data crashed:', err)
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unknown server error' }, { status: 500 })
  }
}