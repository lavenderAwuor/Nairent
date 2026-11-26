// Gives listers tools for properties, requests, messages, and profile settings.
import { useEffect, useState } from 'react'
import { Bell, Building2, CalendarDays, CheckCircle2, Home, LogOut, Mail, Menu, MessageCircle, Phone, Plus, Search, Settings, Shield, X } from 'lucide-react'
import { clearToken, createListing, deleteListing, getCurrentUser, getMyListerAppointments, getMyListerInquiries, getMyListings, getMyReservations, getToken, listLocations, updateAppointmentStatus, updateListing, updateListingAvailability, updateMyProfile, updateReservationStatus, uploadPhotos } from '../lib/api.js'
import GoogleLocationPicker from '../components/GoogleLocationPicker.jsx'
import fallbackPropertyImage from '../assets/landing/property-photograph-1.png'
import FeedbackToast from '../components/FeedbackToast.jsx'
import useFeedback from '../hooks/useFeedback.js'

const amenityOptions = ['Wi-Fi', 'Parking', 'Balcony', 'Security', 'Generator', 'Water included', 'Furnished', 'Pet friendly', 'Swimming pool', 'Gym']
const emptyForm = { title: '', description: '', monthlyRent: '', viewingFee: '0', bedrooms: '0', location: '', propertyAddress: '', latitude: '', longitude: '', amenities: [], photoUrls: '', availability: 'available' }

function getNotificationsSeenAt(userId) {
  const key = `nairent_lister_notifications_seen_${userId}`
  try {
    const stored = window.localStorage.getItem(key)
    if (stored) return Number(stored) || Date.now()
    const now = Date.now()
    window.localStorage.setItem(key, String(now))
    return now
  } catch {
    return Date.now()
  }
}

function RequestQueue({ title, empty, items, type, actionState, onStatusChange }) {
  const isAppointment = type === 'appointment'
  return (
    <section className="rounded-xl border border-border bg-surface p-5">
      <div className="flex items-center justify-between gap-3">
        <div><h2 className="text-xl font-semibold">{title}</h2><p className="mt-1 text-sm text-ink-muted">Approve or update incoming requests.</p></div>
        <span className="rounded-full bg-brand-tint px-2 py-1 text-xs font-semibold text-brand">{items.filter((item) => item.status === 'requested').length} pending</span>
      </div>
      <div className="mt-4 flex flex-col gap-3">
        {items.length === 0 && <p className="rounded-lg border border-dashed border-border p-4 text-sm text-ink-muted">{empty}</p>}
        {items.map((item) => {
          const busy = actionState.id === item.id
          return (
            <article key={item.id} className="rounded-lg border border-border p-4">
              <div className="flex items-start justify-between gap-3">
              <div><p className="font-semibold">{item.guest_name}</p><p className="text-xs text-ink-muted">{item.guest_email}</p><p className="mt-2 text-sm">{item.title} · {item.location_name}</p>{isAppointment && <p className="mt-1 text-xs font-medium text-brand">Viewing fee: {Number(item.viewing_fee) > 0 ? `KSh ${Number(item.viewing_fee).toLocaleString()}` : 'None'}</p>}</div>
                <span className="rounded-full bg-page px-2 py-1 text-[10px] font-semibold uppercase text-ink-muted">{item.status}</span>
              </div>
              <p className="mt-2 text-xs text-ink-muted">{isAppointment ? `${item.preferred_date} at ${String(item.preferred_time).slice(0, 5)}` : `Move-in: ${item.move_in_date || 'Not specified'}`}</p>
              {item.note && <p className="mt-2 text-xs text-ink-muted">{item.note}</p>}
              {item.status === 'requested' && <div className="mt-3 flex gap-2"><button type="button" disabled={busy} onClick={() => onStatusChange(item, isAppointment ? 'confirmed' : 'accepted')} className="rounded-lg bg-brand px-3 py-2 text-xs font-semibold text-white disabled:opacity-50">{busy ? 'Saving…' : isAppointment ? 'Approve viewing' : 'Accept reservation'}</button><button type="button" disabled={busy} onClick={() => onStatusChange(item, 'declined')} className="rounded-lg border border-border px-3 py-2 text-xs font-semibold text-ink-muted disabled:opacity-50">Decline</button></div>}
              {actionState.id === item.id && actionState.error && <p className="mt-2 text-xs text-red-600">{actionState.error}</p>}
            </article>
          )
        })}
      </div>
    </section>
  )
}

