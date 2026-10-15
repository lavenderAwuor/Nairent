import { useEffect, useState } from 'react'
import { BedDouble, CalendarDays, ChevronLeft, ChevronRight, Mail, MapPin, Search, X } from 'lucide-react'
import { requestAppointment, reserveListing, searchListings, listLocations } from '../lib/api.js'
import fallbackPropertyImage from '../assets/landing/property-photograph-1.png'

const bedrooms = ['Any bedrooms', '1', '2', '3']
const budgets = [
  { label: 'Any budget', value: '' },
  { label: 'Up to KSh 10,000', value: '10000' },
  { label: 'Up to KSh 15,000', value: '15000' },
  { label: 'Up to KSh 25,000', value: '25000' },
  { label: 'KSh 25,000–40,000', value: '40000' },
  { label: 'KSh 40,000–65,000', value: '65000' },
  { label: 'Up to KSh 100,000', value: '100000' },
]
const today = new Date().toISOString().split('T')[0]
const availabilityOptions = [
  { label: 'Any availability', value: '' },
  { label: 'Available now', value: 'available' },
  { label: 'Available this month', value: 'available_this_month' },
]

function AppointmentDialog({ listing, onClose }) {
  const [form, setForm] = useState({ guestName: '', guestEmail: '', preferredDate: '', preferredTime: '', note: '' })
  const [state, setState] = useState({ loading: false, error: '', success: false })

  async function submit(event) {
    event.preventDefault()
    setState({ loading: true, error: '', success: false })
    try {
      await requestAppointment({ listingId: listing.id, ...form })
      setState({ loading: false, error: '', success: true })
    } catch (error) {
      setState({ loading: false, error: error.message, success: false })
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-5" role="presentation">
      <div className="w-full max-w-[480px] rounded-xl bg-surface p-6 shadow-xl" role="dialog" aria-modal="true" aria-labelledby="appointment-title">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold text-brand">REQUEST A VIEWING</p>
            <h2 id="appointment-title" className="mt-2 text-xl font-semibold text-ink">{listing.title}</h2>
            <p className="mt-1 text-xs text-ink-muted">{listing.location_name} · Free viewing</p>
          </div>
          <button type="button" onClick={onClose} className="text-ink-muted hover:text-ink" aria-label="Close">
            <X size={20} />
          </button>
        </div>
        {state.success ? (
          <div className="mt-8 rounded-lg bg-brand-tint p-4 text-sm leading-relaxed text-brand">
            Viewing request sent. The lister will confirm the appointment. Nairent does not charge a booking fee.
          </div>
        ) : (
          <form onSubmit={submit} className="mt-7 flex flex-col gap-4">
            <label className="flex flex-col gap-2 text-sm font-medium text-ink">
              Your name
              <input required value={form.guestName} onChange={(event) => setForm({ ...form, guestName: event.target.value })} className="h-12 rounded-lg border border-border px-3 text-sm" placeholder="Enter your name" />
            </label>
            <label className="flex flex-col gap-2 text-sm font-medium text-ink">
              Email address
              <input required type="email" value={form.guestEmail} onChange={(event) => setForm({ ...form, guestEmail: event.target.value })} className="h-12 rounded-lg border border-border px-3 text-sm" placeholder="you@example.com" />
            </label>
            <label className="flex flex-col gap-2 text-sm font-medium text-ink">
              Preferred date
              <input required type="date" min={today} value={form.preferredDate} onChange={(event) => setForm({ ...form, preferredDate: event.target.value })} className="h-12 rounded-lg border border-border px-3 text-sm" />
            </label>
            <label className="flex flex-col gap-2 text-sm font-medium text-ink">
              Preferred time
              <input required type="time" value={form.preferredTime} onChange={(event) => setForm({ ...form, preferredTime: event.target.value })} className="h-12 rounded-lg border border-border px-3 text-sm" />
            </label>
            <label className="flex flex-col gap-2 text-sm font-medium text-ink">
              Note <span className="font-normal text-ink-muted">(optional)</span>
              <textarea rows="3" maxLength="500" value={form.note} onChange={(event) => setForm({ ...form, note: event.target.value })} className="rounded-lg border border-border p-3 text-sm" placeholder="Anything the lister should know?" />
            </label>
            {state.error && <p className="text-xs text-red-600" role="alert">{state.error}</p>}
            <p className="text-xs leading-relaxed text-ink-muted">This requests a free viewing appointment. Nairent does not charge a booking or viewing fee.</p>
            <button disabled={state.loading} className="h-12 rounded-lg bg-brand text-sm font-semibold text-white disabled:opacity-60">
              {state.loading ? 'Sending request…' : 'Request viewing'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

function ReservationDialog({ listing, onClose }) {
  const [form, setForm] = useState({ guestName: '', guestEmail: '', moveInDate: '', note: '' })
  const [state, setState] = useState({ loading: false, error: '', success: false })

  async function submit(event) {
    event.preventDefault()
    setState({ loading: true, error: '', success: false })
    try {
      await reserveListing({ listingId: listing.id, ...form })
      setState({ loading: false, error: '', success: true })
    } catch (error) {
      setState({ loading: false, error: error.message, success: false })
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-5" role="presentation">
      <div className="w-full max-w-[480px] rounded-xl bg-surface p-6 shadow-xl" role="dialog" aria-modal="true" aria-labelledby="reserve-title">
        <div className="flex items-start justify-between gap-4"><div><p className="text-[11px] font-semibold text-brand">RESERVE INTEREST</p><h2 id="reserve-title" className="mt-2 text-xl font-semibold text-ink">{listing.title}</h2><p className="mt-1 text-xs text-ink-muted">No payment is taken. The lister will contact you.</p></div><button type="button" onClick={onClose} aria-label="Close"><X size={20} /></button></div>
        {state.success ? <p className="mt-8 rounded-lg bg-brand-tint p-4 text-sm leading-relaxed text-brand">Your reservation request was sent. The lister will confirm availability and next steps.</p> : (
          <form onSubmit={submit} className="mt-7 flex flex-col gap-4">
            <input required value={form.guestName} onChange={(event) => setForm({ ...form, guestName: event.target.value })} placeholder="Your name" className="h-12 rounded-lg border border-border px-3 text-sm" />
            <input required type="email" value={form.guestEmail} onChange={(event) => setForm({ ...form, guestEmail: event.target.value })} placeholder="Email address" className="h-12 rounded-lg border border-border px-3 text-sm" />
            <label className="flex flex-col gap-2 text-sm font-medium text-ink">Preferred move-in date<input type="date" min={today} value={form.moveInDate} onChange={(event) => setForm({ ...form, moveInDate: event.target.value })} className="h-12 rounded-lg border border-border px-3 text-sm" /></label>
            <textarea rows="3" maxLength="500" value={form.note} onChange={(event) => setForm({ ...form, note: event.target.value })} placeholder="Message to the lister (optional)" className="rounded-lg border border-border p-3 text-sm" />
            {state.error && <p className="text-xs text-red-600" role="alert">{state.error}</p>}
            <button disabled={state.loading} className="h-12 rounded-lg bg-brand text-sm font-semibold text-white disabled:opacity-60">{state.loading ? 'Sending request…' : 'Send reservation request'}</button>
          </form>
        )}
      </div>
    </div>
  )
}

function ListingDetails({ listing, onClose, onBook, onReserve }) {
  const photos = listing.photos?.length ? listing.photos.map((photo) => photo.imageUrl) : [
    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=85',
    'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1200&q=85',
    'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1200&q=85',
  ]
  const [index, setIndex] = useState(0)
  return (
    <div className="fixed inset-0 z-40 overflow-y-auto bg-ink/40 p-4 md:p-10" role="presentation">
      <div className="mx-auto max-w-[980px] overflow-hidden rounded-2xl bg-surface shadow-xl" role="dialog" aria-modal="true" aria-labelledby="listing-title">
        <div className="relative h-[280px] bg-brand-tint md:h-[430px]">
          <img src={photos[index]} alt={`${listing.title} property view ${index + 1}`} onError={(event) => { event.currentTarget.src = fallbackPropertyImage }} className="h-full w-full object-cover" />
          <button type="button" onClick={onClose} aria-label="Close details" className="absolute right-4 top-4 rounded-full bg-white/90 p-2"><X size={19} /></button>
          {photos.length > 1 && <><button type="button" onClick={() => setIndex((index - 1 + photos.length) % photos.length)} aria-label="Previous photo" className="absolute left-4 top-1/2 rounded-full bg-white/90 p-2"><ChevronLeft size={20} /></button><button type="button" onClick={() => setIndex((index + 1) % photos.length)} aria-label="Next photo" className="absolute right-4 top-1/2 rounded-full bg-white/90 p-2"><ChevronRight size={20} /></button></>}
          <span className="absolute bottom-4 left-4 rounded-full bg-ink/70 px-3 py-1 text-xs text-white">{index + 1} / {photos.length} photos</span>
        </div>
        <div className="grid gap-8 p-6 md:grid-cols-[1fr_300px] md:p-9">
          <div><p className="text-xl font-semibold text-ink">KSh {Number(listing.monthly_rent).toLocaleString()} <span className="text-xs font-normal text-ink-muted">/ month</span></p><h2 id="listing-title" className="mt-2 text-2xl font-semibold text-ink">{listing.title}</h2><p className="mt-2 flex items-center gap-2 text-sm text-ink-muted"><MapPin size={16} className="text-brand" />{listing.location_name}</p><div className="mt-6 flex gap-5 text-sm text-ink-muted"><span><BedDouble size={16} className="mr-1 inline text-brand" />{listing.bedrooms === 0 ? 'Studio' : `${listing.bedrooms} bedrooms`}</span><span className="font-semibold text-brand">Free viewing</span></div><p className="mt-6 text-sm leading-relaxed text-ink-muted">{listing.description}</p><div className="mt-8 flex flex-wrap gap-3"><button type="button" onClick={() => onBook(listing)} className="flex h-12 items-center gap-2 rounded-lg bg-brand px-5 text-sm font-semibold text-white"><CalendarDays size={17} />Schedule viewing</button><button type="button" onClick={() => onReserve(listing)} className="h-12 rounded-lg border border-brand px-5 text-sm font-semibold text-brand">Reserve house</button></div></div>
          <aside className="rounded-xl bg-brand-tint p-5"><p className="text-[11px] font-semibold text-brand">LISTER CONTACT</p><h3 className="mt-3 font-semibold text-ink">{listing.lister_name || 'Property lister'}</h3><a href={`mailto:${listing.lister_email}`} className="mt-3 flex items-center gap-2 text-sm text-brand"><Mail size={16} />{listing.lister_email || 'Contact by email'}</a><p className="mt-5 text-xs leading-relaxed text-ink-muted">Ask about availability, deposits and tenancy terms directly. Never send money before viewing and verifying the property.</p></aside>
        </div>
      </div>
    </div>
  )
}

function ListingCard({ listing, onSelect }) {
  const image = listing.photos?.[0]?.imageUrl
  return (
    <article className="flex flex-col overflow-hidden rounded-xl border border-border bg-surface">
      <button type="button" onClick={() => onSelect(listing)} className="relative flex h-40 w-full items-center justify-center overflow-hidden bg-brand-tint text-brand">
        {image ? <img src={image} alt={listing.title} onError={(event) => { event.currentTarget.src = fallbackPropertyImage }} className="h-full w-full object-cover transition duration-300 hover:scale-105" /> : <img src={fallbackPropertyImage} alt="" className="h-full w-full object-cover" />}
        <span className="sr-only">View details for {listing.title}</span>
      </button>
      <div className="flex flex-col gap-3 p-5">
        <div>
          <p className="text-xl font-semibold text-ink">KSh {Number(listing.monthly_rent).toLocaleString()} <span className="text-xs font-normal text-ink-muted">/ month</span></p>
          <button type="button" onClick={() => onSelect(listing)} className="mt-1 text-left text-base font-semibold text-ink hover:text-brand">{listing.title}</button>
          <p className="mt-1 text-xs text-ink-muted">{listing.location_name}</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-ink-muted">
          <BedDouble size={15} className="text-brand" /> {listing.bedrooms === 0 ? 'Studio' : `${listing.bedrooms} bedrooms`}
        </div>
        <div className="flex items-center justify-between border-t border-border pt-3">
          <span className="text-xs font-semibold text-brand">Free viewing</span>
          <span className="text-[11px] text-ink-muted">{listing.availability_status}</span>
        </div>
        <button type="button" onClick={() => onSelect(listing)} className="flex h-11 items-center justify-center gap-2 rounded-lg bg-brand text-sm font-semibold text-white hover:bg-[#123a2d]">
          View house details
        </button>
      </div>
    </article>
  )
}

export default function BrowsePage() {
  const [filters, setFilters] = useState(() => {
    try {
      const stored = window.sessionStorage.getItem('nairent_search_filters')
      if (stored) {
        const parsed = JSON.parse(stored)
        return {
          location: parsed.location || '',
          maxRent: parsed.maxRent || '',
          bedrooms: parsed.bedrooms || '',
          availability: parsed.availability || '',
        }
      }
    } catch (error) {
      if (!(error instanceof SyntaxError)) throw error
    }
    return { location: '', maxRent: '', bedrooms: '', availability: '' }
  })
  const [locations, setLocations] = useState([])
  const [listings, setListings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedListing, setSelectedListing] = useState(null)
  const [appointmentListing, setAppointmentListing] = useState(null)
  const [reservationListing, setReservationListing] = useState(null)

  async function loadListings(nextFilters = filters) {
    setLoading(true)
    setError('')
    try {
      const result = await searchListings(nextFilters)
      setListings(result.listings)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setLoading(false)
    }
  }

  // Load landing-page filters once; the search form submits subsequent changes explicitly.
  useEffect(() => {
    let active = true
    Promise.all([searchListings(filters), listLocations()])
      .then(([listingResult, locationResult]) => {
        if (active) {
          setListings(listingResult.listings)
          setLocations(locationResult.locations)
        }
      })
      .catch((requestError) => {
        if (active) setError(requestError.message)
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => { active = false }
  // The initial landing-page filters are intentionally loaded once.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <main className="min-h-screen bg-page px-5 py-8 md:px-14 md:py-12">
      <div className="mx-auto flex w-full max-w-[1180px] flex-col gap-8">
        <div className="flex flex-col gap-3">
          <a href="#top" className="text-sm font-medium text-brand">← Back to Nairent</a>
          <p className="text-[11px] font-semibold tracking-wide text-brand">RENTALS IN NAIROBI</p>
          <h1 className="text-[34px] font-semibold text-ink md:text-[44px]">Find a home that fits.</h1>
          <p className="max-w-[600px] text-sm leading-relaxed text-ink-muted">Search available homes, compare rent and location, then request a free viewing time directly with the lister.</p>
        </div>
        <form onSubmit={(event) => { event.preventDefault(); loadListings() }} className="grid gap-4 rounded-xl border border-border bg-surface p-5 md:grid-cols-4">
          <label className="flex flex-col gap-2 text-xs font-semibold text-ink-muted">Location
            <select value={filters.location} onChange={(event) => setFilters({ ...filters, location: event.target.value })} className="h-12 rounded-lg border border-border px-3 text-sm font-normal text-ink">
              <option value="">Any location</option>{locations.map((location) => <option key={location.id} value={location.name}>{location.name}</option>)}
            </select>
          </label>
          <label className="flex flex-col gap-2 text-xs font-semibold text-ink-muted">Monthly budget
            <select value={filters.maxRent} onChange={(event) => setFilters({ ...filters, maxRent: event.target.value })} className="h-12 rounded-lg border border-border px-3 text-sm font-normal text-ink">
              {budgets.map((budget) => <option key={budget.label} value={budget.value}>{budget.label}</option>)}
            </select>
          </label>
          <label className="flex flex-col gap-2 text-xs font-semibold text-ink-muted">Bedrooms
            <select value={filters.bedrooms} onChange={(event) => setFilters({ ...filters, bedrooms: event.target.value })} className="h-12 rounded-lg border border-border px-3 text-sm font-normal text-ink">
              {bedrooms.map((bedroom) => <option key={bedroom} value={bedroom === 'Any bedrooms' ? '' : bedroom}>{bedroom}</option>)}
            </select>
          </label>
          <label className="flex flex-col gap-2 text-xs font-semibold text-ink-muted">Availability
            <select value={filters.availability} onChange={(event) => setFilters({ ...filters, availability: event.target.value })} className="h-12 rounded-lg border border-border px-3 text-sm font-normal text-ink">
              {availabilityOptions.map((option) => <option key={option.label} value={option.value}>{option.label}</option>)}
            </select>
          </label>
          <button className="mt-auto flex h-12 items-center justify-center gap-2 rounded-lg bg-brand text-sm font-semibold text-white md:col-span-4"><Search size={17} /> Search homes</button>
        </form>
        {loading && <p className="text-sm text-ink-muted">Loading available homes…</p>}
        {error && <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}. Make sure the API and database are running.</div>}
        {!loading && !error && listings.length === 0 && <div className="rounded-xl border border-border bg-surface p-8 text-center"><p className="font-semibold text-ink">No homes match this search yet.</p><p className="mt-2 text-sm text-ink-muted">Try another neighborhood or budget. We’ll add nearby recommendations next.</p></div>}
        {!loading && !error && listings.length > 0 && <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">{listings.map((listing) => <ListingCard key={listing.id} listing={listing} onSelect={setSelectedListing} />)}</div>}
      </div>
      {selectedListing && <ListingDetails listing={selectedListing} onClose={() => setSelectedListing(null)} onBook={(listing) => { setSelectedListing(null); setAppointmentListing(listing) }} onReserve={(listing) => { setSelectedListing(null); setReservationListing(listing) }} />}
      {appointmentListing && <AppointmentDialog listing={appointmentListing} onClose={() => setAppointmentListing(null)} />}
      {reservationListing && <ReservationDialog listing={reservationListing} onClose={() => setReservationListing(null)} />}
    </main>
  )
}
