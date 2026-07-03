'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'

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
}

interface AgentStat {
  agent: User
  listings: Listing[]
  totalViews: number
  totalClicks: number
  activeListings: number
}

const roomTypeLabel: Record<string, string> = {
  self_contain: 'Self-contain', single: 'Single Room',
  shared: 'Shared Room', mini_flat: 'Mini Flat',
}

export default function AdminPage() {
  const [authed, setAuthed]               = useState(false)
  const [adminPassword, setAdminPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [verifying, setVerifying]         = useState(false)

  const [tab, setTab]                     = useState<'listings' | 'agents' | 'students'>('listings')
  const [listings, setListings]           = useState<Listing[]>([])
  const [users, setUsers]                 = useState<User[]>([])
  const [loading, setLoading]             = useState(false)
  const [actionId, setActionId]           = useState<string | null>(null)
  const [statusFilter, setStatusFilter]   = useState<'pending' | 'active' | 'inactive' | 'all'>('pending')
  const [expandedAgent, setExpandedAgent] = useState<string | null>(null)

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

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/data', {
        headers: { 'x-admin-auth': adminPassword },
      })
      if (res.ok) {
        const { listings: l, users: u } = await res.json()
        setListings(l)
        setUsers(u)
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

  const toggleSuspendUser = async (user: User) => {
    const action = user.is_suspended ? 'unsuspend' : 'suspend'
    if (!confirm(`${action.charAt(0).toUpperCase() + action.slice(1)} ${user.full_name}?`)) return
    setActionId(user.id)
    await fetch('/api/admin/data', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'x-admin-auth': adminPassword },
      body: JSON.stringify({ type: 'user_suspend', id: user.id, is_suspended: !user.is_suspended }),
    })
    setUsers(prev => prev.map(u => u.id === user.id ? { ...u, is_suspended: !u.is_suspended } : u))
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

  const filteredListings = statusFilter === 'all' ? listings : listings.filter(l => l.status === statusFilter)
  const agents   = users.filter(u => u.role === 'agent')
  const students = users.filter(u => u.role === 'student')

  const pendingCount = listings.filter(l => l.status === 'pending').length
  const activeCount  = listings.filter(l => l.status === 'active').length
  const totalViews   = listings.reduce((sum, l) => sum + (l.views || 0), 0)
  const totalClicks  = listings.reduce((sum, l) => sum + (l.whatsapp_clicks || 0), 0)

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

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F4F6F5' }}>
      <div style={{ backgroundColor: '#034338' }} className="px-4 sm:px-6 py-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black text-white">Admin Dashboard</h1>
            <p className="text-xs font-medium mt-0.5" style={{ color: 'rgba(255,255,255,0.6)' }}>Hostel Finder</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={fetchData}
              className="text-xs font-bold px-3 py-2 rounded-lg border border-white/20 text-white hover:bg-white/10 transition-colors cursor-pointer">
              Refresh
            </button>
            <Link href="/" className="text-xs font-bold px-3 py-2 rounded-lg hover:opacity-90 transition-opacity"
              style={{ backgroundColor: '#37D76A', color: '#034338' }}>
              View site
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">

        {/* Platform stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Pending listings', value: pendingCount, urgent: pendingCount > 0 },
            { label: 'Active listings',  value: activeCount,  urgent: false },
            { label: 'Total views',      value: totalViews,   urgent: false },
            { label: 'WhatsApp clicks',  value: totalClicks,  urgent: false },
          ].map(stat => (
            <div key={stat.label} className="bg-white rounded-2xl p-4 shadow-sm text-center">
              <div className="text-2xl font-black" style={{ color: stat.urgent ? '#DC2626' : '#034338' }}>{stat.value}</div>
              <div className="text-xs font-medium mt-1" style={{ color: '#4B6B62' }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {[
            { key: 'listings', label: `Listings${pendingCount > 0 ? ` (${pendingCount} pending)` : ''}` },
            { key: 'agents',   label: `Agents (${agents.length})` },
            { key: 'students', label: `Students (${students.length})` },
          ].map(t => (
            <button key={t.key} onClick={() => setTab(t.key as typeof tab)}
              className="text-sm font-bold px-5 py-2.5 rounded-xl transition-all cursor-pointer"
              style={tab === t.key
                ? { backgroundColor: '#034338', color: '#FFFFFF' }
                : { backgroundColor: '#FFFFFF', color: '#4B6B62' }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* ── Listings tab ── */}
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
                <div className="w-8 h-8 rounded-full border-4 border-t-transparent animate-spin"
                  style={{ borderColor: '#034338', borderTopColor: 'transparent' }} />
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

        {/* ── Agents tab ── */}
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
                <div className="w-8 h-8 rounded-full border-4 border-t-transparent animate-spin"
                  style={{ borderColor: '#034338', borderTopColor: 'transparent' }} />
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {agentStats.map(({ agent, listings: agentListings, totalViews: av, totalClicks: ac, activeListings: al }) => (
                  <div key={agent.id} className="bg-white rounded-2xl shadow-sm overflow-hidden">
                    {/* Agent header */}
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
                            </div>
                            <p className="text-xs font-medium truncate" style={{ color: '#4B6B62' }}>{agent.email}</p>
                          </div>
                        </div>

                        {/* Agent stats pills */}
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

                        {/* Action buttons */}
                        <div className="flex items-center gap-2 shrink-0 flex-wrap">
                          {agent.phone && (
                            
                              <a href={`https://wa.me/${agent.phone.replace(/^0/, '234')}?text=Hi ${agent.full_name}, this is the Hostel Finder admin team.`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl hover:opacity-90 transition-opacity"
                              style={{ backgroundColor: '#37D76A', color: '#034338' }}>
                              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                              </svg>
                              WhatsApp
                            </a>
                          )}
                          <button onClick={() => toggleSuspendUser(agent)} disabled={actionId === agent.id}
                            className="text-xs font-bold px-3 py-2 rounded-xl cursor-pointer hover:opacity-90 transition-opacity disabled:opacity-50"
                            style={{
                              backgroundColor: agent.is_suspended ? '#DCFCE7' : '#FEF3C7',
                              color: agent.is_suspended ? '#166534' : '#92400E',
                            }}>
                            {actionId === agent.id ? '...' : agent.is_suspended ? 'Unsuspend' : 'Suspend'}
                          </button>
                          <button onClick={() => deleteUser(agent)} disabled={actionId === agent.id}
                            className="text-xs font-bold px-3 py-2 rounded-xl cursor-pointer hover:bg-red-50 transition-colors border disabled:opacity-50"
                            style={{ color: '#DC2626', borderColor: '#E8EDEB' }}>
                            Delete
                          </button>
                          <button onClick={() => setExpandedAgent(expandedAgent === agent.id ? null : agent.id)}
                            className="text-xs font-bold px-3 py-2 rounded-xl cursor-pointer border hover:bg-gray-50 transition-colors"
                            style={{ color: '#034338', borderColor: '#E8EDEB' }}>
                            {expandedAgent === agent.id ? 'Hide listings' : `${agentListings.length} listing${agentListings.length !== 1 ? 's' : ''}`}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Expanded listings */}
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
                        {agentListings.length === 0 && (
                          <div className="px-5 py-4 text-xs font-medium" style={{ color: '#9CA3AF', backgroundColor: '#FAFAFA' }}>
                            No listings yet
                          </div>
                        )}
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

        {/* ── Students tab ── */}
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
                <div className="w-8 h-8 rounded-full border-4 border-t-transparent animate-spin"
                  style={{ borderColor: '#034338', borderTopColor: 'transparent' }} />
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
  )
}