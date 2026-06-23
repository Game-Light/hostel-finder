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
  users: { full_name: string; email: string } | null
}

interface User {
  id: string
  full_name: string
  email: string
  role: string
  created_at: string
  is_suspended: boolean
}

const roomTypeLabel: Record<string, string> = {
  self_contain: 'Self-contain', single: 'Single Room',
  shared: 'Shared Room',       mini_flat: 'Mini Flat',
}

export default function AdminPage() {
  const [authed, setAuthed]               = useState(false)
  const [adminPassword, setAdminPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [verifying, setVerifying]         = useState(false)

  const [tab, setTab]                     = useState<'listings' | 'users'>('listings')
  const [listings, setListings]           = useState<Listing[]>([])
  const [users, setUsers]                 = useState<User[]>([])
  const [loading, setLoading]             = useState(false)
  const [actionId, setActionId]           = useState<string | null>(null)
  const [statusFilter, setStatusFilter]   = useState<'pending' | 'active' | 'inactive' | 'all'>('pending')

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
      if (res.ok) {
        setAuthed(true)
      } else {
        setPasswordError('Incorrect password.')
      }
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

  useEffect(() => {
    if (authed) fetchData()
  }, [authed, fetchData])

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
    if (!confirm(`Permanently delete ${user.full_name}'s account and all their listings? This cannot be undone.`)) return
    setActionId(user.id)
    await fetch('/api/admin/data', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', 'x-admin-auth': adminPassword },
      body: JSON.stringify({ id: user.id, type: 'user' }),
    })
    setUsers(prev => prev.filter(u => u.id !== user.id))
    setActionId(null)
  }

  const filteredListings = statusFilter === 'all'
    ? listings
    : listings.filter(l => l.status === statusFilter)

  const pendingCount = listings.filter(l => l.status === 'pending').length
  const activeCount  = listings.filter(l => l.status === 'active').length
  const studentCount = users.filter(u => u.role === 'student').length
  const agentCount   = users.filter(u => u.role === 'agent').length

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

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Pending listings', value: pendingCount, urgent: pendingCount > 0 },
            { label: 'Active listings',  value: activeCount,  urgent: false },
            { label: 'Students',         value: studentCount, urgent: false },
            { label: 'Agents',           value: agentCount,   urgent: false },
          ].map(stat => (
            <div key={stat.label} className="bg-white rounded-2xl p-4 shadow-sm text-center">
              <div className="text-2xl font-black" style={{ color: stat.urgent ? '#DC2626' : '#034338' }}>
                {stat.value}
              </div>
              <div className="text-xs font-medium mt-1" style={{ color: '#4B6B62' }}>{stat.label}</div>
            </div>
          ))}
        </div>

        <div className="flex gap-2 mb-6">
          {[
            { key: 'listings', label: `Listings${pendingCount > 0 ? ` (${pendingCount} pending)` : ''}` },
            { key: 'users',    label: `Users (${users.length})` },
          ].map(t => (
            <button key={t.key} onClick={() => setTab(t.key as 'listings' | 'users')}
              className="text-sm font-bold px-5 py-2.5 rounded-xl transition-all cursor-pointer"
              style={tab === t.key
                ? { backgroundColor: '#034338', color: '#FFFFFF' }
                : { backgroundColor: '#FFFFFF', color: '#4B6B62' }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* ── Listings ── */}
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
                <p className="font-bold text-sm" style={{ color: '#0A2A23' }}>
                  No {statusFilter === 'all' ? '' : statusFilter} listings
                </p>
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
                        <p className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>
                          {new Date(listing.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
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
                            {actionId === listing.id ? (
                              <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                              </svg>
                            ) : '✓'} Approve
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

        {/* ── Users ── */}
        {tab === 'users' && (
          <div>
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="w-8 h-8 rounded-full border-4 border-t-transparent animate-spin"
                  style={{ borderColor: '#034338', borderTopColor: 'transparent' }} />
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {users.map(user => (
                  <div key={user.id} className="bg-white rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-9 h-9 rounded-full flex items-center justify-center font-black text-sm shrink-0"
                        style={{
                          backgroundColor: user.is_suspended ? '#FEE2E2' : user.role === 'agent' ? '#034338' : '#E8F5EE',
                          color: user.is_suspended ? '#DC2626' : user.role === 'agent' ? '#37D76A' : '#034338',
                        }}>
                        {user.full_name?.charAt(0).toUpperCase() || '?'}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-bold text-sm" style={{ color: '#0A2A23' }}>{user.full_name}</p>
                          {user.is_suspended && (
                            <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                              style={{ backgroundColor: '#FEE2E2', color: '#DC2626' }}>
                              Suspended
                            </span>
                          )}
                        </div>
                        <p className="text-xs font-medium truncate" style={{ color: '#4B6B62' }}>{user.email}</p>
                        <p className="text-xs font-medium mt-0.5" style={{ color: '#9CA3AF' }}>
                          {new Date(user.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 flex-wrap">
                      <span className="text-xs font-bold px-2.5 py-1 rounded-full capitalize"
                        style={{
                          backgroundColor: user.role === 'agent' ? '#034338' : '#E8F5EE',
                          color: user.role === 'agent' ? '#37D76A' : '#034338',
                        }}>
                        {user.role}
                      </span>
                      <button
                        onClick={() => toggleSuspendUser(user)}
                        disabled={actionId === user.id}
                        className="text-xs font-bold px-3 py-2 rounded-xl cursor-pointer hover:opacity-90 transition-opacity disabled:opacity-50"
                        style={{
                          backgroundColor: user.is_suspended ? '#DCFCE7' : '#FEF3C7',
                          color: user.is_suspended ? '#166534' : '#92400E',
                        }}>
                        {actionId === user.id ? '...' : user.is_suspended ? 'Unsuspend' : 'Suspend'}
                      </button>
                      <button
                        onClick={() => deleteUser(user)}
                        disabled={actionId === user.id}
                        className="text-xs font-bold px-3 py-2 rounded-xl cursor-pointer hover:bg-red-50 transition-colors border disabled:opacity-50"
                        style={{ color: '#DC2626', borderColor: '#E8EDEB' }}>
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}