// Shows a renters appointments, messages, saved searches, and alerts.
import { useEffect, useState } from 'react'
import { ArrowLeft, CalendarDays, Heart, LogOut, MessageSquare, Search, Trash2 } from 'lucide-react'
import { clearToken, deleteSavedSearch, getCurrentUser, getMyAppointments, getMyTenantInquiries, getSavedSearches, getToken, updateSavedSearchNotifications } from '../lib/api.js'
import FeedbackToast from '../components/FeedbackToast.jsx'
import useFeedback from '../hooks/useFeedback.js'

export default function TenantDashboard() {
  const [user, setUser] = useState(null)
  const [appointments, setAppointments] = useState([])
  const [searches, setSearches] = useState([])
  const [inquiries, setInquiries] = useState([])
  const [state, setState] = useState({ loading: true, error: '' })
  const [deletingSearchId, setDeletingSearchId] = useState(null)
  const [updatingSearchId, setUpdatingSearchId] = useState(null)
  const { feedback, notify, dismiss } = useFeedback()

  useEffect(() => {
    if (!getToken()) {
      window.location.hash = '#tenant-sign-up'
      return
    }
    loadAccount()
  }, [])

  async function loadAccount() {
    setState({ loading: true, error: '' })
    try {
      const [userResult, appointmentResult, searchResult, inquiryResult] = await Promise.all([
        getCurrentUser(), getMyAppointments(), getSavedSearches(), getMyTenantInquiries(),
      ])
      if (userResult.user.role !== 'tenant' && userResult.user.role !== 'admin') {
        setState({ loading: false, error: 'This account does not have a tenant dashboard.' })
        return
      }
      setUser(userResult.user)
      setAppointments(appointmentResult.appointments || [])
      setSearches(searchResult.searches || [])
      setInquiries(inquiryResult.inquiries || [])
    } catch (error) {
      if (error.status === 401) {
        clearToken()
        window.location.hash = '#tenant-sign-up'
      } else {
        setState({ loading: false, error: error.message })
      }
    } finally {
      setState((current) => ({ ...current, loading: false }))
    }
  }

  async function removeSearch(id) {
    setDeletingSearchId(id)
    try {
      await deleteSavedSearch(id)
      setSearches((current) => current.filter((search) => search.id !== id))
      notify('Saved search deleted.')
    } catch (error) {
      notify(error.message, 'error')
    } finally {
      setDeletingSearchId(null)
    }
  }

  async function toggleSearchAlerts(search) {
    const notifyNewListings = !search.notify_new_listings
    setUpdatingSearchId(search.id)
    try {
      const result = await updateSavedSearchNotifications(search.id, notifyNewListings)
      setSearches((current) => current.map((item) => item.id === search.id
        ? { ...item, ...result.search }
        : item))
      if (notifyNewListings && !result.emailDeliveryConfigured) {
        notify('Email alert preference saved, but the server email service is not configured yet.', 'error')
      } else {
        notify(notifyNewListings ? 'Email alerts enabled for this search.' : 'Email alerts turned off.')
      }
    } catch (error) {
      notify(error.message, 'error')
    } finally {
      setUpdatingSearchId(null)
    }
  }

  function signOut() {
    clearToken()
    window.location.hash = '#top'
  }

  if (state.loading) return <main className="flex min-h-screen items-center justify-center text-sm text-ink-muted">Loading your Nairent account…</main>
  if (state.error && !user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-page p-6">
        <div className="max-w-md rounded-xl border border-red-200 bg-white p-6 text-center">
          <p className="text-sm text-red-700" role="alert">{state.error}</p>
          <button type="button" onClick={loadAccount} className="mt-4 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white">Retry</button>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-page">
      <FeedbackToast feedback={feedback} onDismiss={dismiss} />
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex h-20 max-w-6xl items-center justify-between px-5 md:px-8">
          <a href="#browse" className="flex items-center gap-2 text-sm font-semibold text-brand">
            <ArrowLeft size={17} /> Browse homes
          </a>
          <div className="flex items-center gap-4">
            <span className="hidden text-sm text-ink-muted sm:block">{user?.full_name}</span>
            <button type="button" onClick={signOut} className="flex items-center gap-2 text-sm font-semibold text-ink-muted hover:text-brand">
              <LogOut size={16} /> Sign out
            </button>
          </div>
        </div>
      </header>
      <div className="mx-auto max-w-6xl px-5 py-10 md:px-8">
        <p className="text-[11px] font-semibold tracking-wide text-brand">YOUR NAIRENT ACCOUNT</p>
        <h1 className="mt-2 text-3xl font-semibold text-ink">Your rental journey</h1>
        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          <section className="rounded-xl border border-border bg-surface p-5">
            <div className="flex items-center gap-3">
              <CalendarDays className="text-brand" />
              <div>
                <h2 className="text-xl font-semibold">Viewing requests</h2>
                <p className="text-sm text-ink-muted">Track your viewing requests and the fee shown on each property.</p>
              </div>
            </div>
            <div className="mt-5 flex flex-col gap-3">
              {appointments.length === 0 && (
                <p className="rounded-lg border border-dashed border-border p-4 text-sm text-ink-muted">No viewing requests yet.</p>
              )}
              {appointments.map((appointment) => (
                <article key={appointment.id} className="rounded-lg border border-border p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">{appointment.title}</p>
                      <p className="text-xs text-ink-muted">{appointment.location_name}</p>
                      <p className="mt-1 text-xs font-medium text-brand">{Number(appointment.viewing_fee) > 0 ? `Viewing fee: KSh ${Number(appointment.viewing_fee).toLocaleString()}` : 'No viewing fee'}</p>
                    </div>
                    <span className="rounded-full bg-brand-tint px-2 py-1 text-[10px] font-semibold uppercase text-brand">
                      {appointment.status}
                    </span>
                  </div>
                  <p className="mt-3 text-xs text-ink-muted">
                    {appointment.preferred_date} at {String(appointment.preferred_time).slice(0, 5)}
                  </p>
                </article>
              ))}
            </div>
          </section>

          <section className="rounded-xl border border-border bg-surface p-5">
            <div className="flex items-center gap-3">
              <MessageSquare className="text-brand" />
              <div>
                <h2 className="text-xl font-semibold">My inquiries</h2>
                <p className="text-sm text-ink-muted">Questions sent to listers.</p>
              </div>
            </div>
            <div className="mt-5 flex flex-col gap-3">
              {inquiries.length === 0 && (
                <p className="rounded-lg border border-dashed border-border p-4 text-sm text-ink-muted">No questions sent yet.</p>
              )}
              {inquiries.map((inquiry) => (
                <article key={inquiry.id} className="rounded-lg border border-border p-4">
                  <p className="font-semibold">{inquiry.title}</p>
                  <p className="text-xs text-ink-muted">{inquiry.location_name} · Lister: {inquiry.lister_name}</p>
                  <p className="mt-2 text-xs italic bg-page p-2 rounded text-ink">"{inquiry.message}"</p>
                  <p className="mt-2 text-[10px] text-ink-muted">{new Date(inquiry.created_at).toLocaleDateString()}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="rounded-xl border border-border bg-surface p-5">
            <div className="flex items-center gap-3">
              <Heart className="text-brand" />
              <div>
                <h2 className="text-xl font-semibold">Saved searches</h2>
                <p className="text-sm text-ink-muted">Filters you want to revisit.</p>
              </div>
            </div>
            <div className="mt-5 flex flex-col gap-3">
              {searches.length === 0 && (
                <p className="rounded-lg border border-dashed border-border p-4 text-sm text-ink-muted">No saved searches yet.</p>
              )}
              {searches.map((search) => (
                <article key={search.id} className="flex items-center justify-between gap-3 rounded-lg border border-border p-4">
                  <div>
                    <p className="font-semibold">{search.location_name || 'All Nairobi locations'}</p>
                    <p className="mt-1 text-xs text-ink-muted">
                      {search.max_rent ? `Up to KSh ${Number(search.max_rent).toLocaleString()}` : 'Any budget'} ·{' '}
                      {search.bedrooms ? `${search.bedrooms}+ bedrooms` : 'Any bedrooms'}
                    </p>
                  </div>
                  <label className="inline-flex shrink-0 items-center gap-2 text-xs font-medium text-ink-muted">
                    <input
                      type="checkbox"
                      checked={Boolean(search.notify_new_listings)}
                      disabled={updatingSearchId === search.id}
                      onChange={() => toggleSearchAlerts(search)}
                    />
                    {updatingSearchId === search.id ? 'Updating…' : 'Email alerts'}
                  </label>
                  <button
                    type="button"
                    onClick={() => removeSearch(search.id)}
                    disabled={deletingSearchId === search.id}
                    className="rounded-lg p-2 text-ink-muted hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                    aria-label="Delete saved search"
                  >
                    <Trash2 size={17} />
                  </button>
                </article>
              ))}
            </div>
          </section>
        </div>
        <a href="#browse" className="mt-8 inline-flex h-12 items-center gap-2 rounded-lg bg-brand px-5 text-sm font-semibold text-white">
          <Search size={17} /> Find a home
        </a>
      </div>
    </main>
  )
}
