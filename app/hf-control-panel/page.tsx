'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import AdminActionModal from './AdminActionModal'

interface Listing {
  id: string
  name: string
  area: string
  price: number
  room_type: string
  status: string
  created_at: string
  slug: string
  views: number
  whatsapp_clicks: number
  users: { full_name: string; email: string; phone: string | null } | null
}

interface User {
  id: string
  full_name: string
  email: string
  role: string
  phone: string | null
  created_at: string
  is_suspended: boolean
  suspension_reason: string | null
}

interface AgentStat {
  agent: User
  listings: Listing[]
  totalViews: number
  totalClicks: number
  activeListings: number
}

interface Report {
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

interface Feedback {
  id: string
  user_id: string
  message: string
  is_read: boolean
  created_at: string
  user: { full_name: string; email: string; role: string } | null
}

interface Warning {
  id: string
  agent_id: string
  reason: string
  report_id: string | null
  created_at: string
  acknowledged: boolean
}

interface TimeEvent {
  id: string
  listing_id: string
  viewer_id: string | null
  created_at: string
}

type Tab = 'overview' | 'reports' | 'feedback' | 'listings' | 'agents' | 'students'
type Period = 'day' | 'week' | 'month'
type Metric = 'listings' | 'views' | 'clicks'

const roomTypeLabel: Record<string, string> = {
  self_contain: 'Self-contain', single: 'Single Room',
  shared: 'Shared Room', mini_flat: 'Mini Flat',
}

const reportStatusStyle: Record<string, { bg: string; text: string }> = {
  pending:  { bg: '#FEF3C7', text: '#92400E' },
  actioned: { bg: '#DCFCE7', text: '#166534' },
  dismissed: { bg: '#F3F4F6', text: '#6B7280' },
}

// ── Buckets a list of timestamped items into day/week/month periods.
// Used for all three chart metrics (new listings, views, clicks) — each
// just passes a different array of { created_at } items.
function buildTrendData(items: { created_at: string }[], period: Period) {
  const now = new Date()
  const buckets: { label: string; value: number }[] = []

  if (period === 'day') {
    for (let i = 6; i >= 0; i--) {
      const start = new Date(now)
      start.setDate(start.getDate() - i)
      start.setHours(0, 0, 0, 0)
      const end = new Date(start)
      end.setDate(end.getDate() + 1)
      const value = items.filter(it => {
        const t = new Date(it.created_at).getTime()
        return t >= start.getTime() && t < end.getTime()
      }).length
      buckets.push({ label: start.toLocaleDateString('en-GB', { weekday: 'short' }), value })
    }
  } else if (period === 'week') {
    for (let i = 7; i >= 0; i--) {
      const end = new Date(now)
      end.setDate(end.getDate() - i * 7)
      end.setHours(23, 59, 59, 999)
      const start = new Date(end)
      start.setDate(start.getDate() - 6)
      start.setHours(0, 0, 0, 0)
      const value = items.filter(it => {
        const t = new Date(it.created_at).getTime()
        return t >= start.getTime() && t <= end.getTime()
      }).length
      buckets.push({ label: start.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }), value })
    }
  } else {
    for (let i = 5; i >= 0; i--) {
      const start = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1)
      const value = items.filter(it => {
        const t = new Date(it.created_at).getTime()
        return t >= start.getTime() && t < end.getTime()
      }).length
      buckets.push({ label: start.toLocaleDateString('en-GB', { month: 'short' }), value })
    }
  }

  return buckets
}

function TrendChart({ data }: { data: { label: string; value: number }[] }) {
  const max = Math.max(...data.map(d => d.value), 1)
  const barWidth = 100 / data.length

  return (
    <div className="w-full">
      <svg viewBox="0 0 400 150" className="w-full h-40" preserveAspectRatio="none">
        {data.map((d, i) => {
          const height = (d.value / max) * 110
          const x = i * barWidth + barWidth * 0.25
          const width = barWidth * 0.5
          return (
            <g key={i}>
              {d.value > 0 && (
                <text x={`${x + width / 2}%`} y={135 - height - 6} textAnchor="middle" fontSize="11" fontWeight="800" fill="#034338">
                  {d.value}
                </text>
              )}
              <rect x={`${x}%`} y={135 - height} width={`${width}%`} height={Math.max(height, 2)} rx={4} fill="#37D76A" />
            </g>
          )
        })}
      </svg>
      <div className="flex mt-1">
        {data.map((d, i) => (
          <div key={i} className="text-center text-xs font-medium" style={{ width: `${barWidth}%`, color: '#4B6B62' }}>
            {d.label}
          </div>
        ))}
      </div>
    </div>
  )
}

const NavIcon = ({ path }: { path: string }) => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={path} />
  </svg>
)

const ICONS = {
  overview: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
  reports: 'M3 3v18m0-18h13l-2 5 2 5H3',
  feedback: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8-1.17 0-2.29-.196-3.32-.552L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z',
  listings: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2M5 21H3m16 0h-5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 6v-3a1 1 0 011-1h0a1 1 0 011 1v3',
  agents: 'M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-1a4 4 0 100-8 4 4 0 000 8zm6 3a4 4 0 00-8 0m8 0a4 4 0 01-8 0',
  students: 'M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.42A12.1 12.1 0 0121 12c0 2.4-.9 4.6-2.4 6.3M12 14l-6.16-3.42A12.1 12.1 0 003 12c0 2.4.9 4.6 2.4 6.3M12 14v7',
}

type ActionModalState =
  | { type: 'agent_warn'; agentId: string; agentName: string; reportId?: string }
  | { type: 'agent_suspend'; agentId: string; agentName: string; reportId?: string }
  | { type: 'report_dismiss'; reportId: string }
  | null

