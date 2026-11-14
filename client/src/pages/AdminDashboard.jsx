// Shows admin reports, accounts, and listing moderation controls.
import { useEffect, useState } from 'react'
import {
  Building2,
  CalendarDays,
  CheckCircle2,
  Eye,
  LogOut,
  Mail,
  MessageCircle,
  Phone,
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  Users,
  XCircle,
} from 'lucide-react'
import {
  clearToken,
  deleteListingByAdmin,
  deleteUserByAdmin,
  getAdminAppointments,
  getAdminListings,
  getAdminInquiries,
  getAdminReservations,
  getAdminSupportRequests,
  getAdminStats,
  getAdminUsers,
  getCurrentUser,
  getToken,
  updateListingModeration,
  updateAdminSupportRequestStatus,
  updateUserRoleByAdmin,
} from '../lib/api.js'

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview')
  const [user, setUser] = useState(null)
  const [stats, setStats] = useState(null)
  const [listings, setListings] = useState([])
  const [users, setUsers] = useState([])
  const [appointments, setAppointments] = useState([])
  const [reservations, setReservations] = useState([])
  const [inquiries, setInquiries] = useState([])
  const [supportRequests, setSupportRequests] = useState([])

  const [listingFilter, setListingFilter] = useState('')
  const [userSearch, setUserSearch] = useState('')
  const [userRoleFilter, setUserRoleFilter] = useState('')

  const [state, setState] = useState({ loading: true, error: '', actionId: null, message: '' })

  async function loadData() {
    setState((curr) => ({ ...curr, loading: true, error: '' }))
    try {
      const userResult = await getCurrentUser()
      if (userResult.user.role !== 'admin') {
        throw new Error('This console is restricted to administrators.')
      }
      setUser(userResult.user)

      const [statsResult, listingsResult, usersResult, appointmentsResult, reservationsResult, inquiriesResult, supportResult] = await Promise.all([
        getAdminStats(),
        getAdminListings(listingFilter),
        getAdminUsers(),
        getAdminAppointments(),
        getAdminReservations(),
        getAdminInquiries(),
        getAdminSupportRequests(),
      ])

      setStats(statsResult.stats)
      setListings(listingsResult.listings || [])
      setUsers(usersResult.users || [])
      setAppointments(appointmentsResult.appointments || [])
      setReservations(reservationsResult.reservations || [])
      setInquiries(inquiriesResult.inquiries || [])
      setSupportRequests(supportResult.supportRequests || [])
    } catch (err) {
      if (err.status === 401) {
        clearToken()
        window.location.hash = '#sign-in'
      } else {
        setState((curr) => ({ ...curr, error: err.message }))
      }
      if (err.message.includes('restricted')) {
        setTimeout(() => { window.location.hash = '#dashboard' }, 2000)
      }
    } finally {
      setState((curr) => ({ ...curr, loading: false }))
    }
  }

  useEffect(() => {
    if (!getToken()) {
      window.location.hash = '#sign-in'
      return
    }
    loadData()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listingFilter])

  async function handleModeration(listingId, status) {
    setState((curr) => ({ ...curr, actionId: listingId, error: '', message: '' }))
    try {
      await updateListingModeration(listingId, status)
      setListings((curr) => curr.map((l) => (l.id === listingId ? { ...l, moderation_status: status } : l)))
      const statsResult = await getAdminStats()
      setStats(statsResult.stats)
      setState((curr) => ({ ...curr, message: `Listing marked as ${status}.` }))
    } catch (err) {
      setState((curr) => ({ ...curr, error: `Moderation action failed: ${err.message}` }))
    } finally {
      setState((curr) => ({ ...curr, actionId: null }))
    }
  }

  async function handleDeleteListing(listingId, title) {
    if (!window.confirm(`Permanently delete "${title}"? This cannot be undone.`)) return
    setState((curr) => ({ ...curr, actionId: listingId, error: '', message: '' }))
    try {
      await deleteListingByAdmin(listingId)
      setListings((curr) => curr.filter((l) => l.id !== listingId))
      const statsResult = await getAdminStats()
      setStats(statsResult.stats)
      setState((curr) => ({ ...curr, message: 'Listing permanently removed.' }))
    } catch (err) {
      setState((curr) => ({ ...curr, error: `Failed to delete listing: ${err.message}` }))
    } finally {
      setState((curr) => ({ ...curr, actionId: null }))
    }
  }

  async function handleRoleChange(userId, newRole) {
    setState((curr) => ({ ...curr, actionId: userId, error: '', message: '' }))
    try {
      await updateUserRoleByAdmin(userId, newRole)
      setUsers((curr) => curr.map((u) => (u.id === userId ? { ...u, role: newRole } : u)))
      const statsResult = await getAdminStats()
      setStats(statsResult.stats)
      setState((curr) => ({ ...curr, message: `User role updated to ${newRole}.` }))
    } catch (err) {
      setState((curr) => ({ ...curr, error: `Failed to update role: ${err.message}` }))
    } finally {
      setState((curr) => ({ ...curr, actionId: null }))
    }
  }

  async function handleDeleteUser(userId, userName) {
    if (!window.confirm(`Permanently delete account for "${userName}"? All associated properties and inquiries will be removed.`)) return
    setState((curr) => ({ ...curr, actionId: userId, error: '', message: '' }))
    try {
      await deleteUserByAdmin(userId)
      setUsers((curr) => curr.filter((u) => u.id !== userId))
      const statsResult = await getAdminStats()
      setStats(statsResult.stats)
      setState((curr) => ({ ...curr, message: 'User account removed.' }))
    } catch (err) {
      setState((curr) => ({ ...curr, error: `Failed to delete user: ${err.message}` }))
    } finally {
      setState((curr) => ({ ...curr, actionId: null }))
    }
  }

  async function handleSupportStatus(supportRequest, status) {
    setState((curr) => ({ ...curr, actionId: supportRequest.id, error: '', message: '' }))
    try {
      const result = await updateAdminSupportRequestStatus(supportRequest.id, status)
      setSupportRequests((curr) => curr.map((item) => item.id === supportRequest.id ? { ...item, ...result.supportRequest } : item))
      setState((curr) => ({ ...curr, message: `Support request marked ${status}.` }))
    } catch (err) {
      setState((curr) => ({ ...curr, error: `Could not update support request: ${err.message}` }))
    } finally {
      setState((curr) => ({ ...curr, actionId: null }))
    }
  }

  function signOut() {
    clearToken()
    window.location.hash = '#top'
  }

  if (state.loading) {
    return <main className="flex min-h-screen items-center justify-center text-sm text-ink-muted">Loading administration console…</main>
  }

  if (state.error && !user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-page p-6">
        <div className="max-w-md rounded-xl border border-red-200 bg-white p-6 text-center">
          <p className="text-sm text-red-700" role="alert">{state.error}</p>
          <button type="button" onClick={loadData} className="mt-4 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white">Retry</button>
        </div>
      </main>
    )
  }

  const totalUsers = stats?.users?.reduce((acc, u) => acc + u.count, 0) || 0
  const tenantUsers = stats?.users?.find((u) => u.role === 'tenant')?.count || 0
  const listerUsers = stats?.users?.find((u) => u.role === 'lister')?.count || 0
  const adminUsers = stats?.users?.find((u) => u.role === 'admin')?.count || 0

  const totalListings = stats?.listings?.reduce((acc, l) => acc + l.count, 0) || 0
  const pendingCount = stats?.listings?.find((l) => l.moderation_status === 'pending')?.count || 0
  const approvedCount = stats?.listings?.find((l) => l.moderation_status === 'approved')?.count || 0
  const rejectedCount = stats?.listings?.find((l) => l.moderation_status === 'rejected')?.count || 0

  const totalAppointments = stats?.appointments?.reduce((acc, a) => acc + a.count, 0) || 0
  const pendingAppointments = stats?.appointments?.find((a) => a.status === 'requested')?.count || 0

  const totalReservations = stats?.reservations?.reduce((acc, r) => acc + r.count, 0) || 0

  const filteredUsers = users.filter((u) => {
    const matchesRole = !userRoleFilter || u.role === userRoleFilter
    const term = userSearch.toLowerCase()
    const matchesSearch = !term || u.full_name?.toLowerCase().includes(term) || u.email?.toLowerCase().includes(term) || u.phone?.includes(term)
    return matchesRole && matchesSearch
  })

  return (
    <main className="min-h-screen bg-page text-ink">
      <header className="sticky top-0 z-30 border-b border-border bg-surface shadow-xs">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 md:px-8">
          <div className="flex items-center gap-4">
            <a href="#top" className="text-2xl font-bold text-brand">
              nairent<span className="text-brand-muted">.</span>
            </a>
            <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800 flex items-center gap-1.5">
              <Shield size={14} /> Administrator Console
            </span>
          </div>
          <div className="flex items-center gap-4">
            <a href="#browse" className="text-xs font-semibold text-ink-muted hover:text-brand hidden sm:block">
              Browse Marketplace
            </a>
            <a href="#dashboard" className="text-xs font-semibold text-brand hover:underline hidden sm:block">
              Lister Workspace
            </a>
            <span className="hidden text-sm text-ink font-medium sm:block">{user?.full_name}</span>
            <button
              type="button"
              onClick={signOut}
              className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-ink-muted hover:bg-page hover:text-ink"
            >
              <LogOut size={14} /> Sign out
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 py-8 md:px-8">
        <div className="flex flex-col gap-2">
          <p className="text-[11px] font-semibold tracking-wide text-brand uppercase">PLATFORM GOVERNANCE &amp; QUALITY CONTROL</p>
          <h1 className="text-3xl font-semibold text-ink">Administration &amp; State Oversight</h1>
          <p className="text-sm text-ink-muted">
            Monitor Nairobi platform health, review pending listings, audit zero-viewing-fee compliance, and manage user accounts.
          </p>
        </div>

        {state.message && (
          <div className="mt-4 rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-xs font-semibold text-emerald-800 flex items-center gap-2" role="status">
            <CheckCircle2 size={16} /> {state.message}
          </div>
        )}

        {state.error && (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700" role="alert">
            <span>{state.error}</span>
            <button
              type="button"
              onClick={() => { setState((curr) => ({ ...curr, loading: true, error: '' })); loadData() }}
              className="rounded-md border border-red-300 px-3 py-1.5 font-semibold hover:bg-red-100"
            >
              Retry loading dashboard
            </button>
          </div>
        )}

        <div className="mt-8 flex flex-wrap gap-2 border-b border-border pb-3">
          {[
            { id: 'overview', label: 'Platform Stats & States', icon: Building2 },
            { id: 'moderation', label: `Listings Moderation (${pendingCount} pending)`, icon: ShieldAlert },
            { id: 'users', label: `Users (${totalUsers})`, icon: Users },
            { id: 'appointments', label: `Viewing Audits (${totalAppointments})`, icon: CalendarDays },
            { id: 'inquiries', label: `Inquiries (${stats?.inquiries || 0})`, icon: MessageCircle },
            { id: 'support', label: `Support (${supportRequests.filter((item) => item.status === 'open').length} open)`, icon: Mail },
          ].map((tab) => {
            const Icon = tab.icon
            const active = activeTab === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-xs font-semibold transition ${
                  active ? 'bg-brand text-white shadow-xs' : 'border border-border bg-surface text-ink-muted hover:bg-page hover:text-ink'
                }`}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            )
          })}
        </div>

        {activeTab === 'overview' && (
          <div className="mt-8 flex flex-col gap-8">
            <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-xl border border-border bg-surface p-5 shadow-xs">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-ink-muted">TOTAL USERS</p>
                  <Users size={18} className="text-brand" />
                </div>
                <p className="mt-3 text-3xl font-semibold">{totalUsers}</p>
                <div className="mt-3 flex gap-2 text-[11px] text-ink-muted">
                  <span className="font-semibold text-brand">{tenantUsers} tenants</span> · <span>{listerUsers} listers</span> · <span>{adminUsers} admins</span>
                </div>
              </div>

              <div className="rounded-xl border border-border bg-surface p-5 shadow-xs">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-ink-muted">LISTINGS AUDIT</p>
                  <Building2 size={18} className="text-brand" />
                </div>
                <p className="mt-3 text-3xl font-semibold">{totalListings}</p>
                <div className="mt-3 flex gap-2 text-[11px]">
                  <span className="text-emerald-700 font-semibold">{approvedCount} approved</span> ·{' '}
                  <span className="text-amber-700 font-semibold">{pendingCount} pending</span> ·{' '}
                  <span className="text-red-600 font-semibold">{rejectedCount} rejected</span>
                </div>
              </div>

              <div className="rounded-xl border border-border bg-surface p-5 shadow-xs">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-ink-muted">VIEWING REQUESTS</p>
                  <CalendarDays size={18} className="text-brand" />
                </div>
                <p className="mt-3 text-3xl font-semibold">{totalAppointments}</p>
                <div className="mt-3 flex gap-2 text-[11px] text-ink-muted">
                  <span className="font-semibold text-amber-700">{pendingAppointments} awaiting response</span> · <span>fees set per listing</span>
                </div>
              </div>

              <div className="rounded-xl border border-border bg-surface p-5 shadow-xs">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-ink-muted">RESERVATIONS &amp; INQUIRIES</p>
                  <MessageCircle size={18} className="text-brand" />
                </div>
                <p className="mt-3 text-3xl font-semibold">{totalReservations + (stats?.inquiries || 0)}</p>
                <div className="mt-3 flex gap-2 text-[11px] text-ink-muted">
                  <span>{totalReservations} reservations</span> · <span>{stats?.inquiries || 0} tenant inquiries</span>
                </div>
              </div>
            </section>

            <section className="grid gap-6 lg:grid-cols-2">
              <div className="rounded-xl border border-border bg-surface p-6">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-lg text-ink">Action Required: Pending Listings</h3>
                  <button type="button" onClick={() => { setActiveTab('moderation'); setListingFilter('pending') }} className="text-xs font-semibold text-brand hover:underline">
                    View all ({pendingCount})
                  </button>
                </div>
                <p className="mt-1 text-xs text-ink-muted">New submissions requiring verification before appearing in search.</p>
                <div className="mt-4 flex flex-col gap-3">
                  {listings.filter((l) => l.moderation_status === 'pending').slice(0, 3).map((l) => (
                    <div key={l.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                      <div>
                        <p className="font-semibold text-sm">{l.title}</p>
                        <p className="text-xs text-ink-muted">{l.location_name} · KSh {Number(l.monthly_rent).toLocaleString()} · Lister: {l.lister_name}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleModeration(l.id, 'approved')}
                        className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
                      >
                        Approve
                      </button>
                    </div>
                  ))}
                  {pendingCount === 0 && (
                    <p className="rounded-lg border border-dashed border-border p-4 text-center text-xs text-ink-muted">
                      All listings are up-to-date and moderated.
                    </p>
                  )}
                </div>
              </div>

              <div className="rounded-xl border border-border bg-surface p-6">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-lg text-ink">Viewing Fee Transparency</h3>
                  <span className="rounded bg-brand-tint px-2 py-0.5 text-[10px] font-semibold text-brand">Shown per listing</span>
                </div>
                <p className="mt-1 text-xs text-ink-muted">Listers set the fee for each property. Renters see it before sending a viewing request.</p>
                <div className="mt-4 space-y-3 text-xs leading-relaxed text-ink">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                    <span>Each listing may have no fee or a non-negative fee set by its lister.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                    <span>The amount appears on search cards, listing details, and viewing requests.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                    <span>Nairent does not collect viewing fee payments; renters confirm payment directly with the lister.</span>
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}

        {activeTab === 'moderation' && (
          <section className="mt-8">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
              <div>
                <h2 className="text-xl font-semibold text-ink">Listings Moderation Queue</h2>
                <p className="text-xs text-ink-muted">Review, approve, or reject listings before they appear on the tenant search map.</p>
              </div>
              <div className="flex gap-2">
                {[
                  { label: 'All Listings', val: '' },
                  { label: 'Pending Audit', val: 'pending' },
                  { label: 'Approved', val: 'approved' },
                  { label: 'Rejected', val: 'rejected' },
                ].map((tab) => (
                  <button
                    key={tab.label}
                    type="button"
                    onClick={() => setListingFilter(tab.val)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                      listingFilter === tab.val ? 'bg-brand text-white' : 'border border-border bg-surface text-ink-muted'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-4">
              {listings.length === 0 && (
                <p className="rounded-xl border border-dashed border-border bg-surface p-8 text-center text-sm text-ink-muted">
                  No listings found for this filter.
                </p>
              )}
              {listings.map((listing) => {
                const busy = state.actionId === listing.id
                return (
                  <article key={listing.id} className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-5 md:flex-row md:items-center md:justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold text-base text-ink">{listing.title}</h3>
                        <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase ${
                          listing.moderation_status === 'approved'
                            ? 'bg-emerald-100 text-emerald-800'
                            : listing.moderation_status === 'rejected'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {listing.moderation_status}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-ink-muted">
                        {listing.location_name} · KSh {Number(listing.monthly_rent).toLocaleString()} / month · Viewing fee: {Number(listing.viewing_fee) > 0 ? `KSh ${Number(listing.viewing_fee).toLocaleString()}` : 'None'} · {listing.bedrooms} bed(s) · Lister: {listing.lister_name} ({listing.lister_email})
                      </p>
                      <p className="mt-2 text-xs text-ink leading-relaxed max-w-3xl line-clamp-2">
                        {listing.description}
                      </p>
                      {listing.amenities?.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {listing.amenities.map((a) => (
                            <span key={a} className="rounded bg-page px-2 py-0.5 text-[10px] text-ink-muted">{a}</span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <a
                        href="#browse"
                        className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-semibold text-ink-muted hover:bg-page"
                      >
                        <Eye size={14} /> Preview
                      </a>
                      {listing.moderation_status !== 'approved' && (
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => handleModeration(listing.id, 'approved')}
                          className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                        >
                          <ShieldCheck size={14} /> Approve
                        </button>
                      )}
                      {listing.moderation_status !== 'rejected' && (
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => handleModeration(listing.id, 'rejected')}
                          className="flex items-center gap-1.5 rounded-lg border border-amber-300 px-3 py-2 text-xs font-semibold text-amber-700 hover:bg-amber-50 disabled:opacity-50"
                        >
                          <XCircle size={14} /> Reject
                        </button>
                      )}
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => handleDeleteListing(listing.id, listing.title)}
                        className="rounded-lg border border-red-200 p-2 text-red-600 hover:bg-red-50 disabled:opacity-50"
                        title="Delete listing permanently"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </article>
                )
              })}
            </div>
          </section>
        )}

        {activeTab === 'users' && (
          <section className="mt-8">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
              <div>
                <h2 className="text-xl font-semibold text-ink">User Account Governance</h2>
                <p className="text-xs text-ink-muted">Audit registered tenants, landlords, and system administrators.</p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
                  <input
                    type="text"
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    placeholder="Search by name, email, phone…"
                    className="h-9 w-60 rounded-lg border border-border bg-surface pl-9 pr-3 text-xs"
                  />
                </div>
                <select
                  value={userRoleFilter}
                  onChange={(e) => setUserRoleFilter(e.target.value)}
                  className="h-9 rounded-lg border border-border bg-surface px-2.5 text-xs"
                >
                  <option value="">All Roles</option>
                  <option value="tenant">Tenants</option>
                  <option value="lister">Listers</option>
                  <option value="admin">Admins</option>
                </select>
              </div>
            </div>

            <div className="mt-6 overflow-hidden rounded-xl border border-border bg-surface">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-border bg-page text-ink-muted uppercase">
                    <tr>
                      <th className="p-3.5 font-semibold">User</th>
                      <th className="p-3.5 font-semibold">Contact Info</th>
                      <th className="p-3.5 font-semibold">Role</th>
                      <th className="p-3.5 font-semibold">Email</th>
                      <th className="p-3.5 font-semibold">Activity</th>
                      <th className="p-3.5 font-semibold">Registered</th>
                      <th className="p-3.5 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredUsers.length === 0 && (
                      <tr>
                        <td colSpan="7" className="p-6 text-center text-ink-muted">
                          No users found matching your search.
                        </td>
                      </tr>
                    )}
                    {filteredUsers.map((u) => {
                      const busy = state.actionId === u.id
                      const isSelf = u.id === user?.id
                      return (
                        <tr key={u.id} className="hover:bg-page/50">
                          <td className="p-3.5 font-medium text-ink">
                            {u.full_name}
                            {isSelf && <span className="ml-2 rounded bg-brand-tint px-1.5 py-0.5 text-[10px] text-brand">You</span>}
                          </td>
                          <td className="p-3.5 text-ink-muted">
                            <div className="flex flex-col gap-0.5">
                              <span className="flex items-center gap-1 text-ink"><Mail size={12} /> {u.email}</span>
                              {u.phone && <span className="flex items-center gap-1 text-ink-muted"><Phone size={12} /> {u.phone}</span>}
                            </div>
                          </td>
                          <td className="p-3.5">
                            <select
                              value={u.role}
                              disabled={busy || isSelf}
                              onChange={(e) => handleRoleChange(u.id, e.target.value)}
                              className="rounded border border-border bg-surface px-2 py-1 text-xs font-semibold capitalize"
                            >
                              <option value="tenant">Tenant</option>
                              <option value="lister">Lister</option>
                              <option value="admin">Admin</option>
                            </select>
                          </td>
                          <td className="p-3.5">
                            <span className={`rounded-full px-2 py-1 text-[10px] font-semibold ${u.email_verified_at ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                              {u.email_verified_at ? 'Confirmed' : 'Pending'}
                            </span>
                          </td>
                          <td className="p-3.5 text-ink-muted">
                            {u.role === 'lister' ? `${u.listing_count} properties` : `${u.appointment_count} appointments`}
                          </td>
                          <td className="p-3.5 text-ink-muted">
                            {new Date(u.created_at).toLocaleDateString()}
                          </td>
                          <td className="p-3.5 text-right">
                            {!isSelf && (
                              <button
                                type="button"
                                disabled={busy}
                                onClick={() => handleDeleteUser(u.id, u.full_name)}
                                className="rounded p-1.5 text-red-600 hover:bg-red-50 disabled:opacity-50"
                                title="Delete user"
                              >
                                <Trash2 size={15} />
                              </button>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}

        {activeTab === 'appointments' && (
          <section className="mt-8 flex flex-col gap-8">
            <div>
              <div className="border-b border-border pb-3">
                <h2 className="text-xl font-semibold text-ink">Platform Viewing Requests Audit</h2>
                <p className="text-xs text-ink-muted">Review viewing requests and the viewing fees set on each property.</p>
              </div>

              <div className="mt-4 overflow-hidden rounded-xl border border-border bg-surface">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="border-b border-border bg-page text-ink-muted uppercase">
                      <tr>
                        <th className="p-3.5 font-semibold">Property</th>
                        <th className="p-3.5 font-semibold">Tenant / Guest</th>
                        <th className="p-3.5 font-semibold">Lister</th>
                        <th className="p-3.5 font-semibold">Viewing fee</th>
                        <th className="p-3.5 font-semibold">Date &amp; Time</th>
                        <th className="p-3.5 font-semibold">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {appointments.length === 0 && (
                        <tr>
                          <td colSpan="6" className="p-6 text-center text-ink-muted">No viewing requests on the platform yet.</td>
                        </tr>
                      )}
                      {appointments.map((a) => (
                        <tr key={a.id} className="hover:bg-page/50">
                          <td className="p-3.5 font-medium text-ink">
                            {a.title}
                            <p className="text-[11px] text-ink-muted">{a.location_name}</p>
                          </td>
                          <td className="p-3.5">
                            <p className="font-medium text-ink">{a.guest_name}</p>
                            <p className="text-[11px] text-ink-muted">{a.guest_email}</p>
                          </td>
                          <td className="p-3.5">
                            <p className="font-medium text-ink">{a.lister_name}</p>
                            <p className="text-[11px] text-ink-muted">{a.lister_email} · {a.lister_phone}</p>
                          </td>
                          <td className="p-3.5 text-ink-muted">{Number(a.viewing_fee) > 0 ? `KSh ${Number(a.viewing_fee).toLocaleString()}` : 'None'}</td>
                          <td className="p-3.5 text-ink-muted">
                            {a.preferred_date} at {String(a.preferred_time).slice(0, 5)}
                          </td>
                          <td className="p-3.5">
                            <span className="rounded-full bg-brand-tint px-2.5 py-1 text-[10px] font-semibold uppercase text-brand">
                              {a.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div>
              <div className="border-b border-border pb-3">
                <h2 className="text-xl font-semibold text-ink">Platform Reservations Audit</h2>
                <p className="text-xs text-ink-muted">All zero-payment reservations submitted by tenants.</p>
              </div>

              <div className="mt-4 overflow-hidden rounded-xl border border-border bg-surface">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="border-b border-border bg-page text-ink-muted uppercase">
                      <tr>
                        <th className="p-3.5 font-semibold">Property</th>
                        <th className="p-3.5 font-semibold">Tenant / Guest</th>
                        <th className="p-3.5 font-semibold">Lister</th>
                        <th className="p-3.5 font-semibold">Move-in Date</th>
                        <th className="p-3.5 font-semibold">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {reservations.length === 0 && (
                        <tr>
                          <td colSpan="5" className="p-6 text-center text-ink-muted">No reservations recorded yet.</td>
                        </tr>
                      )}
                      {reservations.map((r) => (
                        <tr key={r.id} className="hover:bg-page/50">
                          <td className="p-3.5 font-medium text-ink">
                            {r.title}
                            <p className="text-[11px] text-ink-muted">{r.location_name}</p>
                          </td>
                          <td className="p-3.5">
                            <p className="font-medium text-ink">{r.guest_name}</p>
                            <p className="text-[11px] text-ink-muted">{r.guest_email}</p>
                          </td>
                          <td className="p-3.5">
                            <p className="font-medium text-ink">{r.lister_name}</p>
                            <p className="text-[11px] text-ink-muted">{r.lister_email}</p>
                          </td>
                          <td className="p-3.5 text-ink-muted">
                            {r.move_in_date || 'Flexible'}
                          </td>
                          <td className="p-3.5">
                            <span className="rounded-full bg-brand-tint px-2.5 py-1 text-[10px] font-semibold uppercase text-brand">
                              {r.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </section>
        )}

        {activeTab === 'inquiries' && (
          <section className="mt-8">
            <div className="border-b border-border pb-3">
              <h2 className="text-xl font-semibold text-ink">Tenant &amp; Guest Inquiries</h2>
              <p className="text-xs text-ink-muted">Review recent messages and contact details sent to property listers.</p>
            </div>

            <div className="mt-4 overflow-hidden rounded-xl border border-border bg-surface">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px] text-left text-xs">
                  <thead className="border-b border-border bg-page text-ink-muted uppercase">
                    <tr>
                      <th className="p-3.5 font-semibold">Message</th>
                      <th className="p-3.5 font-semibold">From</th>
                      <th className="p-3.5 font-semibold">Property</th>
                      <th className="p-3.5 font-semibold">Lister</th>
                      <th className="p-3.5 font-semibold">Received</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {inquiries.length === 0 && (
                      <tr>
                        <td colSpan="5" className="p-6 text-center text-ink-muted">No inquiries recorded yet.</td>
                      </tr>
                    )}
                    {inquiries.map((inquiry) => {
                      const name = inquiry.tenant_name || inquiry.guest_name || 'Guest'
                      const email = inquiry.tenant_email || inquiry.guest_email
                      const phone = inquiry.guest_phone
                      return (
                        <tr key={inquiry.id} className="align-top hover:bg-page/50">
                          <td className="max-w-[360px] whitespace-normal p-3.5 text-ink">
                            <p className="leading-relaxed">{inquiry.message}</p>
                            {phone && <a href={`tel:${phone}`} className="mt-2 inline-flex items-center gap-1 text-brand"><Phone size={12} />{phone}</a>}
                          </td>
                          <td className="p-3.5">
                            <p className="font-medium text-ink">{name}</p>
                            {email && <a href={`mailto:${email}`} className="mt-1 inline-flex items-center gap-1 text-ink-muted hover:text-brand"><Mail size={12} />{email}</a>}
                          </td>
                          <td className="p-3.5">
                            <p className="font-medium text-ink">{inquiry.title}</p>
                            <p className="mt-1 text-ink-muted">{inquiry.location_name}</p>
                          </td>
                          <td className="p-3.5">
                            <p className="font-medium text-ink">{inquiry.lister_name}</p>
                            <a href={`mailto:${inquiry.lister_email}`} className="mt-1 inline-flex items-center gap-1 text-ink-muted hover:text-brand"><Mail size={12} />{inquiry.lister_email}</a>
                          </td>
                          <td className="whitespace-nowrap p-3.5 text-ink-muted">{new Date(inquiry.created_at).toLocaleString()}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
              {inquiries.length === 100 && <p className="border-t border-border p-3 text-center text-[11px] text-ink-muted">Showing the 100 most recent inquiries.</p>}
            </div>
          </section>
        )}

        {activeTab === 'support' && (
          <section className="mt-8">
            <div className="border-b border-border pb-3">
              <h2 className="text-xl font-semibold text-ink">Support inbox</h2>
              <p className="text-xs text-ink-muted">Review messages from the public help page and contact people using the email address they provided.</p>
            </div>

            <div className="mt-4 grid gap-3">
              {supportRequests.length === 0 && (
                <p className="rounded-xl border border-dashed border-border bg-surface p-8 text-center text-sm text-ink-muted">No support requests yet.</p>
              )}
              {supportRequests.map((request) => {
                const busy = state.actionId === request.id
                return (
                  <article key={request.id} className="rounded-xl border border-border bg-surface p-5">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-semibold text-ink">{request.full_name}</h3>
                          <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase ${request.status === 'open' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>{request.status}</span>
                          <span className="rounded-full bg-page px-2.5 py-1 text-[10px] font-semibold capitalize text-ink-muted">{request.topic}</span>
                        </div>
                        <a href={`mailto:${request.email}`} className="mt-1 inline-flex items-center gap-1.5 text-xs text-brand hover:underline"><Mail size={13} />{request.email}</a>
                      </div>
                      <button type="button" disabled={busy} onClick={() => handleSupportStatus(request, request.status === 'open' ? 'resolved' : 'open')} className="shrink-0 rounded-lg border border-border px-3 py-2 text-xs font-semibold text-ink-muted hover:bg-page disabled:opacity-50">
                        {busy ? 'Saving…' : request.status === 'open' ? 'Mark resolved' : 'Reopen'}
                      </button>
                    </div>
                    <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-ink">{request.message}</p>
                    <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 border-t border-border pt-3 text-[11px] text-ink-muted">
                      <span>Received {new Date(request.created_at).toLocaleString()}</span>
                      <span className="font-mono">Ref: {request.id}</span>
                    </div>
                  </article>
                )
              })}
              {supportRequests.length === 200 && <p className="text-center text-[11px] text-ink-muted">Showing the 200 most recent support requests.</p>}
            </div>
          </section>
        )}
      </div>
    </main>
  )
}
