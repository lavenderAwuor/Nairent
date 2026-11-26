// Searches rentals, shows recommendations, and opens viewing or reservation forms.
import { useEffect, useState } from 'react'
import { BedDouble, CalendarDays, CheckCircle2, ChevronLeft, ChevronRight, Heart, Home, Mail, MapPin, MessageSquare, Phone, Search, ShieldCheck, SlidersHorizontal, X } from 'lucide-react'
import { createSavedSearch, getListingById, getToken, listLocations, requestAppointment, reserveListing, searchListings, sendInquiry } from '../lib/api.js'
import fallbackPropertyImage from '../assets/landing/property-photograph-1.png'
import Navbar from '../components/landing/Navbar.jsx'
import GoogleMapDisplay from '../components/GoogleMapDisplay.jsx'
import { googleMapsApiKey } from '../components/googleMapsApi.js'

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
const today = (() => {
  const date = new Date()
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset())
  return date.toISOString().split('T')[0]
})()
const availabilityOptions = [
  { label: 'Any availability', value: '' },
  { label: 'Available now', value: 'available' },
  { label: 'Available this month', value: 'available_this_month' },
]
const googleMapsEmbedApiKey = import.meta.env.VITE_GOOGLE_MAPS_EMBED_API_KEY?.trim()
  || import.meta.env.VITE_GOOGLE_MAPS_API_KEY?.trim()

// Formats the per-property fee shown before a renter requests a viewing.
function formatViewingFee(fee) {
  const amount = Number(fee) || 0
  return amount > 0 ? `KSh ${amount.toLocaleString()} viewing fee` : 'No viewing fee'
}