function InquiriesQueue({ inquiries }) {
  return (
    <section className="rounded-xl border border-border bg-surface p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">Tenant Inquiries &amp; Messages</h2>
          <p className="mt-1 text-sm text-ink-muted">Questions asked by renters about your listings.</p>
        </div>
        <span className="rounded-full bg-brand-tint px-2 py-1 text-xs font-semibold text-brand">{inquiries.length} inquiries</span>
      </div>
      <div className="mt-4 flex flex-col gap-3">
        {inquiries.length === 0 && (
          <p className="rounded-lg border border-dashed border-border p-4 text-sm text-ink-muted">No tenant inquiries yet.</p>
        )}
        {inquiries.map((inquiry) => {
          const replyEmail = inquiry.guest_email || inquiry.tenant_email
          const renterPhone = inquiry.guest_phone || inquiry.tenant_phone
          const phoneDigits = renterPhone?.replace(/\D/g, '')
          const whatsappNumber = phoneDigits?.startsWith('0')
            ? `254${phoneDigits.slice(1)}`
            : phoneDigits
          const replySubject = `Re: ${inquiry.title}`
          const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(replyEmail || '')}&su=${encodeURIComponent(replySubject)}`
          const outlookUrl = `https://outlook.office.com/mail/deeplink/compose?to=${encodeURIComponent(replyEmail || '')}&subject=${encodeURIComponent(replySubject)}`
          const whatsappUrl = whatsappNumber
            ? `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(`Hi ${inquiry.guest_name || inquiry.tenant_name || 'there'}, I'm following up on your inquiry about ${inquiry.title}.`)}`
            : null

          return (
            <article key={inquiry.id} className="rounded-lg border border-border p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">{inquiry.guest_name || inquiry.tenant_name || 'Prospective Renter'}</p>
                  <div className="flex flex-wrap gap-3 text-xs text-ink-muted mt-1">
                    {(inquiry.guest_email || inquiry.tenant_email) && (
                      <>
                        <a href={`mailto:${replyEmail}`} className="flex items-center gap-1 text-brand hover:underline">
                          <Mail size={13} /> {replyEmail}
                        </a>
                        <a href={gmailUrl} target="_blank" rel="noreferrer" className="text-brand hover:underline">Reply in Gmail</a>
                        <a href={outlookUrl} target="_blank" rel="noreferrer" className="text-brand hover:underline">Reply in Outlook</a>
                      </>
                    )}
                    {renterPhone && (
                      <>
                        <a href={`tel:${renterPhone}`} className="flex items-center gap-1 text-brand hover:underline">
                          <Phone size={13} /> {renterPhone}
                        </a>
                        {whatsappUrl && (
                          <a href={whatsappUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-brand hover:underline">
                            <MessageCircle size={13} /> WhatsApp
                          </a>
                        )}
                      </>
                    )}
                  </div>
                  <p className="mt-2 text-xs font-medium text-ink-muted">{inquiry.title} · {inquiry.location_name}</p>
                </div>
                <span className="text-[10px] text-ink-muted">{new Date(inquiry.created_at).toLocaleDateString()}</span>
              </div>
              <div className="mt-3 rounded-md bg-page p-3 text-sm text-ink">
                <p className="italic">"{inquiry.message}"</p>
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}

export default function ListerDashboard() {
  const [listings, setListings] = useState([])
  const [locations, setLocations] = useState([])
  const [appointments, setAppointments] = useState([])
  const [reservations, setReservations] = useState([])
  const [inquiries, setInquiries] = useState([])
  const [user, setUser] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [photoFiles, setPhotoFiles] = useState([])
  // Track saved images separately so a lister can keep or remove each one while editing.
  const [existingPhotoUrls, setExistingPhotoUrls] = useState([])
  const [editingId, setEditingId] = useState(null)
  const [actionState, setActionState] = useState({ id: null, error: '' })
  const [state, setState] = useState({ loading: true, saving: false, uploadingPhotos: false, error: '', success: '' })
  const [photoUploadProgress, setPhotoUploadProgress] = useState({ complete: 0, total: 0 })
  const [settingsForm, setSettingsForm] = useState({ fullName: '', phone: '' })
  const [settingsState, setSettingsState] = useState({ saving: false, error: '' })
  const { feedback, notify, dismiss } = useFeedback()
  const [menuOpen, setMenuOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('dashboard')
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [notificationsSeenAt, setNotificationsSeenAt] = useState(0)

  useEffect(() => {
    if (!getToken()) {
      window.location.hash = '#sign-in'
      return
    }
    loadDashboard()
    const refreshId = window.setInterval(() => loadDashboard({ quiet: true }), 60_000)
    return () => window.clearInterval(refreshId)
  }, [])

  async function loadDashboard({ quiet = false } = {}) {
    setState((current) => ({ ...current, ...(quiet ? {} : { loading: true }), error: '' }))
    try {
      const [userResult, listingsResult, appointmentsResult, reservationsResult, inquiriesResult, locationResult] = await Promise.all([
        getCurrentUser(), getMyListings(), getMyListerAppointments(), getMyReservations(), getMyListerInquiries(), listLocations(),
      ])
      if (userResult.user.role !== 'lister' && userResult.user.role !== 'admin') {
        clearToken()
        window.location.hash = '#sign-in'
        return
      }
      setUser(userResult.user)
      if (!quiet) setSettingsForm({ fullName: userResult.user.full_name || '', phone: userResult.user.phone || '' })
      setNotificationsSeenAt(getNotificationsSeenAt(userResult.user.id))
      setListings(listingsResult.listings || [])
      setLocations(locationResult.locations || [])
      setAppointments(appointmentsResult.appointments || [])
      setReservations(reservationsResult.reservations || [])
      setInquiries(inquiriesResult.inquiries || [])
    } catch (error) {
      if (error.status === 401) {
        clearToken()
        window.location.hash = '#sign-in'
      } else {
        setState((current) => ({ ...current, error: error.message }))
      }
    } finally {
      if (!quiet) setState((current) => ({ ...current, loading: false }))
    }
  }

  async function saveSettings(event) {
    event.preventDefault()
    setSettingsState({ saving: true, error: '' })
    try {
      const result = await updateMyProfile(settingsForm)
      setUser(result.user)
      setSettingsForm({ fullName: result.user.full_name || '', phone: result.user.phone || '' })
      notify('Your profile settings were saved.')
      setSettingsState({ saving: false, error: '' })
    } catch (error) {
      setSettingsState({ saving: false, error: error.message })
      notify(error.message, 'error')
    }
  }

  function markNotificationsRead() {
    const now = Date.now()
    setNotificationsSeenAt(now)
    try {
      if (user?.id) window.localStorage.setItem(`nairent_lister_notifications_seen_${user.id}`, String(now))
    } catch {
      // The dashboard still works if browser storage is unavailable.
    }
  }

  function openNotification(tab) {
    markNotificationsRead()
    setNotificationsOpen(false)
    setActiveTab(tab)
  }

  async function changeAppointmentStatus(appointment, status) {
    setActionState({ id: appointment.id, error: '' })
    try {
      const result = await updateAppointmentStatus(appointment.id, status)
      setAppointments((current) => current.map((item) => item.id === appointment.id ? result.appointment : item))
      notify(status === 'confirmed' ? 'Viewing request approved.' : 'Viewing request declined.')
    } catch (error) {
      setActionState({ id: appointment.id, error: error.message })
      notify(error.message, 'error')
    } finally {
      setActionState((current) => ({ ...current, id: null }))
    }
  }

  async function changeReservationStatus(reservation, status) {
    setActionState({ id: reservation.id, error: '' })
    try {
      const result = await updateReservationStatus(reservation.id, status)
      setReservations((current) => current.map((item) => item.id === reservation.id ? result.reservation : item))
      notify(status === 'accepted' ? 'Reservation accepted.' : 'Reservation declined.')
    } catch (error) {
      setActionState({ id: reservation.id, error: error.message })
      notify(error.message, 'error')
    } finally {
      setActionState((current) => ({ ...current, id: null }))
    }
  }

  function startEditing(listing) {
    setEditingId(listing.id)
    setForm({
      title: listing.title,
      description: listing.description,
      monthlyRent: String(listing.monthly_rent),
      viewingFee: String(listing.viewing_fee || 0),
      bedrooms: String(listing.bedrooms),
      location: listing.location_name,
      propertyAddress: listing.property_address || '',
      latitude: listing.property_latitude == null ? '' : String(listing.property_latitude),
      longitude: listing.property_longitude == null ? '' : String(listing.property_longitude),
      amenities: listing.amenities || [],
      photoUrls: '',
      availability: listing.availability_status,
    })
    setExistingPhotoUrls((listing.photos || []).map((photo) => photo.imageUrl))
    setPhotoFiles([])
    setPhotoUploadProgress({ complete: 0, total: 0 })
    document.getElementById('add-property')?.scrollIntoView({ behavior: 'smooth' })
  }

  async function removeListing(listing) {
    if (!window.confirm(`Delete "${listing.title}"? This cannot be undone.`)) return
    setActionState({ id: listing.id, error: '' })
    try {
      await deleteListing(listing.id)
      setListings((current) => current.filter((item) => item.id !== listing.id))
      notify('Property deleted.')
    } catch (error) {
      setActionState({ id: listing.id, error: error.message })
      notify(error.message, 'error')
    } finally {
      setActionState((current) => ({ ...current, id: null }))
    }
  }

  async function changeAvailability(listing, availability) {
    setActionState({ id: listing.id, error: '' })
    try {
      const result = await updateListingAvailability(listing.id, availability)
      setListings((current) => current.map((item) => item.id === listing.id ? result.listing : item))
      notify('Availability updated.')
    } catch (error) {
      setActionState({ id: listing.id, error: error.message })
      notify(error.message, 'error')
    } finally {
      setActionState((current) => ({ ...current, id: null }))
    }
  }

  async function submit(event) {
    event.preventDefault()
    if (!form.latitude || !form.longitude) {
      const message = 'Choose the exact property point on the map before submitting.'
      setState((current) => ({ ...current, error: message, success: '' }))
      notify(message, 'error')
      return
    }
    const additionalPhotoUrls = form.photoUrls.split(/\s+/).map((item) => item.trim()).filter(Boolean)
    if (existingPhotoUrls.length + photoFiles.length + additionalPhotoUrls.length > 15) {
      const message = 'A property can have up to 15 photos. Remove some photos before saving.'
      setState((current) => ({ ...current, error: message, success: '' }))
      notify(message, 'error')
      return
    }
    setState((current) => ({ ...current, saving: true, uploadingPhotos: photoFiles.length > 0, error: '', success: '' }))
    setPhotoUploadProgress({ complete: 0, total: photoFiles.length })
    let uploadedPhotoCount = 0
    try {
      const photoResult = photoFiles.length > 0
        ? await uploadPhotos(photoFiles, (complete, total) => setPhotoUploadProgress({ complete, total }))
        : { photoUrls: [] }
      uploadedPhotoCount = photoResult.photoUrls.length
      setState((current) => ({ ...current, uploadingPhotos: false }))
      // Keep selected saved images and combine them with any newly uploaded or linked photos.
      const payload = {
        ...form,
        latitude: Number(form.latitude),
        longitude: Number(form.longitude),
        amenities: form.amenities,
        photoUrls: [...new Set([...existingPhotoUrls, ...photoResult.photoUrls, ...additionalPhotoUrls])],
      }
      const result = editingId
        ? await updateListing(editingId, payload)
        : await createListing(payload)
      setListings((current) => editingId
        ? current.map((item) => item.id === editingId ? result.listing : item)
        : [result.listing, ...current])
      setForm(emptyForm)
      setPhotoFiles([])
      setExistingPhotoUrls([])
      setPhotoUploadProgress({ complete: 0, total: 0 })
      setEditingId(null)
      const successMessage = editingId
        ? result.listing.moderation_status === 'approved'
          ? 'Listing changes saved and are live now.'
          : 'Listing updated. It will appear after its initial review is complete.'
        : 'Listing submitted for admin review.'
      const photoMessage = uploadedPhotoCount ? ` ${uploadedPhotoCount} photo${uploadedPhotoCount === 1 ? '' : 's'} uploaded.` : ''
      setState({ loading: false, saving: false, uploadingPhotos: false, error: '', success: `${successMessage}${photoMessage}` })
      notify(`${successMessage}${photoMessage}`)
    } catch (error) {
      uploadedPhotoCount = error.uploadedPhotoUrls?.length || 0
      if (uploadedPhotoCount > 0) {
        const enteredUrls = form.photoUrls.split(/\s+/).map((item) => item.trim()).filter(Boolean)
        setForm((current) => ({ ...current, photoUrls: [...error.uploadedPhotoUrls, ...enteredUrls].join('\n') }))
        setPhotoFiles((current) => current.slice(error.uploadedFileCount || 0))
      }
      const message = uploadedPhotoCount
        ? `${uploadedPhotoCount} photo${uploadedPhotoCount === 1 ? '' : 's'} uploaded and kept in Additional photo URLs. Retry saving to continue: ${error.message}`
        : error.message
      setPhotoUploadProgress({ complete: 0, total: 0 })
      setState((current) => ({ ...current, saving: false, uploadingPhotos: false, error: message }))
      notify(message, 'error')
    }
  }

  function update(name, value) {
    setForm((current) => ({ ...current, [name]: value }))
  }

  const publishedCount = listings.filter((listing) => listing.moderation_status === 'approved').length
  const additionalPhotoCount = form.photoUrls.split(/\s+/).filter(Boolean).length
  const photoFileLimit = Math.max(0, 15 - existingPhotoUrls.length - additionalPhotoCount)
  const pendingRequests = appointments.filter((item) => item.status === 'requested').length
    + reservations.filter((item) => item.status === 'requested').length
  const notificationItems = [
    ...appointments.filter((item) => item.status === 'requested').map((item) => ({
      id: `appointment-${item.id}`,
      createdAt: item.created_at,
      type: 'Viewing request',
      name: item.guest_name || 'A renter',
      title: item.title,
      tab: 'viewings',
    })),
    ...reservations.filter((item) => item.status === 'requested').map((item) => ({
      id: `reservation-${item.id}`,
      createdAt: item.created_at,
      type: 'Reservation request',
      name: item.guest_name || 'A renter',
      title: item.title,
      tab: 'viewings',
    })),
    ...inquiries.map((item) => ({
      id: `inquiry-${item.id}`,
      createdAt: item.created_at,
      type: 'New inquiry',
      name: item.guest_name || item.tenant_name || 'A renter',
      title: item.title,
      tab: 'messages',
    })),
  ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  const unreadNotificationCount = notificationItems.filter((item) => new Date(item.createdAt).getTime() > notificationsSeenAt).length
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const pageTitle = {
    dashboard: 'Overview',
    properties: 'My properties',
    viewings: 'Viewings & reservations',
    messages: 'Inquiries & messages',
    settings: 'Settings',
  }[activeTab]
  const pageDescription = {
    dashboard: 'A clear view of your listings and the requests that need attention.',
    properties: 'Keep your property details, photos and availability up to date.',
    viewings: 'Review viewing appointments and reservation requests from renters.',
    messages: 'Read questions from renters and follow up directly.',
    settings: 'Update the contact details shown to renters.',
  }[activeTab]
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'properties', label: 'My properties', icon: Building2 },
    { id: 'viewings', label: 'Viewings & reservations', icon: CalendarDays },
    { id: 'messages', label: 'Inquiries & messages', icon: MessageCircle },
  ]

  return (
    <main className="flex min-h-screen overflow-x-hidden bg-page text-ink md:h-screen md:min-h-0 md:overflow-hidden">
      <FeedbackToast feedback={feedback} onDismiss={dismiss} />
      <aside className={`${menuOpen ? 'flex' : 'hidden'} fixed inset-y-0 left-0 z-40 w-[250px] shrink-0 flex-col overflow-y-auto border-r border-border bg-surface px-4 py-5 md:sticky md:top-0 md:flex md:h-screen md:self-start md:px-5 md:py-6`}>
        <div className="flex items-center justify-between px-2">
          <a href="#top" className="text-[25px] font-bold tracking-tight text-brand">nairent<span className="text-brand-muted">.</span></a>
          <button type="button" onClick={() => setMenuOpen(false)} className="rounded-lg p-2 text-ink-muted hover:bg-page md:hidden" aria-label="Close menu"><X size={19} /></button>
        </div>

        <button type="button" onClick={() => { setActiveTab('settings'); setMenuOpen(false) }} className="mt-7 flex min-w-0 items-center gap-3 rounded-xl border border-border bg-page p-3 text-left hover:border-brand/30">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand text-xs font-bold text-white">{user?.full_name?.split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase() || 'NA'}</span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-xs font-semibold text-ink">{user?.full_name || 'Lister account'}</span>
            <span className="mt-1 block text-[10px] text-ink-muted">Lister account · settings</span>
          </span>
          <Settings size={15} className="shrink-0 text-ink-muted" />
        </button>

        <p className="mt-8 px-3 text-[10px] font-bold uppercase tracking-[0.14em] text-ink-muted">Workspace</p>
        <nav className="mt-2 flex flex-col gap-1" aria-label="Lister workspace">
          {navItems.map(({ id, label, icon: Icon }) => {
            const count = id === 'viewings' ? pendingRequests : id === 'messages' ? inquiries.length : 0
            const selected = activeTab === id
            return (
              <button
                key={id}
                type="button"
                onClick={() => { setActiveTab(id); setMenuOpen(false) }}
                aria-current={selected ? 'page' : undefined}
                className={`flex min-h-11 items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition ${selected ? 'bg-brand text-white' : 'text-ink-muted hover:bg-page hover:text-ink'}`}
              >
                <Icon size={18} className="shrink-0" />
                <span className="min-w-0 flex-1 truncate">{label}</span>
                {count > 0 && <span className={`min-w-5 rounded-full px-1.5 py-0.5 text-center text-[10px] font-semibold ${selected ? 'bg-white/15 text-white' : 'bg-brand-tint text-brand'}`}>{count > 99 ? '99+' : count}</span>}
              </button>
            )
          })}
        </nav>

        <p className="mt-7 px-3 text-[10px] font-bold uppercase tracking-[0.14em] text-ink-muted">Account</p>
        <button type="button" onClick={() => { setActiveTab('settings'); setMenuOpen(false) }} aria-current={activeTab === 'settings' ? 'page' : undefined} className={`mt-2 flex min-h-11 items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition ${activeTab === 'settings' ? 'bg-brand text-white' : 'text-ink-muted hover:bg-page hover:text-ink'}`}>
          <Settings size={18} /> Settings
        </button>
        {user?.role === 'admin' && (
          <a href="#admin" className="mt-1 flex min-h-11 items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-amber-800 hover:bg-amber-50">
            <Shield size={18} /> Admin Dashboard
          </a>
        )}

        <div className="mt-auto flex flex-col gap-1 border-t border-border pt-4">
          <a href="#browse" className="flex min-h-11 items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-ink-muted hover:bg-page hover:text-ink">
            <Search size={18} /> Browse rentals
          </a>
          <button
            type="button"
            onClick={() => { clearToken(); window.location.hash = '#top' }}
            className="flex min-h-11 items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-ink-muted hover:bg-page hover:text-ink"
          >
            <LogOut size={18} /> Sign out
          </button>
        </div>
      </aside>
      {menuOpen && <button type="button" onClick={() => setMenuOpen(false)} className="fixed inset-0 z-30 bg-ink/30 md:hidden" aria-label="Close navigation" />}
      <section className="min-h-0 min-w-0 flex-1 md:h-screen md:overflow-y-auto">
        <header className="relative flex h-[76px] items-center justify-between border-b border-border bg-surface px-5 sm:px-8 lg:px-10">
          <button type="button" onClick={() => setMenuOpen(true)} className="rounded-lg border border-border p-2 text-ink md:hidden" aria-label="Open menu"><Menu size={19} /></button>
          <div className="hidden sm:block">
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-muted">Nairent · lister workspace</p>
            <p className="mt-1 text-xs text-ink-muted">Properties, renter requests and messages</p>
          </div>
          <div className="ml-auto flex items-center gap-4">
            <div className="relative">
              <button type="button" onClick={() => setNotificationsOpen((open) => !open)} className="relative flex size-10 items-center justify-center rounded-lg border border-border text-ink-muted hover:bg-page hover:text-ink" aria-label={`Notifications${unreadNotificationCount ? `, ${unreadNotificationCount} unread` : ''}`} aria-expanded={notificationsOpen}>
                <Bell size={18} />
                {unreadNotificationCount > 0 && <span className="absolute -right-1 -top-1 flex min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold leading-5 text-white">{unreadNotificationCount > 9 ? '9+' : unreadNotificationCount}</span>}
              </button>
              {notificationsOpen && (
                <section className="absolute right-0 top-full z-50 mt-3 w-[min(390px,calc(100vw-2rem))] overflow-hidden rounded-xl border border-border bg-surface shadow-xl" aria-label="Recent notifications">
                  <div className="flex items-center justify-between border-b border-border px-4 py-3">
                    <div><h2 className="text-sm font-semibold text-ink">Recent activity</h2><p className="mt-0.5 text-[11px] text-ink-muted">Refreshes every minute</p></div>
                    {unreadNotificationCount > 0 && <button type="button" onClick={markNotificationsRead} className="text-xs font-semibold text-brand hover:underline">Mark all read</button>}
                  </div>
                  <div className="max-h-[360px] overflow-y-auto">
                    {notificationItems.length === 0 ? (
                      <p className="px-4 py-7 text-center text-sm text-ink-muted">No recent activity yet.</p>
                    ) : notificationItems.slice(0, 8).map((item) => {
                      const unread = new Date(item.createdAt).getTime() > notificationsSeenAt
                      return (
                        <button key={item.id} type="button" onClick={() => openNotification(item.tab)} className="flex w-full items-start gap-3 border-b border-border px-4 py-3 text-left last:border-0 hover:bg-page">
                          <span className={`mt-1 size-2 shrink-0 rounded-full ${unread ? 'bg-brand' : 'bg-transparent'}`} />
                          <span className="min-w-0 flex-1">
                            <span className="block text-xs font-semibold text-ink">{item.type} · {item.name}</span>
                            <span className="mt-1 block truncate text-xs text-ink-muted">{item.title}</span>
                            <span className="mt-1 block text-[10px] text-ink-muted">{new Date(item.createdAt).toLocaleString()}</span>
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </section>
              )}
            </div>
            <button type="button" onClick={() => setActiveTab('settings')} className="flex size-9 items-center justify-center rounded-full bg-brand text-xs font-bold text-white" aria-label="Open profile settings" title="Profile settings">
              {user ? user.full_name.split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase() : '…'}
            </button>
          </div>
        </header>
        <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-8 px-5 py-8 sm:px-8 lg:px-10">
          {state.error && (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700" role="alert">
              <span>{state.error}</span>
              {!user && <button type="button" onClick={loadDashboard} className="font-semibold underline">Retry loading dashboard</button>}
            </div>
          )}
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold text-brand">{greeting}, {user?.full_name?.split(/\s+/)[0] || 'there'}.</p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-ink sm:text-[36px]">{pageTitle}</h1>
              <p className="mt-2 max-w-2xl text-sm text-ink-muted">{pageDescription}</p>
            </div>
            {activeTab !== 'settings' && <button type="button" onClick={() => { setActiveTab('properties'); window.setTimeout(() => document.getElementById('add-property')?.scrollIntoView({ behavior: 'smooth' }), 0) }} className="flex h-11 items-center gap-2 rounded-lg bg-brand px-4 text-sm font-semibold text-white hover:bg-[#123a2d]">
              <Plus size={17} /> Add property
            </button>}
          </div>

          {(activeTab === 'dashboard' || activeTab === 'properties') && (
            <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <button type="button" onClick={() => setActiveTab('properties')} className="rounded-xl border border-border bg-surface p-4 text-left transition hover:border-brand/40">
                <span className="flex items-center justify-between text-xs font-semibold text-ink-muted"><span>PROPERTIES</span><Building2 size={17} className="text-brand" /></span>
                <span className="mt-3 block text-3xl font-semibold tracking-tight text-ink">{listings.length}</span>
                <span className="mt-1 block text-xs text-ink-muted">{publishedCount} published · {Math.max(listings.length - publishedCount, 0)} in review</span>
              </button>
              <button type="button" onClick={() => setActiveTab('properties')} className="rounded-xl border border-border bg-surface p-4 text-left transition hover:border-brand/40">
                <span className="flex items-center justify-between text-xs font-semibold text-ink-muted"><span>LIVE LISTINGS</span><CheckCircle2 size={17} className="text-brand" /></span>
                <span className="mt-3 block text-3xl font-semibold tracking-tight text-ink">{publishedCount}</span>
                <span className="mt-1 block text-xs text-ink-muted">Visible to renters on Nairent</span>
              </button>
              <button type="button" onClick={() => setActiveTab('viewings')} className="rounded-xl border border-border bg-surface p-4 text-left transition hover:border-brand/40">
                <span className="flex items-center justify-between text-xs font-semibold text-ink-muted"><span>NEEDS A RESPONSE</span><CalendarDays size={17} className="text-brand" /></span>
                <span className="mt-3 block text-3xl font-semibold tracking-tight text-ink">{pendingRequests}</span>
                <span className="mt-1 block text-xs text-ink-muted">Viewing and reservation requests</span>
              </button>
              <button type="button" onClick={() => setActiveTab('messages')} className="rounded-xl border border-border bg-surface p-4 text-left transition hover:border-brand/40">
                <span className="flex items-center justify-between text-xs font-semibold text-ink-muted"><span>INQUIRIES</span><MessageCircle size={17} className="text-brand" /></span>
                <span className="mt-3 block text-3xl font-semibold tracking-tight text-ink">{inquiries.length}</span>
                <span className="mt-1 block text-xs text-ink-muted">Questions from prospective renters</span>
              </button>
            </section>
          )}

          {(activeTab === 'dashboard' || activeTab === 'viewings') && (
            <section className="grid gap-6 lg:grid-cols-2">
              <RequestQueue
                title="Viewing requests"
                empty="No viewing requests yet."
                items={appointments}
                type="appointment"
                actionState={actionState}
                onStatusChange={changeAppointmentStatus}
              />
              <RequestQueue
                title="Reservation requests"
                empty="No reservation requests yet."
                items={reservations}
                type="reservation"
                actionState={actionState}
                onStatusChange={changeReservationStatus}
              />
            </section>
          )}

          {(activeTab === 'dashboard' || activeTab === 'messages') && (
            <InquiriesQueue inquiries={inquiries} />
          )}

          {(activeTab === 'dashboard' || activeTab === 'properties') && (
            <>
              <section>
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold">Your properties</h2>
                    <p className="mt-1 text-sm text-ink-muted">Review and manage your latest listings.</p>
                  </div>
                </div>
                {state.loading && <p className="rounded-xl border border-border bg-surface p-6 text-sm text-ink-muted">Loading properties…</p>}
                {!state.loading && listings.length === 0 && <p className="rounded-xl border border-border bg-surface p-6 text-sm text-ink-muted">You have not added a property yet.</p>}
                {!state.loading && listings.length > 0 && (
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {listings.map((listing) => {
                      const image = listing.photos?.[0]?.imageUrl || fallbackPropertyImage
                      return (
                        <article key={listing.id} className="overflow-hidden rounded-xl border border-border bg-surface">
                          <img src={image} alt="" onError={(event) => { event.currentTarget.src = fallbackPropertyImage }} className="h-40 w-full bg-page object-contain p-1" />
                          <div className="p-4">
                            <div className="flex items-start justify-between gap-3">
                              <h3 className="truncate font-semibold">{listing.title}</h3>
                              <span className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-semibold ${listing.moderation_status === 'approved' ? 'bg-brand-tint text-brand' : 'bg-amber-100 text-amber-800'}`}>
                                {listing.moderation_status === 'approved' ? 'Published' : listing.moderation_status}
                              </span>
                            </div>
                    <p className="mt-2 text-xs text-ink-muted">{listing.location_name}</p>
                            <p className="mt-3 text-sm font-semibold text-brand">KSh {Number(listing.monthly_rent).toLocaleString()} <span className="font-normal text-ink-muted">/ month</span></p>
                    <p className="mt-1 text-xs text-ink-muted">Viewing fee: {Number(listing.viewing_fee) > 0 ? `KSh ${Number(listing.viewing_fee).toLocaleString()}` : 'None'}</p>
                    {listing.moderation_status === 'pending' && <p className="mt-2 rounded-lg bg-amber-50 p-2 text-xs text-amber-800">Waiting for admin review. Renters can see it after approval.</p>}
                            <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-ink-muted">
                              <span>{listing.photos?.length || 0} photos</span>
                              <span>{listing.amenities?.length || 0} amenities</span>
                            </div>
                            <label className="mt-4 flex flex-col gap-1 text-xs font-semibold text-ink-muted">
                              Availability
                              <select value={listing.availability_status} disabled={actionState.id === listing.id} onChange={(event) => changeAvailability(listing, event.target.value)} className="h-9 rounded-lg border border-border px-2 text-xs font-normal text-ink">
                                <option value="available">Available now</option>
                                <option value="available_this_month">Available this month</option>
                                <option value="unavailable">Unavailable</option>
                              </select>
                            </label>
                            <div className="mt-3 flex gap-2">
                              <button type="button" onClick={() => startEditing(listing)} className="flex-1 rounded-lg border border-brand px-3 py-2 text-xs font-semibold text-brand">Edit</button>
                              <button type="button" onClick={() => removeListing(listing)} disabled={actionState.id === listing.id} className="flex-1 rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 disabled:opacity-50">Delete</button>
                            </div>
                            {actionState.id === listing.id && actionState.error && <p className="mt-2 text-xs text-red-600">{actionState.error}</p>}
                          </div>
                        </article>
                      )
                    })}
                  </div>
                )}
              </section>

              <section id="add-property" className="grid gap-6 rounded-xl border border-border bg-surface p-5 sm:p-7 lg:grid-cols-[1fr_1.15fr]">
                <div>
                  <p className="text-xs font-semibold text-brand">{editingId ? 'EDIT PROPERTY' : 'NEW LISTING'}</p>
                  <h2 className="mt-2 text-2xl font-semibold">{editingId ? 'Edit property' : 'Add a property'}</h2>
                  <p className="mt-2 max-w-md text-sm leading-relaxed text-ink-muted">Complete the details below. An admin must approve new and edited properties before renters can see them. Choose the viewing fee that applies to this property.</p>
                  <div className="mt-6 hidden rounded-lg bg-brand-tint p-4 text-sm leading-relaxed text-brand lg:block">
                    Required fields are marked with *. Enter 0 if this property has no viewing fee.
                  </div>
                </div>
                <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
                  <label className="flex flex-col gap-1 text-sm font-medium text-ink sm:col-span-2">
                    Property title *<span className="text-xs font-normal text-ink-muted">3–180 characters</span>
                    <input required minLength="3" maxLength="180" value={form.title} onChange={(event) => update('title', event.target.value)} placeholder="e.g. Bright two-bedroom apartment" className="h-11 rounded-lg border border-border px-3 text-sm" />
                  </label>
                  <label className="flex flex-col gap-1 text-sm font-medium text-ink sm:col-span-2">
                    Location *<span className="text-xs font-normal text-ink-muted">Choose a Nairobi location</span>
                    <select required value={form.location} onChange={(event) => setForm((current) => ({ ...current, location: event.target.value, latitude: '', longitude: '' }))} className="h-11 rounded-lg border border-border px-3 text-sm">
                      <option value="">Select Nairobi location</option>
                      {locations.map((location) => <option key={location.id} value={location.name}>{location.name}</option>)}
                    </select>
                  </label>
                  <label className="flex flex-col gap-1 text-sm font-medium text-ink sm:col-span-2">
                    Exact property location *<span className="text-xs font-normal text-ink-muted">Enter the building or street address renters should see. Keep it consistent with the selected neighborhood; this location is public.</span>
                    <input required={!editingId} minLength="5" maxLength="300" value={form.propertyAddress} onChange={(event) => update('propertyAddress', event.target.value)} placeholder="e.g. Yaya Centre, Argwings Kodhek Road, Kilimani, Nairobi" className="h-11 rounded-lg border border-border px-3 text-sm" />
                  </label>
                  <GoogleLocationPicker
                    latitude={form.latitude}
                    longitude={form.longitude}
                    centerLatitude={locations.find((location) => location.name === form.location)?.latitude}
                    centerLongitude={locations.find((location) => location.name === form.location)?.longitude}
                    onChange={({ latitude, longitude }) => setForm((current) => ({ ...current, latitude, longitude }))}
                  />
                  <label className="flex flex-col gap-1 text-sm font-medium text-ink">
                    Monthly rent (KSh) *<span className="text-xs font-normal text-ink-muted">Whole number above 0</span>
                    <input required min="1" type="number" value={form.monthlyRent} onChange={(event) => update('monthlyRent', event.target.value)} placeholder="65000" className="h-11 rounded-lg border border-border px-3 text-sm" />
                  </label>
                  <label className="flex flex-col gap-1 text-sm font-medium text-ink">
                    Viewing fee (KSh)<span className="text-xs font-normal text-ink-muted">Set the amount renters pay for a viewing, or enter 0 for no fee.</span>
                    <input required min="0" max="1000000" step="1" type="number" value={form.viewingFee} onChange={(event) => update('viewingFee', event.target.value)} placeholder="0" className="h-11 rounded-lg border border-border px-3 text-sm" />
                  </label>
                  <label className="flex flex-col gap-1 text-sm font-medium text-ink">
                    Bedrooms *<span className="text-xs font-normal text-ink-muted">Use 0 for a studio</span>
                    <input required min="0" max="20" type="number" value={form.bedrooms} onChange={(event) => update('bedrooms', event.target.value)} placeholder="2" className="h-11 rounded-lg border border-border px-3 text-sm" />
                  </label>
                  <label className="flex flex-col gap-1 text-sm font-medium text-ink sm:col-span-2">
                    Description *<span className="text-xs font-normal text-ink-muted">10–2,000 characters; mention nearby transport or important details</span>
                    <textarea required minLength="10" maxLength="2000" rows="4" value={form.description} onChange={(event) => update('description', event.target.value)} placeholder="Describe the property, amenities and nearby transport." className="rounded-lg border border-border p-3 text-sm" />
                  </label>
                  <fieldset className="sm:col-span-2">
                    <legend className="text-sm font-medium text-ink">Amenities <span className="font-normal text-ink-muted">(optional)</span></legend>
                    <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
                      {amenityOptions.map((amenity) => (
                        <label key={amenity} className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs text-ink">
                          <input type="checkbox" checked={form.amenities.includes(amenity)} onChange={() => update('amenities', form.amenities.includes(amenity) ? form.amenities.filter((item) => item !== amenity) : [...form.amenities, amenity])} />
                          {amenity}
                        </label>
                      ))}
                    </div>
                  </fieldset>
                  {editingId && (
                    <fieldset className="grid gap-2 sm:col-span-2">
                      <legend className="text-sm font-medium text-ink">Current property photos ({existingPhotoUrls.length})</legend>
                      {existingPhotoUrls.length > 0 ? (
                        <>
                          <p className="text-xs text-ink-muted">Remove any photo you no longer want on this listing.</p>
                          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                            {existingPhotoUrls.map((photoUrl, index) => (
                              <article key={`${photoUrl}-${index}`} className="relative overflow-hidden rounded-lg border border-border bg-page">
                                <img src={photoUrl} alt={`Current property photo ${index + 1}`} loading="lazy" onError={(event) => { event.currentTarget.src = fallbackPropertyImage }} className="h-32 w-full bg-white object-contain p-1" />
                                <button type="button" aria-label={`Remove current photo ${index + 1}`} title="Remove photo" onClick={() => setExistingPhotoUrls((current) => current.filter((_, photoIndex) => photoIndex !== index))} className="absolute right-2 top-2 flex size-8 items-center justify-center rounded-full bg-white/95 text-red-700 shadow-sm hover:bg-white">
                                  <X size={15} />
                                </button>
                              </article>
                            ))}
                          </div>
                        </>
                      ) : <p className="text-xs text-ink-muted">No saved photos remain. Add new photos below if needed.</p>}
                    </fieldset>
                  )}
                  <fieldset className="grid gap-2 sm:col-span-2">
                    <legend className="text-sm font-medium text-ink">Add property photos</legend>
                    <span className="text-xs font-normal text-ink-muted">Optional, up to 15 photos total. Choose several together or add more in another batch. JPEG, PNG or WebP; max 5 MB each.</span>
                    <input type="file" accept="image/jpeg,image/png,image/webp" multiple disabled={photoFileLimit === 0} onChange={(event) => {
                      const selected = Array.from(event.target.files || [])
                      const knownFiles = new Set(photoFiles.map((file) => `${file.name}:${file.size}:${file.lastModified}`))
                      const newFiles = selected.filter((file) => {
                        const key = `${file.name}:${file.size}:${file.lastModified}`
                        if (knownFiles.has(key)) return false
                        knownFiles.add(key)
                        return true
                      })
                      if (photoFiles.length + newFiles.length > photoFileLimit) notify(`A property can have 15 photos total. You can add ${Math.max(0, photoFileLimit - photoFiles.length)} more.`, 'error')
                      setPhotoFiles((current) => [...current, ...newFiles].slice(0, photoFileLimit))
                      event.currentTarget.value = ''
                    }} className="rounded-lg border border-border p-2 text-sm" />
                    <span className="text-xs font-normal text-ink-muted">{photoFiles.length} new upload(s) selected · {existingPhotoUrls.length + additionalPhotoCount + photoFiles.length}/15 total photos</span>
                    {state.uploadingPhotos && <span className="text-xs text-brand" role="status">Uploading photos {photoUploadProgress.complete}/{photoUploadProgress.total}…</span>}
                    {photoFiles.length > 0 && <span className="grid gap-2">{photoFiles.map((file, index) => (
                      <span key={`${file.name}-${file.size}-${file.lastModified}`} className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2 text-xs font-normal text-ink">
                        <span className="min-w-0 truncate">{file.name}</span>
                        <button type="button" onClick={() => setPhotoFiles((current) => current.filter((_, photoIndex) => photoIndex !== index))} className="shrink-0 font-semibold text-red-700">Remove</button>
                      </span>
                    ))}</span>}
                  </fieldset>
                  <label className="flex flex-col gap-1 text-sm font-medium text-ink sm:col-span-2">
                    Additional photo URLs <span className="text-xs font-normal text-ink-muted">Optional; separate new image URLs with spaces or new lines</span>
                    <textarea rows="3" value={form.photoUrls} onChange={(event) => update('photoUrls', event.target.value)} placeholder="https://example.com/photo.jpg" className="rounded-lg border border-border p-3 text-sm" />
                  </label>
                  {state.success && <p className="text-sm text-brand sm:col-span-2" role="status">{state.success}</p>}
                  <div className="flex gap-2 sm:col-span-2">
                    <button disabled={state.saving} className="flex h-11 flex-1 items-center justify-center rounded-lg bg-brand text-sm font-semibold text-white disabled:opacity-60">
                      {state.uploadingPhotos ? `Uploading photos ${photoUploadProgress.complete}/${photoUploadProgress.total}…` : state.saving ? 'Saving listing…' : editingId ? 'Save changes' : 'Submit for review'}
                    </button>
                    {editingId && (
                      <button type="button" onClick={() => { setEditingId(null); setForm(emptyForm); setPhotoFiles([]); setExistingPhotoUrls([]); setPhotoUploadProgress({ complete: 0, total: 0 }) }} className="h-11 rounded-lg border border-border px-4 text-sm font-semibold text-ink-muted">
                        Cancel
                      </button>
                    )}
                  </div>
                </form>
              </section>
            </>
          )}

          {activeTab === 'settings' && (
            <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
              <form onSubmit={saveSettings} className="rounded-xl border border-border bg-surface p-5 sm:p-7">
                <div className="border-b border-border pb-4">
                  <h2 className="text-lg font-semibold text-ink">Profile and contact</h2>
                  <p className="mt-1 text-sm text-ink-muted">Renters use these details when contacting you about a property.</p>
                </div>
                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <label className="flex flex-col gap-2 text-sm font-medium text-ink">
                    Full name
                    <input required minLength="2" maxLength="120" value={settingsForm.fullName} onChange={(event) => setSettingsForm((current) => ({ ...current, fullName: event.target.value }))} className="h-11 rounded-lg border border-border px-3 text-sm" />
                  </label>
                  <label className="flex flex-col gap-2 text-sm font-medium text-ink">
                    Phone number <span className="text-xs font-normal text-ink-muted">Optional; shown to renters when provided</span>
                    <input maxLength="32" type="tel" value={settingsForm.phone} onChange={(event) => setSettingsForm((current) => ({ ...current, phone: event.target.value }))} className="h-11 rounded-lg border border-border px-3 text-sm" />
                  </label>
                  <label className="flex flex-col gap-2 text-sm font-medium text-ink sm:col-span-2">
                    Account email
                    <input readOnly value={user?.email || ''} className="h-11 rounded-lg border border-border bg-page px-3 text-sm text-ink-muted" />
                    <span className="text-xs font-normal text-ink-muted">Your confirmed sign-in email is read-only.</span>
                  </label>
                </div>
                {settingsState.error && <p className="mt-4 text-sm text-red-700" role="alert">{settingsState.error}</p>}
                <div className="mt-6 flex justify-end border-t border-border pt-4">
                  <button type="submit" disabled={settingsState.saving} className="flex h-11 items-center gap-2 rounded-lg bg-brand px-5 text-sm font-semibold text-white disabled:opacity-60">
                    {settingsState.saving ? 'Saving…' : 'Save changes'}
                  </button>
                </div>
              </form>
              <aside className="h-fit rounded-xl border border-border bg-surface p-5">
                <h2 className="text-sm font-semibold text-ink">Your public profile</h2>
                <p className="mt-2 text-sm leading-relaxed text-ink-muted">Your name appears on your listings. A phone number is shown only when you add one; renters can always contact you through your listing message inbox.</p>
              </aside>
            </section>
          )}
        </div>
      </section>
    </main>
  )
}