export default function AdminPage() {
  const [authed, setAuthed]               = useState(false)
  const [adminPassword, setAdminPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [verifying, setVerifying]         = useState(false)

  const [tab, setTab]                     = useState<Tab>('overview')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false) // NEW

  const [listings, setListings]           = useState<Listing[]>([])
  const [users, setUsers]                 = useState<User[]>([])
  const [conversions, setConversions]     = useState<{ id: string; confirmed: boolean; listing_id: string }[]>([])
  const [reports, setReports]             = useState<Report[]>([])
  const [feedback, setFeedback]           = useState<Feedback[]>([])
  const [warnings, setWarnings]           = useState<Warning[]>([]) // NEW
  const [viewEvents, setViewEvents]       = useState<TimeEvent[]>([]) // NEW
  const [clickEvents, setClickEvents]     = useState<TimeEvent[]>([]) // NEW

  const [loading, setLoading]             = useState(false)
  const [actionId, setActionId]           = useState<string | null>(null)
  const [statusFilter, setStatusFilter]   = useState<'pending' | 'active' | 'inactive' | 'all'>('pending')
  const [expandedAgent, setExpandedAgent] = useState<string | null>(null)   // listings expand — kept exactly as before
  const [manageAgent, setManageAgent]     = useState<string | null>(null)   // NEW: actions reveal panel
  const [period, setPeriod]               = useState<Period>('day')
  const [metric, setMetric]               = useState<Metric>('listings')    // NEW
  const [reportFilter, setReportFilter]   = useState<'pending' | 'actioned' | 'dismissed' | 'all'>('pending')
  const [actionModal, setActionModal]     = useState<ActionModalState>(null) // NEW
  const [modalSubmitting, setModalSubmitting] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setVerifying(true)
    setPasswordError('')
    try {
      const res = await fetch('/api/admin/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: adminPassword }),
      })
      if (res.ok) setAuthed(true)
      else setPasswordError('Incorrect password.')
    } catch {
      setPasswordError('Something went wrong. Try again.')
    }
    setVerifying(false)
  }

  const handleLogout = () => {
    setAuthed(false)
    setAdminPassword('')
  }

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/data', {
        headers: { 'x-admin-auth': adminPassword },
      })
      if (res.ok) {
        const { listings: l, users: u, conversions: c, reports: r, feedback: f, warnings: w, viewEvents: ve, clickEvents: ce } = await res.json()
        setListings(l)
        setUsers(u)
        setConversions(c)
        setReports(r)
        setFeedback(f)
        setWarnings(w)
        setViewEvents(ve)
        setClickEvents(ce)
      }
    } catch {}
    setLoading(false)
  }, [adminPassword])

  useEffect(() => { if (authed) fetchData() }, [authed, fetchData])

  const updateListingStatus = async (id: string, status: string) => {
    setActionId(id)
    await fetch('/api/admin/data', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'x-admin-auth': adminPassword },
      body: JSON.stringify({ id, status }),
    })
    setListings(prev => prev.map(l => l.id === id ? { ...l, status } : l))
    setActionId(null)
  }

  const deleteListing = async (id: string) => {
    if (!confirm('Permanently delete this listing?')) return
    setActionId(id)
    await fetch('/api/admin/data', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', 'x-admin-auth': adminPassword },
      body: JSON.stringify({ id }),
    })
    setListings(prev => prev.filter(l => l.id !== id))
    setActionId(null)
  }

  // Generic toggle — still used for students, and for un-suspending agents (no reason needed to lift one)
  const toggleSuspendUser = async (user: User) => {
    const action = user.is_suspended ? 'unsuspend' : 'suspend'
    if (!confirm(`${action.charAt(0).toUpperCase() + action.slice(1)} ${user.full_name}?`)) return
    setActionId(user.id)
    await fetch('/api/admin/data', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'x-admin-auth': adminPassword },
      body: JSON.stringify({ type: 'user_suspend', id: user.id, is_suspended: !user.is_suspended }),
    })
    setUsers(prev => prev.map(u => u.id === user.id ? { ...u, is_suspended: !u.is_suspended, suspension_reason: u.is_suspended ? null : u.suspension_reason } : u))
    setActionId(null)
  }

  const deleteUser = async (user: User) => {
    if (!confirm(`Permanently delete ${user.full_name}'s account and all their listings?`)) return
    setActionId(user.id)
    await fetch('/api/admin/data', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', 'x-admin-auth': adminPassword },
      body: JSON.stringify({ id: user.id, type: 'user' }),
    })
    setUsers(prev => prev.filter(u => u.id !== user.id))
    setActionId(null)
  }

  // NEW: submit handler for the shared AdminActionModal — branches on actionModal.type
  const handleModalConfirm = async (reason: string) => {
    if (!actionModal) return
    setModalSubmitting(true)

    if (actionModal.type === 'agent_warn') {
      await fetch('/api/admin/data', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'x-admin-auth': adminPassword },
        body: JSON.stringify({ type: 'agent_warn', agentId: actionModal.agentId, reason, reportId: actionModal.reportId }),
      })
      setWarnings(prev => [{ id: crypto.randomUUID(), agent_id: actionModal.agentId, reason, report_id: actionModal.reportId || null, created_at: new Date().toISOString(), acknowledged: false }, ...prev])
      if (actionModal.reportId) {
        setReports(prev => prev.map(r => r.id === actionModal.reportId ? { ...r, status: 'actioned', admin_notes: reason } : r))
      }
    }

    if (actionModal.type === 'agent_suspend') {
      await fetch('/api/admin/data', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'x-admin-auth': adminPassword },
        body: JSON.stringify({ type: 'agent_suspend', agentId: actionModal.agentId, reason, reportId: actionModal.reportId }),
      })
      setUsers(prev => prev.map(u => u.id === actionModal.agentId ? { ...u, is_suspended: true, suspension_reason: reason } : u))
      if (actionModal.reportId) {
        setReports(prev => prev.map(r => r.id === actionModal.reportId ? { ...r, status: 'actioned', admin_notes: reason } : r))
      }
    }

    if (actionModal.type === 'report_dismiss') {
      await fetch('/api/admin/data', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'x-admin-auth': adminPassword },
        body: JSON.stringify({ type: 'report_dismiss', id: actionModal.reportId, reason }),
      })
      setReports(prev => prev.map(r => r.id === actionModal.reportId ? { ...r, status: 'dismissed', admin_notes: reason } : r))
    }

    setModalSubmitting(false)
    setActionModal(null)
  }

  const toggleFeedbackRead = async (item: Feedback) => {
    setActionId(item.id)
    await fetch('/api/admin/data', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'x-admin-auth': adminPassword },
      body: JSON.stringify({ type: 'feedback_read', id: item.id, is_read: !item.is_read }),
    })
    setFeedback(prev => prev.map(f => f.id === item.id ? { ...f, is_read: !f.is_read } : f))
    setActionId(null)
  }

  const filteredListings = statusFilter === 'all' ? listings : listings.filter(l => l.status === statusFilter)
  const agents   = users.filter(u => u.role === 'agent')
  const students = users.filter(u => u.role === 'student')

  const pendingCount = listings.filter(l => l.status === 'pending').length
  const activeCount  = listings.filter(l => l.status === 'active').length
  const totalViews   = listings.reduce((sum, l) => sum + (l.views || 0), 0)
  const totalClicks  = listings.reduce((sum, l) => sum + (l.whatsapp_clicks || 0), 0)

  const pendingReportsCount = reports.filter(r => r.status === 'pending').length
  const unreadFeedbackCount = feedback.filter(f => !f.is_read).length
  const filteredReports = reportFilter === 'all' ? reports : reports.filter(r => r.status === reportFilter)

  const warningCountFor = (agentId: string) => warnings.filter(w => w.agent_id === agentId).length
  // NEW: distinct listings a given student has viewed, from the raw view events
  const listingsViewedFor = (userId: string) => new Set(viewEvents.filter(e => e.viewer_id === userId).map(e => e.listing_id)).size

  const agentStats: AgentStat[] = agents.map(agent => {
    const agentListings = listings.filter(l => l.users?.email === agent.email)
    return {
      agent,
      listings: agentListings,
      totalViews: agentListings.reduce((sum, l) => sum + (l.views || 0), 0),
      totalClicks: agentListings.reduce((sum, l) => sum + (l.whatsapp_clicks || 0), 0),
      activeListings: agentListings.filter(l => l.status === 'active').length,
    }
  }).sort((a, b) => b.totalClicks - a.totalClicks)

  // Chart data source depends on the selected metric
  const chartSource = metric === 'listings' ? listings : metric === 'views' ? viewEvents : clickEvents
  const chartData = buildTrendData(chartSource, period)
  const chartTitles: Record<Metric, string> = { listings: 'New listings', views: 'Listing views', clicks: 'WhatsApp clicks' }

  const recentActivity = [
    ...listings.slice(0, 5).map(l => ({ type: 'listing' as const, label: `New listing: ${l.name}`, sub: l.users?.full_name || 'Unknown agent', created_at: l.created_at })),
    ...users.slice(0, 5).map(u => ({ type: 'signup' as const, label: `${u.role === 'agent' ? 'Agent' : 'Student'} joined: ${u.full_name}`, sub: u.email, created_at: u.created_at })),
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 6)

  if (!authed) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: '#F4F6F5' }}>
        <div className="w-full max-w-sm bg-white rounded-2xl p-8 shadow-sm">
          <div className="text-center mb-6">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3" style={{ backgroundColor: '#034338' }}>
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h1 className="text-xl font-black" style={{ color: '#0A2A23' }}>Admin Access</h1>
            <p className="text-sm font-medium mt-1" style={{ color: '#4B6B62' }}>Hostel Finder Dashboard</p>
          </div>
          {passwordError && (
            <div className="mb-4 px-4 py-3 rounded-xl text-sm font-medium" style={{ backgroundColor: '#FEE2E2', color: '#991B1B' }}>
              {passwordError}
            </div>
          )}
          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <div>
              <label className="block text-xs font-bold mb-1.5" style={{ color: '#0A2A23' }}>Password</label>
              <input type="password" value={adminPassword} onChange={e => setAdminPassword(e.target.value)}
                placeholder="Enter admin password" required autoFocus
                className="w-full px-4 py-3 rounded-xl text-sm outline-none border transition-colors"
                style={{ borderColor: '#E8EDEB', color: '#0A2A23' }}
                onFocus={e => e.target.style.borderColor = '#034338'}
                onBlur={e => e.target.style.borderColor = '#E8EDEB'} />
            </div>
            <button type="submit" disabled={verifying}
              className="w-full py-3 rounded-xl font-bold text-sm text-white cursor-pointer hover:opacity-90 transition-opacity disabled:opacity-60"
              style={{ backgroundColor: '#034338' }}>
              {verifying ? 'Verifying...' : 'Enter'}
            </button>
          </form>
        </div>
      </div>
    )
  }

  const navItems: { key: Tab; label: string; badge?: number; urgent?: boolean }[] = [
    { key: 'overview', label: 'Overview' },
    { key: 'reports',  label: 'Reports',  badge: pendingReportsCount, urgent: true },
    { key: 'feedback', label: 'Feedback', badge: unreadFeedbackCount },
    { key: 'listings', label: 'Listings', badge: pendingCount },
    { key: 'agents',   label: 'Agents' },
    { key: 'students', label: 'Students' },
  ]

  const tabTitles: Record<Tab, string> = {
    overview: 'Overview', reports: 'Reports', feedback: 'Feedback',
    listings: 'Listings', agents: 'Agents', students: 'Students',
  }

  // Shared sidebar content — rendered once for desktop, once inside the mobile drawer
  const SidebarContent = () => (
    <>
      <div>
        <div className="flex items-center gap-2 mb-8 px-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#034338' }}>
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <span className="font-black text-sm" style={{ color: '#0A2A23' }}>Hostel Finder</span>
        </div>

        <nav className="flex flex-col gap-1">
          {navItems.map(item => (
            <button key={item.key} onClick={() => { setTab(item.key); setMobileMenuOpen(false) }}
              className="flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer"
              style={tab === item.key
                ? { backgroundColor: '#034338', color: '#FFFFFF' }
                : { backgroundColor: 'transparent', color: '#4B6B62' }}>
              <span className="flex items-center gap-3">
                <NavIcon path={ICONS[item.key]} />
                {item.label}
              </span>
              {!!item.badge && (
                <span className="text-xs font-black px-1.5 py-0.5 rounded-full min-w-[20px] text-center"
                  style={{
                    backgroundColor: tab === item.key ? '#37D76A' : (item.urgent ? '#DC2626' : '#034338'),
                    color: tab === item.key ? '#034338' : '#FFFFFF',
                  }}>
                  {item.badge}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      <div className="flex flex-col gap-1">
        <Link href="/" target="_blank"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-colors hover:bg-gray-50 cursor-pointer"
          style={{ color: '#4B6B62' }}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
          View site
        </Link>
        <button onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-colors hover:bg-red-50 cursor-pointer"
          style={{ color: '#DC2626' }}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Log out
        </button>
      </div>
    </>
  )

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: '#F4F6F5' }}>

      {/* ── Desktop sidebar ── */}
      <aside className="hidden md:flex w-60 shrink-0 flex-col justify-between p-5" style={{ backgroundColor: '#FFFFFF', borderRight: '1px solid #E8EDEB' }}>
        <SidebarContent />
      </aside>

      {/* ── NEW: Mobile drawer sidebar ── */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[250] md:hidden">
          <div className="absolute inset-0" style={{ backgroundColor: 'rgba(3,67,56,0.6)' }} onClick={() => setMobileMenuOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-64 flex flex-col justify-between p-5 shadow-2xl" style={{ backgroundColor: '#FFFFFF' }}>
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* ── Main content ── */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between px-4 sm:px-8 py-5" style={{ backgroundColor: '#FFFFFF', borderBottom: '1px solid #E8EDEB' }}>
          <div className="flex items-center gap-3">
            {/* NEW: hamburger, mobile only */}
            <button onClick={() => setMobileMenuOpen(true)}
              className="md:hidden w-9 h-9 rounded-lg flex items-center justify-center cursor-pointer"
              style={{ backgroundColor: '#F4F6F5', color: '#034338' }}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div>
              <h1 className="text-lg font-black" style={{ color: '#0A2A23' }}>{tabTitles[tab]}</h1>
              <p className="text-xs font-medium hidden sm:block" style={{ color: '#4B6B62' }}>Hostel Finder admin</p>
            </div>
          </div>
          <button onClick={fetchData}
            className="text-xs font-bold px-3 py-2 rounded-lg border transition-colors cursor-pointer hover:bg-gray-50"
            style={{ color: '#034338', borderColor: '#E8EDEB' }}>
            Refresh
          </button>
        </div>

        <div className="p-4 sm:p-8">

          {/* ══════════ OVERVIEW ══════════ */}
          {tab === 'overview' && (
            <div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {[
                  { label: 'Total listings', value: listings.length, bg: '#DBEAFE', color: '#1E40AF', icon: ICONS.listings },
                  { label: 'Active agents',  value: agents.length,   bg: '#DCFCE7', color: '#166534', icon: ICONS.agents },
                  { label: 'Total students', value: students.length, bg: '#EDE9FE', color: '#5B21B6', icon: ICONS.students },
                  { label: 'Pending reports', value: pendingReportsCount, bg: pendingReportsCount > 0 ? '#FEE2E2' : '#F4F6F5', color: pendingReportsCount > 0 ? '#DC2626' : '#6B7280', icon: ICONS.reports },
                ].map(stat => (
                  <div key={stat.label} className="bg-white rounded-2xl p-4 shadow-sm">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3" style={{ backgroundColor: stat.bg, color: stat.color }}>
                      <NavIcon path={stat.icon} />
                    </div>
                    <div className="text-xl font-black" style={{ color: '#0A2A23' }}>{stat.value}</div>
                    <div className="text-xs font-medium mt-0.5" style={{ color: '#4B6B62' }}>{stat.label}</div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
                <div className="lg:col-span-2 bg-white rounded-2xl p-5 shadow-sm">
                  <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                    <div>
                      <p className="text-xs font-bold" style={{ color: '#4B6B62' }}>{chartTitles[metric].toUpperCase()}</p>
                      <p className="text-lg font-black" style={{ color: '#0A2A23' }}>Growth</p>
                    </div>
                    {/* NEW: metric toggle — real data, no fabricated series */}
                    <div className="flex gap-1 p-1 rounded-full flex-wrap" style={{ backgroundColor: '#F4F6F5' }}>
                      {(['listings', 'views', 'clicks'] as Metric[]).map(m => (
                        <button key={m} onClick={() => setMetric(m)}
                          className="text-xs font-bold px-3 py-1.5 rounded-full transition-all cursor-pointer"
                          style={metric === m
                            ? { backgroundColor: '#034338', color: '#FFFFFF' }
                            : { backgroundColor: 'transparent', color: '#4B6B62' }}>
                          {chartTitles[m]}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex justify-end mb-2">
                    <div className="flex gap-1 p-1 rounded-full" style={{ backgroundColor: '#F4F6F5' }}>
                      {(['day', 'week', 'month'] as Period[]).map(p => (
                        <button key={p} onClick={() => setPeriod(p)}
                          className="text-xs font-bold px-3 py-1.5 rounded-full transition-all cursor-pointer capitalize"
                          style={period === p
                            ? { backgroundColor: '#37D76A', color: '#034338' }
                            : { backgroundColor: 'transparent', color: '#4B6B62' }}>
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>
                  <TrendChart data={chartData} />
                </div>

                <div className="rounded-2xl p-5 flex flex-col justify-between" style={{ backgroundColor: '#034338' }}>
                  <div>
                    <p className="text-xs font-bold mb-1" style={{ color: '#37D76A' }}>NEEDS ATTENTION</p>
                    <p className="text-white font-black text-lg mb-4">
                      {pendingCount + pendingReportsCount + unreadFeedbackCount} item{(pendingCount + pendingReportsCount + unreadFeedbackCount) !== 1 ? 's' : ''} waiting on you
                    </p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <button onClick={() => setTab('listings')}
                      className="w-full text-left px-4 py-3 rounded-xl text-sm font-bold transition-colors cursor-pointer hover:bg-white/5"
                      style={{ backgroundColor: 'rgba(255,255,255,0.08)', color: '#FFFFFF' }}>
                      {pendingCount} listing{pendingCount !== 1 ? 's' : ''} pending review
                    </button>
                    <button onClick={() => setTab('reports')}
                      className="w-full text-left px-4 py-3 rounded-xl text-sm font-bold transition-colors cursor-pointer hover:bg-white/5"
                      style={{ backgroundColor: 'rgba(255,255,255,0.08)', color: '#FFFFFF' }}>
                      {pendingReportsCount} report{pendingReportsCount !== 1 ? 's' : ''} to review
                    </button>
                    <button onClick={() => setTab('feedback')}
                      className="w-full text-left px-4 py-3 rounded-xl text-sm font-bold transition-colors cursor-pointer hover:bg-white/5"
                      style={{ backgroundColor: 'rgba(255,255,255,0.08)', color: '#FFFFFF' }}>
                      {unreadFeedbackCount} unread feedback
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="bg-white rounded-2xl p-5 shadow-sm">
                  <p className="text-sm font-black mb-4" style={{ color: '#0A2A23' }}>Recent activity</p>
                  <div className="flex flex-col gap-3">
                    {recentActivity.length === 0 && <p className="text-xs font-medium" style={{ color: '#9CA3AF' }}>Nothing yet.</p>}
                    {recentActivity.map((a, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <div className="w-2 h-2 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: a.type === 'listing' ? '#37D76A' : '#1E40AF' }} />
                        <div className="min-w-0">
                          <p className="text-sm font-semibold truncate" style={{ color: '#0A2A23' }}>{a.label}</p>
                          <p className="text-xs font-medium" style={{ color: '#9CA3AF' }}>
                            {a.sub} · {new Date(a.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-5 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-sm font-black" style={{ color: '#0A2A23' }}>Recent reports</p>
                    <button onClick={() => setTab('reports')} className="text-xs font-bold cursor-pointer" style={{ color: '#034338' }}>View all</button>
                  </div>
                  <div className="flex flex-col gap-3">
                    {reports.length === 0 && <p className="text-xs font-medium" style={{ color: '#9CA3AF' }}>No reports yet.</p>}
                    {reports.slice(0, 5).map(r => (
                      <div key={r.id} className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold truncate" style={{ color: '#0A2A23' }}>{r.agent?.full_name || 'Unknown agent'}</p>
                          <p className="text-xs font-medium truncate" style={{ color: '#9CA3AF' }}>{r.reason}</p>
                        </div>
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full shrink-0 capitalize"
                          style={{ backgroundColor: reportStatusStyle[r.status].bg, color: reportStatusStyle[r.status].text }}>
                          {r.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ══════════ REPORTS ══════════ */}
          {tab === 'reports' && (
            <div>
              <div className="flex gap-2 mb-4 flex-wrap">
                {(['pending', 'actioned', 'dismissed', 'all'] as const).map(s => (
                  <button key={s} onClick={() => setReportFilter(s)}
                    className="text-xs font-bold px-4 py-2 rounded-full transition-all cursor-pointer capitalize"
                    style={reportFilter === s
                      ? { backgroundColor: '#034338', color: '#FFFFFF' }
                      : { backgroundColor: '#FFFFFF', color: '#4B6B62' }}>
                    {s} ({s === 'all' ? reports.length : reports.filter(r => r.status === s).length})
                  </button>
                ))}
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-16">
                  <div className="w-8 h-8 rounded-full border-4 border-t-transparent animate-spin" style={{ borderColor: '#034338', borderTopColor: 'transparent' }} />
                </div>
              ) : filteredReports.length === 0 ? (
                <div className="bg-white rounded-2xl p-10 text-center shadow-sm">
                  <p className="font-bold text-sm" style={{ color: '#0A2A23' }}>No {reportFilter === 'all' ? '' : reportFilter} reports</p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {filteredReports.map(report => (
                    <div key={report.id} className="bg-white rounded-2xl p-5 shadow-sm">
                      <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <h3 className="font-black text-sm" style={{ color: '#0A2A23' }}>{report.agent?.full_name || 'Unknown agent'}</h3>
                            <span className="text-xs font-bold px-2 py-0.5 rounded-full capitalize"
                              style={{ backgroundColor: reportStatusStyle[report.status].bg, color: reportStatusStyle[report.status].text }}>
                              {report.status}
                            </span>
                            {/* NEW: warning count badge */}
                            {warningCountFor(report.agent_id) > 0 && (
                              <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: '#FEF3C7', color: '#92400E' }}>
                                ⚠ {warningCountFor(report.agent_id)} prior warning{warningCountFor(report.agent_id) !== 1 ? 's' : ''}
                              </span>
                            )}
                          </div>
                          <p className="text-sm font-semibold" style={{ color: '#0A2A23' }}>{report.reason}</p>
                          {report.details && <p className="text-xs font-medium mt-1" style={{ color: '#4B6B62' }}>{report.details}</p>}
                          {report.admin_notes && (
                            <p className="text-xs font-medium mt-1.5 italic" style={{ color: '#6B7280' }}>Admin note: {report.admin_notes}</p>
                          )}
                          <div className="flex flex-wrap items-center gap-3 mt-2 text-xs font-medium" style={{ color: '#9CA3AF' }}>
                            <span>Reported by {report.reporter?.full_name || 'Unknown'}</span>
                            {report.listing && (
                              <Link href={`/listings/${report.listing.slug}`} target="_blank" className="underline" style={{ color: '#034338' }}>
                                {report.listing.name}
                              </Link>
                            )}
                            <span>{new Date(report.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                          </div>
                        </div>

                        {/* NEW: real consequence actions, each requiring a reason */}
                        <div className="flex items-center gap-2 flex-wrap shrink-0">
                          <button onClick={() => setActionModal({ type: 'agent_warn', agentId: report.agent_id, agentName: report.agent?.full_name || 'this agent', reportId: report.id })}
                            className="text-xs font-bold px-3 py-2 rounded-xl cursor-pointer hover:opacity-90 transition-opacity"
                            style={{ backgroundColor: '#FEF3C7', color: '#92400E' }}>
                            Send warning
                          </button>
                          <button onClick={() => setActionModal({ type: 'agent_suspend', agentId: report.agent_id, agentName: report.agent?.full_name || 'this agent', reportId: report.id })}
                            className="text-xs font-bold px-3 py-2 rounded-xl cursor-pointer hover:opacity-90 transition-opacity"
                            style={{ backgroundColor: '#FEE2E2', color: '#DC2626' }}>
                            Suspend agent
                          </button>
                          {report.status !== 'dismissed' && (
                            <button onClick={() => setActionModal({ type: 'report_dismiss', reportId: report.id })}
                              className="text-xs font-bold px-3 py-2 rounded-xl cursor-pointer border hover:bg-gray-50 transition-colors"
                              style={{ color: '#6B7280', borderColor: '#E8EDEB' }}>
                              Dismiss
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ══════════ FEEDBACK ══════════ */}
          {tab === 'feedback' && (
            <div>
              {loading ? (
                <div className="flex items-center justify-center py-16">
                  <div className="w-8 h-8 rounded-full border-4 border-t-transparent animate-spin" style={{ borderColor: '#034338', borderTopColor: 'transparent' }} />
                </div>
              ) : feedback.length === 0 ? (
                <div className="bg-white rounded-2xl p-10 text-center shadow-sm">
                  <p className="font-bold text-sm" style={{ color: '#0A2A23' }}>No feedback yet</p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {feedback.map(item => (
                    <div key={item.id} className="bg-white rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row sm:items-start gap-4"
                      style={{ opacity: item.is_read ? 0.7 : 1 }}>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <p className="font-bold text-sm" style={{ color: '#0A2A23' }}>{item.user?.full_name || 'Unknown user'}</p>
                          <span className="text-xs font-bold px-2 py-0.5 rounded-full capitalize" style={{ backgroundColor: '#F4F6F5', color: '#4B6B62' }}>
                            {item.user?.role || '—'}
                          </span>
                          {!item.is_read && (
                            <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: '#FEE2E2', color: '#DC2626' }}>New</span>
                          )}
                        </div>
                        <p className="text-sm font-medium" style={{ color: '#3D6058' }}>{item.message}</p>
                        <p className="text-xs font-medium mt-1.5" style={{ color: '#9CA3AF' }}>
                          {new Date(item.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                      <button onClick={() => toggleFeedbackRead(item)} disabled={actionId === item.id}
                        className="text-xs font-bold px-3 py-2 rounded-xl cursor-pointer border hover:bg-gray-50 transition-colors disabled:opacity-50 shrink-0"
                        style={{ color: '#034338', borderColor: '#E8EDEB' }}>
                        {item.is_read ? 'Mark unread' : 'Mark read'}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ══════════ LISTINGS ══════════ */}
          {tab === 'listings' && (
            <div>
              <div className="flex gap-2 mb-4 flex-wrap">
                {(['pending', 'active', 'inactive', 'all'] as const).map(s => (
                  <button key={s} onClick={() => setStatusFilter(s)}
                    className="text-xs font-bold px-4 py-2 rounded-full transition-all cursor-pointer capitalize"
                    style={statusFilter === s
                      ? { backgroundColor: '#034338', color: '#FFFFFF' }
                      : { backgroundColor: '#FFFFFF', color: '#4B6B62' }}>
                    {s} ({s === 'all' ? listings.length : listings.filter(l => l.status === s).length})
                  </button>
                ))}
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-16">
                  <div className="w-8 h-8 rounded-full border-4 border-t-transparent animate-spin" style={{ borderColor: '#034338', borderTopColor: 'transparent' }} />
                </div>
              ) : filteredListings.length === 0 ? (
                <div className="bg-white rounded-2xl p-10 text-center shadow-sm">
                  <p className="font-bold text-sm" style={{ color: '#0A2A23' }}>No {statusFilter === 'all' ? '' : statusFilter} listings</p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {filteredListings.map(listing => (
                    <div key={listing.id} className="bg-white rounded-2xl p-5 shadow-sm">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <h3 className="font-black text-sm" style={{ color: '#0A2A23' }}>{listing.name}</h3>
                            <span className="text-xs font-bold px-2 py-0.5 rounded-full capitalize"
                              style={{
                                backgroundColor: listing.status === 'active' ? '#DCFCE7' : listing.status === 'pending' ? '#FEF3C7' : '#F3F4F6',
                                color: listing.status === 'active' ? '#166534' : listing.status === 'pending' ? '#92400E' : '#6B7280',
                              }}>
                              {listing.status}
                            </span>
                          </div>
                          <p className="text-xs font-medium" style={{ color: '#4B6B62' }}>
                            {listing.area} · {roomTypeLabel[listing.room_type] || listing.room_type} · ₦{listing.price.toLocaleString()}/yr
                          </p>
                          <p className="text-xs font-medium mt-0.5" style={{ color: '#4B6B62' }}>
                            By {listing.users?.full_name || 'Unknown'} ({listing.users?.email || '—'})
                          </p>
                          <div className="flex items-center gap-3 mt-1.5">
                            <span className="text-xs font-medium" style={{ color: '#9CA3AF' }}>👁 {listing.views} views</span>
                            <span className="text-xs font-medium" style={{ color: '#9CA3AF' }}>💬 {listing.whatsapp_clicks || 0} WhatsApp clicks</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap shrink-0">
                          <Link href={`/listings/${listing.slug}`} target="_blank"
                            className="text-xs font-bold px-3 py-2 rounded-xl border cursor-pointer hover:bg-gray-50 transition-colors"
                            style={{ color: '#034338', borderColor: '#E8EDEB' }}>
                            Preview
                          </Link>
                          {listing.status !== 'active' && (
                            <button onClick={() => updateListingStatus(listing.id, 'active')}
                              disabled={actionId === listing.id}
                              className="text-xs font-bold px-3 py-2 rounded-xl cursor-pointer hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-1.5"
                              style={{ backgroundColor: '#DCFCE7', color: '#166534' }}>
                              {actionId === listing.id ? '...' : '✓ Approve'}
                            </button>
                          )}
                          {listing.status === 'active' && (
                            <button onClick={() => updateListingStatus(listing.id, 'inactive')}
                              disabled={actionId === listing.id}
                              className="text-xs font-bold px-3 py-2 rounded-xl cursor-pointer hover:opacity-90 transition-opacity disabled:opacity-50"
                              style={{ backgroundColor: '#FEF3C7', color: '#92400E' }}>
                              Deactivate
                            </button>
                          )}
                          <button onClick={() => deleteListing(listing.id)}
                            disabled={actionId === listing.id}
                            className="text-xs font-bold px-3 py-2 rounded-xl cursor-pointer hover:bg-red-50 transition-colors border disabled:opacity-50"
                            style={{ color: '#DC2626', borderColor: '#E8EDEB' }}>
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ══════════ AGENTS ══════════ */}
          {tab === 'agents' && (
            <div>
              <div className="grid grid-cols-3 gap-4 mb-6">
                {[
                  { label: 'Total agents', value: agents.length },
                  { label: 'Total WhatsApp clicks', value: totalClicks },
                  { label: 'Avg clicks per agent', value: agents.length ? Math.round(totalClicks / agents.length) : 0 },
                ].map(stat => (
                  <div key={stat.label} className="bg-white rounded-2xl p-4 shadow-sm text-center">
                    <div className="text-2xl font-black" style={{ color: '#034338' }}>{stat.value}</div>
                    <div className="text-xs font-medium mt-1" style={{ color: '#4B6B62' }}>{stat.label}</div>
                  </div>
                ))}
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-16">
                  <div className="w-8 h-8 rounded-full border-4 border-t-transparent animate-spin" style={{ borderColor: '#034338', borderTopColor: 'transparent' }} />
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {agentStats.map(({ agent, listings: agentListings, totalViews: av, totalClicks: ac, activeListings: al }) => (
                    <div key={agent.id} className="bg-white rounded-2xl shadow-sm overflow-hidden">
                      {/* ── Always-visible summary row ── */}
                      <div className="p-5">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="w-10 h-10 rounded-full flex items-center justify-center font-black text-sm shrink-0"
                              style={{
                                backgroundColor: agent.is_suspended ? '#FEE2E2' : '#034338',
                                color: agent.is_suspended ? '#DC2626' : '#37D76A',
                              }}>
                              {agent.full_name?.charAt(0).toUpperCase() || '?'}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="font-bold text-sm" style={{ color: '#0A2A23' }}>{agent.full_name}</p>
                                {agent.is_suspended && (
                                  <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: '#FEE2E2', color: '#DC2626' }}>
                                    Suspended
                                  </span>
                                )}
                                {/* NEW: warning count, always visible */}
                                {warningCountFor(agent.id) > 0 && (
                                  <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: '#FEF3C7', color: '#92400E' }}>
                                    ⚠ {warningCountFor(agent.id)}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs font-medium truncate" style={{ color: '#4B6B62' }}>{agent.email}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 flex-wrap text-xs font-bold">
                            <span className="px-2.5 py-1 rounded-full" style={{ backgroundColor: '#E8F5EE', color: '#034338' }}>
                              {al} active listing{al !== 1 ? 's' : ''}
                            </span>
                            <span className="px-2.5 py-1 rounded-full" style={{ backgroundColor: '#F4F6F5', color: '#4B6B62' }}>
                              👁 {av} views
                            </span>
                            <span className="px-2.5 py-1 rounded-full" style={{ backgroundColor: '#DCFCE7', color: '#166534' }}>
                              💬 {ac} clicks
                            </span>
                          </div>

                          {/* NEW: reduced to just two toggles — "Listings" (unchanged) and "Manage" (new reveal panel) */}
                          <div className="flex items-center gap-2 shrink-0 flex-wrap">
                            <button onClick={() => setExpandedAgent(expandedAgent === agent.id ? null : agent.id)}
                              className="text-xs font-bold px-3 py-2 rounded-xl cursor-pointer border hover:bg-gray-50 transition-colors"
                              style={{ color: '#034338', borderColor: '#E8EDEB' }}>
                              {expandedAgent === agent.id ? 'Hide listings' : `${agentListings.length} listing${agentListings.length !== 1 ? 's' : ''}`}
                            </button>
                            <button onClick={() => setManageAgent(manageAgent === agent.id ? null : agent.id)}
                              className="text-xs font-bold px-3 py-2 rounded-xl cursor-pointer transition-opacity hover:opacity-90"
                              style={{ backgroundColor: '#034338', color: '#FFFFFF' }}>
                              {manageAgent === agent.id ? 'Hide actions' : 'Manage'}
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* NEW: reveal-style actions panel, replacing the old always-visible button row */}
                      {manageAgent === agent.id && (
                        <div className="border-t px-5 py-4 flex flex-wrap items-center gap-2" style={{ borderColor: '#E8EDEB', backgroundColor: '#FAFAFA' }}>
                          {agent.phone && (
                            <a href={`https://wa.me/${agent.phone.replace(/^0/, '234')}?text=Hi ${agent.full_name}, this is the Hostel Finder admin team.`}
                              target="_blank" rel="noopener noreferrer"
                              className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl hover:opacity-90 transition-opacity"
                              style={{ backgroundColor: '#37D76A', color: '#034338' }}>
                              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                              </svg>
                              WhatsApp
                            </a>
                          )}
                          <button onClick={() => setActionModal({ type: 'agent_warn', agentId: agent.id, agentName: agent.full_name })}
                            className="text-xs font-bold px-3 py-2 rounded-xl cursor-pointer hover:opacity-90 transition-opacity"
                            style={{ backgroundColor: '#FEF3C7', color: '#92400E' }}>
                            Send warning
                          </button>
                          {agent.is_suspended ? (
                            <button onClick={() => toggleSuspendUser(agent)} disabled={actionId === agent.id}
                              className="text-xs font-bold px-3 py-2 rounded-xl cursor-pointer hover:opacity-90 transition-opacity disabled:opacity-50"
                              style={{ backgroundColor: '#DCFCE7', color: '#166534' }}>
                              {actionId === agent.id ? '...' : 'Unsuspend'}
                            </button>
                          ) : (
                            <button onClick={() => setActionModal({ type: 'agent_suspend', agentId: agent.id, agentName: agent.full_name })}
                              className="text-xs font-bold px-3 py-2 rounded-xl cursor-pointer hover:opacity-90 transition-opacity"
                              style={{ backgroundColor: '#FEE2E2', color: '#DC2626' }}>
                              Suspend
                            </button>
                          )}
                          <button onClick={() => deleteUser(agent)} disabled={actionId === agent.id}
                            className="text-xs font-bold px-3 py-2 rounded-xl cursor-pointer hover:bg-red-50 transition-colors border disabled:opacity-50"
                            style={{ color: '#DC2626', borderColor: '#E8EDEB' }}>
                            Delete account
                          </button>
                        </div>
                      )}

                      {/* Listings expand — untouched, exactly as before */}
                      {expandedAgent === agent.id && agentListings.length > 0 && (
                        <div className="border-t" style={{ borderColor: '#E8EDEB' }}>
                          {agentListings.map((listing, i) => (
                            <div key={listing.id} className="px-5 py-3 flex items-center justify-between gap-4"
                              style={{ borderTop: i > 0 ? '1px solid #E8EDEB' : 'none', backgroundColor: '#FAFAFA' }}>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <p className="text-sm font-bold truncate" style={{ color: '#0A2A23' }}>{listing.name}</p>
                                  <span className="text-xs font-bold px-2 py-0.5 rounded-full capitalize"
                                    style={{
                                      backgroundColor: listing.status === 'active' ? '#DCFCE7' : listing.status === 'pending' ? '#FEF3C7' : '#F3F4F6',
                                      color: listing.status === 'active' ? '#166534' : listing.status === 'pending' ? '#92400E' : '#6B7280',
                                    }}>
                                    {listing.status}
                                  </span>
                                </div>
                                <p className="text-xs font-medium mt-0.5" style={{ color: '#4B6B62' }}>
                                  {listing.area} · ₦{listing.price.toLocaleString()}/yr · 👁 {listing.views} · 💬 {listing.whatsapp_clicks || 0}
                                </p>
                              </div>
                              <Link href={`/listings/${listing.slug}`} target="_blank"
                                className="text-xs font-bold px-3 py-1.5 rounded-lg border hover:bg-white transition-colors shrink-0"
                                style={{ color: '#034338', borderColor: '#E8EDEB' }}>
                                View
                              </Link>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}

                  {agentStats.length === 0 && (
                    <div className="bg-white rounded-2xl p-10 text-center shadow-sm">
                      <p className="font-bold text-sm" style={{ color: '#0A2A23' }}>No agents yet</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ══════════ STUDENTS ══════════ */}
          {tab === 'students' && (
            <div>
              <div className="grid grid-cols-2 gap-4 mb-6">
                {[
                  { label: 'Total students', value: students.length },
                  { label: 'Suspended', value: students.filter(s => s.is_suspended).length },
                ].map(stat => (
                  <div key={stat.label} className="bg-white rounded-2xl p-4 shadow-sm text-center">
                    <div className="text-2xl font-black" style={{ color: '#034338' }}>{stat.value}</div>
                    <div className="text-xs font-medium mt-1" style={{ color: '#4B6B62' }}>{stat.label}</div>
                  </div>
                ))}
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-16">
                  <div className="w-8 h-8 rounded-full border-4 border-t-transparent animate-spin" style={{ borderColor: '#034338', borderTopColor: 'transparent' }} />
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {students.map(student => (
                    <div key={student.id} className="bg-white rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row sm:items-center gap-4">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-9 h-9 rounded-full flex items-center justify-center font-black text-sm shrink-0"
                          style={{
                            backgroundColor: student.is_suspended ? '#FEE2E2' : '#E8F5EE',
                            color: student.is_suspended ? '#DC2626' : '#034338',
                          }}>
                          {student.full_name?.charAt(0).toUpperCase() || '?'}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-bold text-sm" style={{ color: '#0A2A23' }}>{student.full_name}</p>
                            {student.is_suspended && (
                              <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: '#FEE2E2', color: '#DC2626' }}>
                                Suspended
                              </span>
                            )}
                            {/* NEW: per-student listings-viewed count */}
                            <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: '#F4F6F5', color: '#4B6B62' }}>
                              👁 {listingsViewedFor(student.id)} listings viewed
                            </span>
                          </div>
                          <p className="text-xs font-medium truncate" style={{ color: '#4B6B62' }}>{student.email}</p>
                          <p className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>
                            Joined {new Date(student.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 flex-wrap">
                        <button onClick={() => toggleSuspendUser(student)} disabled={actionId === student.id}
                          className="text-xs font-bold px-3 py-2 rounded-xl cursor-pointer hover:opacity-90 transition-opacity disabled:opacity-50"
                          style={{
                            backgroundColor: student.is_suspended ? '#DCFCE7' : '#FEF3C7',
                            color: student.is_suspended ? '#166534' : '#92400E',
                          }}>
                          {actionId === student.id ? '...' : student.is_suspended ? 'Unsuspend' : 'Suspend'}
                        </button>
                        <button onClick={() => deleteUser(student)} disabled={actionId === student.id}
                          className="text-xs font-bold px-3 py-2 rounded-xl cursor-pointer hover:bg-red-50 transition-colors border disabled:opacity-50"
                          style={{ color: '#DC2626', borderColor: '#E8EDEB' }}>
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                  {students.length === 0 && (
                    <div className="bg-white rounded-2xl p-10 text-center shadow-sm">
                      <p className="font-bold text-sm" style={{ color: '#0A2A23' }}>No students yet</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* NEW: shared warn/suspend/dismiss modal */}
      {actionModal && actionModal.type === 'agent_warn' && (
        <AdminActionModal
          title={`Warn ${actionModal.agentName}`}
          description="This agent will see this reason as a popup next time they open the app."
          confirmLabel="Send warning"
          confirmColor="#F59E0B"
          submitting={modalSubmitting}
          onCancel={() => setActionModal(null)}
          onConfirm={handleModalConfirm}
        />
      )}
      {actionModal && actionModal.type === 'agent_suspend' && (
        <AdminActionModal
          title={`Suspend ${actionModal.agentName}`}
          description="This immediately signs the agent out and blocks access. They'll see this reason on the suspended screen."
          confirmLabel="Suspend agent"
          confirmColor="#DC2626"
          submitting={modalSubmitting}
          onCancel={() => setActionModal(null)}
          onConfirm={handleModalConfirm}
        />
      )}
      {actionModal && actionModal.type === 'report_dismiss' && (
        <AdminActionModal
          title="Dismiss this report"
          description="No action will be taken against the agent. This note is for your records only."
          confirmLabel="Dismiss report"
          confirmColor="#6B7280"
          requireReason={false}
          submitting={modalSubmitting}
          onCancel={() => setActionModal(null)}
          onConfirm={handleModalConfirm}
        />
      )}
    </div>
  )
}