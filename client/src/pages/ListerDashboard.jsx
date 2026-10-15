import { useEffect, useState } from 'react'
import { ArrowLeft, Building2, Plus, LogOut } from 'lucide-react'
import { createListing, getMyListings, getToken } from '../lib/api.js'

const emptyForm = { title: '', description: '', monthlyRent: '', bedrooms: '0', location: '' }

export default function ListerDashboard() {
  const [listings, setListings] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [state, setState] = useState({ loading: true, saving: false, error: '', success: '' })

  useEffect(() => {
    if (!getToken()) {
      window.location.hash = '#list-a-property'
      return
    }
    getMyListings()
      .then((result) => setListings(result.listings))
      .catch((error) => setState({ loading: false, saving: false, error: error.message, success: '' }))
      .finally(() => setState((current) => ({ ...current, loading: false })))
  }, [])

  async function submit(event) {
    event.preventDefault()
    setState((current) => ({ ...current, saving: true, error: '', success: '' }))
    try {
      const result = await createListing(form)
      setListings((current) => [result.listing, ...current])
      setForm(emptyForm)
      setState({ loading: false, saving: false, error: '', success: 'Listing submitted for review.' })
    } catch (error) {
      setState((current) => ({ ...current, saving: false, error: error.message }))
    }
  }

  function update(name, value) {
    setForm((current) => ({ ...current, [name]: value }))
  }

  return (
    <main className="min-h-screen overflow-x-hidden bg-page px-4 py-6 sm:px-6 md:px-14 md:py-12">
      <div className="mx-auto flex w-full max-w-[1180px] min-w-0 flex-col gap-8">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <a href="#top" className="flex min-w-0 items-center gap-2 text-sm font-medium text-brand"><ArrowLeft size={17} /> Back to Nairent</a>
          <button type="button" onClick={() => { window.localStorage.removeItem('nairent_token'); window.location.hash = '#top' }} className="flex items-center gap-2 text-sm text-ink-muted"><LogOut size={16} /> Sign out</button>
        </header>
        <section>
          <p className="text-[11px] font-semibold tracking-wide text-brand">LISTER WORKSPACE</p>
          <h1 className="mt-2 max-w-[700px] text-[30px] font-semibold leading-tight text-ink sm:text-[36px]">List and manage your properties.</h1>
          <p className="mt-3 max-w-[650px] text-sm leading-relaxed text-ink-muted">Add accurate details for renters. Every new listing is submitted for review before it appears publicly.</p>
        </section>
        <div className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
          <form onSubmit={submit} className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-6">
            <div className="flex items-center gap-3"><Plus size={20} className="text-brand" /><h2 className="text-lg font-semibold text-ink">Add a property</h2></div>
            <input required value={form.title} onChange={(event) => update('title', event.target.value)} placeholder="Property title" className="h-12 rounded-lg border border-border px-3 text-sm" />
            <select required value={form.location} onChange={(event) => update('location', event.target.value)} className="h-12 rounded-lg border border-border px-3 text-sm">
              <option value="">Select Nairobi location</option>
              {['Kilimani', 'South B', 'Kileleshwa', 'Langata', 'Lavington', 'Westlands', 'Parklands', 'Kasarani', 'Embakasi', 'Donholm', 'Runda', 'Karen', 'Roysambu', 'Kahawa West', 'Ruaka', 'Umoja', 'Kasarani Mwiki', 'Ngong Road', 'Madaraka'].map((location) => <option key={location}>{location}</option>)}
            </select>
            <div className="grid grid-cols-2 gap-3">
              <input required min="1" type="number" value={form.monthlyRent} onChange={(event) => update('monthlyRent', event.target.value)} placeholder="Monthly rent (KSh)" className="h-12 rounded-lg border border-border px-3 text-sm" />
              <input required min="0" type="number" value={form.bedrooms} onChange={(event) => update('bedrooms', event.target.value)} placeholder="Bedrooms" className="h-12 rounded-lg border border-border px-3 text-sm" />
            </div>
            <textarea required minLength="10" rows="5" value={form.description} onChange={(event) => update('description', event.target.value)} placeholder="Describe the property, amenities and nearby transport." className="rounded-lg border border-border p-3 text-sm" />
            {state.error && <p className="text-sm text-red-600" role="alert">{state.error}</p>}
            {state.success && <p className="text-sm text-brand" role="status">{state.success}</p>}
            <button disabled={state.saving} className="flex h-12 items-center justify-center rounded-lg bg-brand text-sm font-semibold text-white disabled:opacity-60">{state.saving ? 'Submitting…' : 'Submit property for review'}</button>
          </form>
          <section className="rounded-xl border border-border bg-surface p-6">
            <h2 className="text-lg font-semibold text-ink">Your properties</h2>
            {state.loading && <p className="mt-6 text-sm text-ink-muted">Loading properties…</p>}
            {!state.loading && listings.length === 0 && <p className="mt-6 text-sm text-ink-muted">You have not added a property yet.</p>}
            <div className="mt-5 flex min-w-0 flex-col gap-3">{listings.map((listing) => (
              <article key={listing.id} className="flex min-w-0 items-start justify-between gap-3 rounded-lg border border-border p-4">
                <div className="flex min-w-0 gap-3"><Building2 size={20} className="mt-0.5 shrink-0 text-brand" /><div className="min-w-0"><h3 className="truncate font-semibold text-ink">{listing.title}</h3><p className="mt-1 break-words text-xs text-ink-muted">{listing.location_name} · KSh {Number(listing.monthly_rent).toLocaleString()} · {listing.bedrooms === 0 ? 'Studio' : `${listing.bedrooms} bedrooms`}</p></div></div>
                <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${listing.moderation_status === 'approved' ? 'bg-brand-tint text-brand' : 'bg-amber-50 text-amber-700'}`}>{listing.moderation_status === 'pending' ? 'Pending verification' : listing.moderation_status}</span>
              </article>
            ))}</div>
          </section>
        </div>
      </div>
    </main>
  )
}