function InquiryDialog({ listing, onClose }) {
  const [form, setForm] = useState({ guestName: '', guestEmail: '', guestPhone: '', message: '' })
  const [state, setState] = useState({ loading: false, error: '', success: false })

  async function submit(event) {
    event.preventDefault()
    setState({ loading: true, error: '', success: false })
    try {
      await sendInquiry({ listingId: listing.id, ...form })
      setState({ loading: false, error: '', success: true })
    } catch (error) {
      setState({ loading: false, error: error.message, success: false })
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-5" role="presentation">
      <div className="w-full max-w-[480px] rounded-xl bg-surface p-6 shadow-xl" role="dialog" aria-modal="true" aria-labelledby="inquiry-title">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold text-brand">SEND AN INQUIRY</p>
            <h2 id="inquiry-title" className="mt-2 text-xl font-semibold text-ink">{listing.title}</h2>
            <p className="mt-1 text-xs text-ink-muted">{listing.location_name} · Direct to lister</p>
          </div>
          <button type="button" onClick={onClose} className="text-ink-muted hover:text-ink" aria-label="Close">
            <X size={20} />
          </button>
        </div>
        {state.success ? (
          <div className="mt-8 rounded-lg bg-brand-tint p-4 text-sm leading-relaxed text-brand">
            Your inquiry was delivered to the lister. They will contact you shortly using your details.
          </div>
        ) : (
          <form onSubmit={submit} className="mt-7 flex flex-col gap-4">
            <label className="flex flex-col gap-2 text-sm font-medium text-ink">
              Your name
              <input required value={form.guestName} onChange={(event) => setForm({ ...form, guestName: event.target.value })} className="h-12 rounded-lg border border-border px-3 text-sm" placeholder="Enter your full name" />
            </label>
            <label className="flex flex-col gap-2 text-sm font-medium text-ink">
              Email address
              <input required type="email" value={form.guestEmail} onChange={(event) => setForm({ ...form, guestEmail: event.target.value })} className="h-12 rounded-lg border border-border px-3 text-sm" placeholder="you@example.com" />
            </label>
            <label className="flex flex-col gap-2 text-sm font-medium text-ink">
              Phone number <span className="font-normal text-ink-muted">(optional)</span>
              <input type="tel" value={form.guestPhone} onChange={(event) => setForm({ ...form, guestPhone: event.target.value })} className="h-12 rounded-lg border border-border px-3 text-sm" placeholder="+254 7XX XXX XXX" />
            </label>
            <label className="flex flex-col gap-2 text-sm font-medium text-ink">
              Your question or message
              <textarea required rows="3" maxLength="1000" value={form.message} onChange={(event) => setForm({ ...form, message: event.target.value })} className="rounded-lg border border-border p-3 text-sm" placeholder="Ask about deposit, tenancy terms, or move-in schedule." />
            </label>
            {state.error && <p className="text-xs text-red-600" role="alert">{state.error}</p>}
            <button disabled={state.loading} className="h-12 rounded-lg bg-brand text-sm font-semibold text-white disabled:opacity-60">
              {state.loading ? 'Sending inquiry…' : 'Send inquiry'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

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
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-ink/55 p-3 backdrop-blur-sm sm:p-6" role="presentation">
      <div className="my-auto flex max-h-[calc(100dvh-1.5rem)] w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl" role="dialog" aria-modal="true" aria-labelledby="appointment-title">
        <div className="flex items-start justify-between gap-4 p-5 pb-0 sm:p-6 sm:pb-0">
          <div>
            <p className="flex items-center gap-2 text-[11px] font-semibold tracking-wide text-brand">
              <span className="flex size-8 items-center justify-center rounded-lg bg-brand-tint"><CalendarDays size={16} /></span>
              VIEWING REQUEST
            </p>
            <h2 id="appointment-title" className="mt-3 text-xl font-semibold text-ink">Choose a viewing time</h2>
            <p className="mt-1 text-sm text-ink-muted">The lister will confirm the appointment.</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-ink-muted hover:bg-page hover:text-ink" aria-label="Close">
            <X size={20} />
          </button>
        </div>
        <div className="mx-5 mt-5 flex items-center justify-between gap-3 rounded-xl border border-border bg-page p-4 sm:mx-6">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-ink">{listing.title}</p>
            <p className="mt-1 truncate text-xs text-ink-muted">{listing.location_name}</p>
            <p className="mt-1 text-xs font-semibold text-brand">{formatViewingFee(listing.viewing_fee)}</p>
          </div>
          <p className="shrink-0 text-right text-sm font-semibold text-brand">KSh {Number(listing.monthly_rent).toLocaleString()}<span className="block text-[10px] font-normal text-ink-muted">per month</span></p>
        </div>
        {state.success ? (
          <div className="m-5 rounded-xl border border-brand/20 bg-brand-tint/50 p-5" role="status">
            <div className="flex items-start gap-3">
              <CheckCircle2 size={22} className="mt-0.5 shrink-0 text-brand" />
              <div>
                <h3 className="font-semibold text-ink">Request sent</h3>
                <p className="mt-1 text-sm leading-relaxed text-ink-muted">The lister will review your preferred time and confirm the viewing. {formatViewingFee(listing.viewing_fee)}. Confirm payment arrangements directly with the lister; Nairent does not collect viewing fees.</p>
              </div>
            </div>
            <button type="button" onClick={onClose} className="mt-5 h-11 w-full rounded-lg bg-brand text-sm font-semibold text-white">Done</button>
          </div>
        ) : (
          <form onSubmit={submit} className="grid max-h-[calc(100dvh-17rem)] grid-cols-1 gap-4 overflow-y-auto p-5 pt-4 sm:grid-cols-2 sm:p-6 sm:pt-4">
            <label className="flex flex-col gap-2 text-sm font-medium text-ink">
              Your name
              <input required autoComplete="name" value={form.guestName} onChange={(event) => setForm({ ...form, guestName: event.target.value })} className="h-11 rounded-lg border border-border bg-white px-3 text-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20" placeholder="Enter your name" />
            </label>
            <label className="flex flex-col gap-2 text-sm font-medium text-ink">
              Email address
              <input required type="email" autoComplete="email" value={form.guestEmail} onChange={(event) => setForm({ ...form, guestEmail: event.target.value })} className="h-11 rounded-lg border border-border bg-white px-3 text-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20" placeholder="you@example.com" />
            </label>
            <label className="flex flex-col gap-2 text-sm font-medium text-ink">
              Preferred date
              <input required type="date" min={today} value={form.preferredDate} onChange={(event) => setForm({ ...form, preferredDate: event.target.value })} className="h-11 rounded-lg border border-border bg-white px-3 text-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20" />
            </label>
            <label className="flex flex-col gap-2 text-sm font-medium text-ink">
              Preferred time <span className="font-normal text-ink-muted">(East Africa Time)</span>
              <input required type="time" value={form.preferredTime} onChange={(event) => setForm({ ...form, preferredTime: event.target.value })} className="h-11 rounded-lg border border-border bg-white px-3 text-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20" />
            </label>
            <label className="flex flex-col gap-2 text-sm font-medium text-ink sm:col-span-2">
              Note <span className="font-normal text-ink-muted">(optional)</span>
              <textarea rows="3" maxLength="500" value={form.note} onChange={(event) => setForm({ ...form, note: event.target.value })} className="rounded-lg border border-border bg-white p-3 text-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20" placeholder="Optional details for the lister" />
            </label>
            {state.error && <p className="text-sm text-red-700 sm:col-span-2" role="alert">{state.error}</p>}
            <div className="flex flex-col-reverse gap-2 border-t border-border pt-4 sm:col-span-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-ink-muted">Free to request. No payment is collected.</p>
              <div className="flex gap-2">
                <button type="button" onClick={onClose} className="h-11 rounded-lg border border-border px-4 text-sm font-semibold text-ink-muted hover:bg-page">Cancel</button>
                <button disabled={state.loading} className="h-11 rounded-lg bg-brand px-5 text-sm font-semibold text-white disabled:cursor-wait disabled:opacity-60">
                  {state.loading ? 'Sending…' : 'Request viewing'}
                </button>
              </div>
            </div>
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
      await reserveListing({
        listingId: listing.id,
        ...form,
        moveInDate: form.moveInDate || undefined,
      })
      setState({ loading: false, error: '', success: true })
    } catch (error) {
      setState({ loading: false, error: error.message, success: false })
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-ink/55 p-3 backdrop-blur-sm sm:p-6" role="presentation">
      <div className="my-auto flex max-h-[calc(100dvh-1.5rem)] w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl" role="dialog" aria-modal="true" aria-labelledby="reserve-title">
        <div className="flex items-start justify-between gap-4 p-5 pb-0 sm:p-6 sm:pb-0">
          <div>
            <p className="flex items-center gap-2 text-[11px] font-semibold tracking-wide text-brand">
              <span className="flex size-8 items-center justify-center rounded-lg bg-brand-tint"><Home size={16} /></span>
              EXPRESS INTEREST
            </p>
            <h2 id="reserve-title" className="mt-3 text-xl font-semibold text-ink">Ask to reserve this home</h2>
            <p className="mt-1 text-sm text-ink-muted">The lister will confirm availability with you.</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-ink-muted hover:bg-page hover:text-ink" aria-label="Close">
            <X size={20} />
          </button>
        </div>
        <div className="mx-5 mt-5 flex items-center justify-between gap-3 rounded-xl border border-border bg-page p-4 sm:mx-6">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-ink">{listing.title}</p>
            <p className="mt-1 truncate text-xs text-ink-muted">{listing.location_name}</p>
          </div>
          <p className="shrink-0 text-right text-sm font-semibold text-brand">KSh {Number(listing.monthly_rent).toLocaleString()}<span className="block text-[10px] font-normal text-ink-muted">per month</span></p>
        </div>
        {state.success ? (
          <div className="m-5 rounded-xl border border-brand/20 bg-brand-tint/50 p-5" role="status">
            <div className="flex items-start gap-3">
              <CheckCircle2 size={22} className="mt-0.5 shrink-0 text-brand" />
              <div>
                <h3 className="font-semibold text-ink">Interest sent to the lister</h3>
                <p className="mt-1 text-sm leading-relaxed text-ink-muted">Your request is not a confirmed booking. The lister will contact you to confirm availability. No payment was taken.</p>
              </div>
            </div>
            <button type="button" onClick={onClose} className="mt-5 h-11 w-full rounded-lg bg-brand text-sm font-semibold text-white">Done</button>
          </div>
        ) : (
          <form onSubmit={submit} className="grid max-h-[calc(100dvh-17rem)] grid-cols-1 gap-4 overflow-y-auto p-5 pt-4 sm:grid-cols-2 sm:p-6 sm:pt-4">
            <label className="flex flex-col gap-2 text-sm font-medium text-ink">
              Your name
              <input required autoComplete="name" value={form.guestName} onChange={(event) => setForm({ ...form, guestName: event.target.value })} placeholder="Enter your name" className="h-11 rounded-lg border border-border bg-white px-3 text-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20" />
            </label>
            <label className="flex flex-col gap-2 text-sm font-medium text-ink">
              Email address
              <input required type="email" autoComplete="email" value={form.guestEmail} onChange={(event) => setForm({ ...form, guestEmail: event.target.value })} placeholder="you@example.com" className="h-11 rounded-lg border border-border bg-white px-3 text-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20" />
            </label>
            <label className="flex flex-col gap-2 text-sm font-medium text-ink">
              Preferred move-in date
              <input type="date" min={today} value={form.moveInDate} onChange={(event) => setForm({ ...form, moveInDate: event.target.value })} className="h-11 rounded-lg border border-border bg-white px-3 text-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20" />
            </label>
            <p className="flex items-center gap-2 rounded-lg bg-brand-tint/50 p-3 text-xs leading-relaxed text-brand"><ShieldCheck size={16} className="shrink-0" />This sends a request only. Nairent does not collect a deposit or booking payment.</p>
            <label className="flex flex-col gap-2 text-sm font-medium text-ink sm:col-span-2">
              Message to the lister <span className="font-normal text-ink-muted">(optional)</span>
              <textarea rows="3" maxLength="500" value={form.note} onChange={(event) => setForm({ ...form, note: event.target.value })} placeholder="Share your expected move-in timing or ask a question" className="rounded-lg border border-border bg-white p-3 text-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20" />
            </label>
            {state.error && <p className="text-sm text-red-700 sm:col-span-2" role="alert">{state.error}</p>}
            <div className="flex flex-col-reverse gap-2 border-t border-border pt-4 sm:col-span-2 sm:flex-row sm:justify-end">
              <button type="button" onClick={onClose} className="h-11 rounded-lg border border-border px-4 text-sm font-semibold text-ink-muted hover:bg-page">Cancel</button>
              <button disabled={state.loading} className="h-11 rounded-lg bg-brand px-5 text-sm font-semibold text-white disabled:cursor-wait disabled:opacity-60">
                {state.loading ? 'Sending…' : 'Send request'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

function ListingDetails({ listing, onClose, onBook, onReserve, onInquire }) {
  const photos = listing.photos?.length
    ? listing.photos.map((photo) => photo.imageUrl)
    : [
        'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=85',
        'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1200&q=85',
        'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1200&q=85',
      ]
  const [index, setIndex] = useState(0)
  const hasPropertyAddress = Boolean(listing.property_address?.trim())
  const hasExactLocation = listing.property_latitude != null && listing.property_longitude != null
  const mapQuery = hasExactLocation
    ? `${listing.property_latitude},${listing.property_longitude}`
    : listing.property_address?.trim() || `${listing.location_name}, Nairobi, Kenya`
  const mapTarget = mapQuery
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapTarget)}`
  const mapsEmbedUrl = googleMapsEmbedApiKey
    ? hasExactLocation
      ? `https://www.google.com/maps/embed/v1/view?key=${encodeURIComponent(googleMapsEmbedApiKey)}&center=${encodeURIComponent(mapQuery)}&zoom=18`
      : `https://www.google.com/maps/embed/v1/place?key=${encodeURIComponent(googleMapsEmbedApiKey)}&q=${encodeURIComponent(mapQuery)}`
    : null

  return (
    <div className="fixed inset-0 z-40 overflow-y-auto bg-ink/40 p-4 md:p-10" role="presentation">
      <div className="mx-auto max-w-[980px] overflow-hidden rounded-2xl bg-surface shadow-xl" role="dialog" aria-modal="true" aria-labelledby="listing-title">
        <div className="relative flex h-[280px] items-center justify-center bg-page md:h-[430px]">
          <img src={photos[index]} alt={`${listing.title} property view ${index + 1}`} onError={(event) => { event.currentTarget.src = fallbackPropertyImage }} className="h-full w-full object-contain p-2" />
          <button type="button" onClick={onClose} aria-label="Close details" className="absolute right-4 top-4 rounded-full bg-white/90 p-2"><X size={19} /></button>
          {photos.length > 1 && (
            <>
              <button type="button" onClick={() => setIndex((index - 1 + photos.length) % photos.length)} aria-label="Previous photo" className="absolute left-4 top-1/2 rounded-full bg-white/90 p-2"><ChevronLeft size={20} /></button>
              <button type="button" onClick={() => setIndex((index + 1) % photos.length)} aria-label="Next photo" className="absolute right-4 top-1/2 rounded-full bg-white/90 p-2"><ChevronRight size={20} /></button>
            </>
          )}
          <span className="absolute bottom-4 left-4 rounded-full bg-ink/70 px-3 py-1 text-xs text-white">{index + 1} / {photos.length} photos</span>
        </div>
        <div className="grid gap-8 p-6 md:grid-cols-[1fr_300px] md:p-9">
          <div>
            <p className="text-xl font-semibold text-ink">KSh {Number(listing.monthly_rent).toLocaleString()} <span className="text-xs font-normal text-ink-muted">/ month</span></p>
            <h2 id="listing-title" className="mt-2 text-2xl font-semibold text-ink">{listing.title}</h2>
            <p className="mt-2 flex items-center gap-2 text-sm text-ink-muted"><MapPin size={16} className="text-brand" />{listing.location_name}</p>
            <div className="mt-6 flex gap-5 text-sm text-ink-muted">
              <span><BedDouble size={16} className="mr-1 inline text-brand" />{listing.bedrooms === 0 ? 'Studio' : `${listing.bedrooms} bedrooms`}</span>
              <span className="font-semibold text-brand">{formatViewingFee(listing.viewing_fee)}</span>
            </div>
            <p className="mt-6 text-sm leading-relaxed text-ink-muted">{listing.description}</p>
            <section className="mt-7" aria-labelledby="property-map-title">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 id="property-map-title" className="text-sm font-semibold text-ink">{hasExactLocation ? 'Exact property location' : hasPropertyAddress ? 'Property address' : 'Approximate area'}</h3>
                  <p className="mt-1 text-xs text-ink-muted">{hasPropertyAddress ? listing.property_address : `Showing ${listing.location_name}; no property address was added.`}{hasExactLocation ? ' · Exact pin selected by the lister.' : ' · Map position may be approximate.'}</p>
                </div>
                <a href={mapsUrl} target="_blank" rel="noreferrer" className="shrink-0 text-xs font-semibold text-brand underline underline-offset-2">
                  Open Google Maps
                </a>
              </div>
              {hasExactLocation && googleMapsApiKey ? (
                <GoogleMapDisplay latitude={listing.property_latitude} longitude={listing.property_longitude} title={listing.title} />
              ) : mapsEmbedUrl ? (
                <div className="relative mt-3 h-56 overflow-hidden rounded-xl border border-border">
                  <iframe
                    title={`${hasExactLocation ? 'Exact property pin' : 'Approximate area'} for ${listing.location_name}, Nairobi`}
                    src={mapsEmbedUrl}
                    loading="lazy"
                    referrerPolicy="strict-origin-when-cross-origin"
                    allowFullScreen
                    className={`h-full w-full ${hasExactLocation ? 'pointer-events-none' : ''}`}
                  />
                  {hasExactLocation && <MapPin size={26} aria-hidden="true" className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-full fill-red-600 text-white drop-shadow-md" />}
                </div>
              ) : (
                <a href={mapsUrl} target="_blank" rel="noreferrer" className="mt-3 flex h-32 items-center justify-center gap-2 rounded-xl border border-border bg-page px-4 text-sm font-semibold text-brand hover:bg-brand-tint">
                  <MapPin size={18} /> Explore {listing.location_name} on Google Maps
                </a>
              )}
            </section>
            {listing.amenities?.length > 0 && (
              <div className="mt-6">
                <h3 className="text-sm font-semibold text-ink">Amenities</h3>
                <div className="mt-3 flex flex-wrap gap-2">
                  {listing.amenities.map((amenity) => (
                    <span key={amenity} className="rounded-full bg-brand-tint px-3 py-1.5 text-xs text-brand">{amenity}</span>
                  ))}
                </div>
              </div>
            )}
            <div className="mt-8 flex flex-wrap gap-3">
              <button type="button" onClick={() => onBook(listing)} className="flex h-12 items-center gap-2 rounded-lg bg-brand px-5 text-sm font-semibold text-white">
                <CalendarDays size={17} /> Request a viewing
              </button>
              <button type="button" onClick={() => onReserve(listing)} className="h-12 rounded-lg border border-brand px-5 text-sm font-semibold text-brand">
                Reserve house
              </button>
              <button type="button" onClick={() => onInquire(listing)} className="flex h-12 items-center gap-2 rounded-lg border border-border px-5 text-sm font-semibold text-ink-muted hover:text-ink">
                <MessageSquare size={17} /> Ask a question
              </button>
            </div>
          </div>
          <aside className="rounded-xl bg-brand-tint p-5">
            <p className="text-[11px] font-semibold text-brand">LISTER CONTACT</p>
            <h3 className="mt-3 font-semibold text-ink">{listing.lister_name || 'Property lister'}</h3>
            {listing.lister_phone && (
              <a href={`tel:${listing.lister_phone}`} className="mt-3 flex items-center gap-2 text-sm font-semibold text-brand">
                <Phone size={16} /> Call {listing.lister_phone}
              </a>
            )}
            <a href={`mailto:${listing.lister_email}`} className="mt-3 flex items-center gap-2 text-sm text-brand">
              <Mail size={16} /> {listing.lister_email || 'Contact by email'}
            </a>
            <p className="mt-5 text-xs leading-relaxed text-ink-muted">
              Ask about availability, deposits and tenancy terms directly. Never send money before viewing and verifying the property in person.
            </p>
          </aside>
        </div>
      </div>
    </div>
  )
}

function ListingCard({ listing, onSelect }) {
  const image = listing.photos?.[0]?.imageUrl
  return (
    <article className="flex flex-col overflow-hidden rounded-xl border border-border bg-surface transition hover:shadow-md">
      <button type="button" onClick={() => onSelect(listing)} className="relative flex aspect-[4/3] w-full items-center justify-center overflow-hidden bg-page text-brand">
        {image ? (
          <img src={image} alt={listing.title} loading="lazy" decoding="async" onError={(event) => { event.currentTarget.src = fallbackPropertyImage }} className="h-full w-full object-contain p-1" />
        ) : (
          <img src={fallbackPropertyImage} alt="" loading="lazy" decoding="async" className="h-full w-full object-contain p-1" />
        )}
        {listing.isRecommendation && (
          <span className="absolute left-3 top-3 rounded-md bg-brand px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-white shadow">
            Alternative recommendation
          </span>
        )}
        <span className="sr-only">View details for {listing.title}</span>
      </button>
      <div className="flex flex-col gap-3 p-5">
        <div>
          <p className="text-xl font-semibold text-ink">
            KSh {Number(listing.monthly_rent).toLocaleString()} <span className="text-xs font-normal text-ink-muted">/ month</span>
          </p>
          <button type="button" onClick={() => onSelect(listing)} className="mt-1 text-left text-base font-semibold text-ink hover:text-brand line-clamp-1">
            {listing.title}
          </button>
          <p className="mt-1 text-xs text-ink-muted flex items-center gap-1">
            <MapPin size={13} className="text-brand shrink-0" />
            {listing.property_address || listing.location_name}
          </p>
          {listing.recommendationReason && (
            <p className="mt-1 text-[11px] font-medium text-brand">
              {listing.recommendationReason}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 text-xs text-ink-muted">
          <BedDouble size={15} className="text-brand" /> {listing.bedrooms === 0 ? 'Studio' : `${listing.bedrooms} bedrooms`}
        </div>
        <div className="flex items-center justify-between border-t border-border pt-3">
          <span className="text-xs font-semibold text-brand">{formatViewingFee(listing.viewing_fee)}</span>
          <span className="text-[11px] capitalize text-ink-muted">{listing.availability_status?.replace('_', ' ')}</span>
        </div>
        <button type="button" onClick={() => onSelect(listing)} className="flex h-11 items-center justify-center gap-2 rounded-lg bg-brand text-sm font-semibold text-white hover:bg-[#123a2d]">
          View house details
        </button>
      </div>
    </article>
  )
}

export default function BrowsePage({ initialListingId = '' }) {
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
    } catch {
      // Stored filters are optional; ignore malformed or unavailable browser storage.
    }
    return { location: '', maxRent: '', bedrooms: '', availability: '' }
  })
  const [locations, setLocations] = useState([])
  const [listings, setListings] = useState([])
  const [recommendations, setRecommendations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedListing, setSelectedListing] = useState(null)
  const [appointmentListing, setAppointmentListing] = useState(null)
  const [reservationListing, setReservationListing] = useState(null)
  const [inquiryListing, setInquiryListing] = useState(null)
  const [saveState, setSaveState] = useState({ loading: false, message: '', error: '' })
  const [sortBy, setSortBy] = useState('newest')
  // Builds the removable filter chips shown beside the current search results.
  const activeFilters = [
    filters.location && { key: 'location', label: filters.location },
    filters.maxRent && { key: 'maxRent', label: budgets.find((budget) => budget.value === filters.maxRent)?.label || `Up to KSh ${Number(filters.maxRent).toLocaleString()}` },
    filters.bedrooms && { key: 'bedrooms', label: `${filters.bedrooms} ${filters.bedrooms === '1' ? 'bedroom' : 'bedrooms'}` },
    filters.availability && { key: 'availability', label: availabilityOptions.find((option) => option.value === filters.availability)?.label || filters.availability },
  ].filter(Boolean)
  const sortedListings = [...listings].sort((first, second) => {
    if (sortBy === 'rent-low') return Number(first.monthly_rent) - Number(second.monthly_rent)
    if (sortBy === 'rent-high') return Number(second.monthly_rent) - Number(first.monthly_rent)
    return new Date(second.created_at || 0) - new Date(first.created_at || 0)
  })

  async function loadListings(nextFilters = filters) {
    setLoading(true)
    setError('')
    try {
      window.sessionStorage.setItem('nairent_search_filters', JSON.stringify(nextFilters))
    } catch {
      // Search should still work when browser storage is disabled or full.
    }
    try {
      const result = await searchListings(nextFilters)
      setListings(result.listings || [])
      setRecommendations(result.recommendations || [])
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setLoading(false)
    }
  }

  // Clears every filter and refreshes results using the unfiltered search.
  function clearFilters() {
    const cleared = { location: '', maxRent: '', bedrooms: '', availability: '' }
    setFilters(cleared)
    loadListings(cleared)
  }

  // Removes one active filter and immediately reloads the matching homes.
  function removeFilter(key) {
    const nextFilters = { ...filters, [key]: '' }
    setFilters(nextFilters)
    loadListings(nextFilters)
  }

  async function saveCurrentSearch() {
    if (!getToken()) {
      window.location.hash = '#tenant-sign-up'
      return
    }
    setSaveState({ loading: true, message: '', error: '' })
    try {
      await createSavedSearch({
        location: filters.location || undefined,
        maxRent: filters.maxRent || undefined,
        bedrooms: filters.bedrooms || undefined,
        availability: filters.availability || undefined,
      })
      setSaveState({
        loading: false,
        message: 'Search saved to your account.',
        error: '',
      })
    } catch (requestError) {
      setSaveState({ loading: false, message: '', error: requestError.message })
    }
  }

  useEffect(() => {
    let active = true
    Promise.all([
      searchListings(filters),
      listLocations(),
      initialListingId ? getListingById(initialListingId).catch(() => null) : Promise.resolve(null),
    ])
      .then(([listingResult, locationResult, selectedResult]) => {
        if (active) {
          setListings(listingResult.listings || [])
          setRecommendations(listingResult.recommendations || [])
          setLocations(locationResult.locations || [])
          if (selectedResult?.listing) setSelectedListing(selectedResult.listing)
        }
      })
      .catch((requestError) => {
        if (active) setError(requestError.message)
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => { active = false }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[#f6f8f6] px-4 py-7 sm:px-6 md:px-10 md:py-10">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-7">
          <div className="flex flex-col justify-between gap-4 border-b border-border pb-6 sm:flex-row sm:items-end">
            <div>
              <p className="text-[11px] font-semibold tracking-[0.14em] text-brand">NAIROBI RENTALS</p>
              <h1 className="mt-2 text-[34px] font-semibold tracking-tight text-ink md:text-[42px]">Find your next home</h1>
              <p className="mt-2 max-w-[660px] text-sm leading-relaxed text-ink-muted">
                Compare available homes by neighborhood, rent, and viewing fee. Contact the lister directly when one feels right.
              </p>
            </div>
            <a href="#support" className="text-xs font-semibold text-brand hover:underline">Need help finding a home?</a>
          </div>

          <div className="grid items-start gap-6 lg:grid-cols-[290px_minmax(0,1fr)] xl:grid-cols-[310px_minmax(0,1fr)]">
            <aside className="self-start rounded-2xl border border-border bg-surface p-5 shadow-[0_10px_30px_-24px_rgba(24,54,42,0.45)] md:p-6 lg:sticky lg:top-[104px] lg:max-h-[calc(100dvh-120px)] lg:overflow-y-auto lg:overscroll-contain">
              <div className="flex items-start justify-between gap-3 border-b border-border pb-5">
                <div className="flex items-start gap-3">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-tint text-brand"><SlidersHorizontal size={18} /></span>
                  <div>
                    <p className="text-[10px] font-semibold tracking-[0.12em] text-brand">YOUR SEARCH</p>
                    <h2 className="mt-1 text-lg font-semibold text-ink">Find a rental</h2>
                    <p className="mt-1 text-xs leading-relaxed text-ink-muted">Set the details that matter to you.</p>
                  </div>
                </div>
                {activeFilters.length > 0 && (
                  <button type="button" onClick={clearFilters} className="flex shrink-0 items-center gap-1 rounded-full border border-border px-2.5 py-1 text-[11px] font-semibold text-ink-muted transition hover:border-brand hover:text-brand" aria-label="Clear all search filters">
                    {activeFilters.length}<span className="sr-only"> active filters</span><X size={12} />
                  </button>
                )}
              </div>
              <form onSubmit={(event) => { event.preventDefault(); loadListings() }} className="mt-5 flex flex-col gap-4">
            <label className="flex flex-col gap-2 text-xs font-semibold text-ink">Neighborhood
              <select value={filters.location} onChange={(event) => setFilters({ ...filters, location: event.target.value })} className="h-11 rounded-lg border border-border bg-white px-3 text-sm font-normal text-ink outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/10">
                <option value="">Any location</option>
                {locations.map((loc) => <option key={loc.id} value={loc.name}>{loc.name}</option>)}
              </select>
            </label>
            <label className="flex flex-col gap-2 text-xs font-semibold text-ink">Monthly budget
              <select value={filters.maxRent} onChange={(event) => setFilters({ ...filters, maxRent: event.target.value })} className="h-11 rounded-lg border border-border bg-white px-3 text-sm font-normal text-ink outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/10">
                {budgets.map((b) => <option key={b.label} value={b.value}>{b.label}</option>)}
              </select>
            </label>
            <label className="flex flex-col gap-2 text-xs font-semibold text-ink">Bedrooms
              <select value={filters.bedrooms} onChange={(event) => setFilters({ ...filters, bedrooms: event.target.value })} className="h-11 rounded-lg border border-border bg-white px-3 text-sm font-normal text-ink outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/10">
                {bedrooms.map((bed) => <option key={bed} value={bed === 'Any bedrooms' ? '' : bed}>{bed}</option>)}
              </select>
            </label>
            <label className="flex flex-col gap-2 text-xs font-semibold text-ink">Availability
              <select value={filters.availability} onChange={(event) => setFilters({ ...filters, availability: event.target.value })} className="h-11 rounded-lg border border-border bg-white px-3 text-sm font-normal text-ink outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/10">
                {availabilityOptions.map((opt) => <option key={opt.label} value={opt.value}>{opt.label}</option>)}
              </select>
            </label>
            <div className="mt-1 flex flex-col gap-2.5 border-t border-border pt-4">
              <button className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-brand text-sm font-semibold text-white transition hover:bg-[#123a2d] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand">
                <Search size={17} /> Search homes
              </button>
              <button type="button" onClick={() => saveCurrentSearch()} disabled={saveState.loading} className="flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-brand text-xs font-semibold text-brand transition hover:bg-brand-tint disabled:opacity-60">
                <Heart size={17} /> {saveState.loading ? 'Saving…' : 'Save search'}
              </button>
            </div>
            <p className="text-[11px] leading-relaxed text-ink-muted">Viewing fees are set by listers and shown before you request a viewing.</p>
          </form>
            </aside>

            <section className="min-w-0 flex flex-col gap-5">
          <div className="flex flex-wrap items-end justify-between gap-3 border-b border-border pb-4">
            <div>
              <p className="text-[11px] font-semibold tracking-wide text-ink-muted">AVAILABLE RENTALS</p>
              <h2 className="mt-1 text-lg font-semibold text-ink">{loading ? 'Finding homes…' : `${listings.length} ${listings.length === 1 ? 'home' : 'homes'} found`}</h2>
            </div>
            <label className="flex items-center gap-2 text-xs font-medium text-ink-muted">Sort by
              <select value={sortBy} onChange={(event) => setSortBy(event.target.value)} className="h-9 rounded-lg border border-border bg-surface px-2 text-xs text-ink">
                <option value="newest">Newest</option>
                <option value="rent-low">Rent: low to high</option>
                <option value="rent-high">Rent: high to low</option>
              </select>
            </label>
          </div>

          {activeFilters.length > 0 && (
            <div className="flex flex-wrap items-center gap-2" aria-label="Active search filters">
              <span className="mr-1 text-xs font-medium text-ink-muted">Filters:</span>
              {activeFilters.map((filter) => (
                <button key={filter.key} type="button" onClick={() => removeFilter(filter.key)} className="inline-flex items-center gap-1.5 rounded-full border border-brand/20 bg-brand-tint/50 px-3 py-1.5 text-xs font-medium text-brand transition hover:border-brand" aria-label={`Remove ${filter.label} filter`}>
                  {filter.label}<X size={13} />
                </button>
              ))}
              <button type="button" onClick={clearFilters} className="px-1.5 py-1 text-xs font-semibold text-ink-muted underline-offset-2 hover:text-brand hover:underline">Clear all</button>
            </div>
          )}

          {(saveState.message || saveState.error) && (
            <p className={`text-sm ${saveState.error ? 'text-red-600' : 'text-brand'}`} role={saveState.error ? 'alert' : 'status'}>
              {saveState.error || saveState.message}
            </p>
          )}

          {loading && <p className="text-sm text-ink-muted">Loading available homes…</p>}
          {error && (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700" role="alert">
              <span>{error}</span>
              <button type="button" onClick={() => loadListings()} className="font-semibold underline">Try search again</button>
            </div>
          )}

          {!loading && !error && listings.length === 0 && recommendations.length === 0 && (
            <div className="rounded-xl border border-border bg-surface p-8 text-center">
              <p className="font-semibold text-ink">{Object.values(filters).some(Boolean) ? 'No homes match this search yet.' : 'No available homes are listed yet.'}</p>
              <p className="mt-2 text-sm text-ink-muted">{Object.values(filters).some(Boolean) ? 'Try expanding your budget, changing the neighborhood, or clearing your filters.' : 'Check back soon, or broaden your search to see more Nairobi neighborhoods.'}</p>
              <button
                type="button"
                onClick={() => saveCurrentSearch({ notify: true })}
                disabled={saveState.loading}
                className="mt-4 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                {saveState.loading ? 'Saving alert…' : 'Notify me when a matching home is listed'}
              </button>
              {Object.values(filters).some(Boolean) && (
                <button type="button" onClick={() => { const cleared = { location: '', maxRent: '', bedrooms: '', availability: '' }; setFilters(cleared); loadListings(cleared) }} className="mt-4 rounded-lg border border-brand px-4 py-2 text-xs font-semibold text-brand hover:bg-brand-tint">
                  Clear all filters
                </button>
              )}
            </div>
          )}

          {!loading && !error && listings.length === 0 && recommendations.length > 0 && (
            <div className="flex flex-col gap-6">
              <div className="rounded-xl border border-brand/20 bg-brand-tint/30 p-6">
                <div className="flex items-center gap-2 text-brand">
                  <MapPin size={20} />
                  <h2 className="text-lg font-semibold text-ink">Alternative Recommendations Nearby</h2>
                </div>
                <p className="mt-1 text-sm text-ink-muted">
                  No exact match was found in {filters.location || 'your preferred area'} for this criteria.
                  Below are comparable homes in nearby Nairobi neighborhoods with matching space and rent:
                </p>
              </div>
              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {recommendations.map((listing) => (
                  <ListingCard key={listing.id} listing={listing} onSelect={setSelectedListing} />
                ))}
              </div>
            </div>
          )}

          {!loading && !error && listings.length > 0 && (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {sortedListings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} onSelect={setSelectedListing} />
              ))}
            </div>
          )}
            </section>
          </div>
        </div>
      </main>

      {selectedListing && (
        <ListingDetails
          listing={selectedListing}
          onClose={() => setSelectedListing(null)}
          onBook={(listing) => { setSelectedListing(null); setAppointmentListing(listing) }}
          onReserve={(listing) => { setSelectedListing(null); setReservationListing(listing) }}
          onInquire={(listing) => { setSelectedListing(null); setInquiryListing(listing) }}
        />
      )}
      {appointmentListing && <AppointmentDialog listing={appointmentListing} onClose={() => setAppointmentListing(null)} />}
      {reservationListing && <ReservationDialog listing={reservationListing} onClose={() => setReservationListing(null)} />}
      {inquiryListing && <InquiryDialog listing={inquiryListing} onClose={() => setInquiryListing(null)} />}
    </>
  )
}
