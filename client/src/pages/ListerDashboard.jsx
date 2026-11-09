import { useEffect, useState } from 'react'
import { Bell, Building2, CalendarDays, CheckCircle2, Home, LogOut, Menu, MessageCircle, Plus, Search, Settings, X } from 'lucide-react'
import { clearToken, createListing, deleteListing, getCurrentUser, getMyListings, getToken, updateListing, updateListingAvailability, uploadPhotos } from '../lib/api.js'
import fallbackPropertyImage from '../assets/landing/property-photograph-1.png'

const amenityOptions = ['Wi-Fi', 'Parking', 'Balcony', 'Security', 'Generator', 'Water included', 'Furnished', 'Pet friendly', 'Swimming pool', 'Gym']
const emptyForm = { title: '', description: '', monthlyRent: '', bedrooms: '0', location: '', amenities: [], photoUrls: '', availability: 'available' }

export default function ListerDashboard() {
  const [listings, setListings] = useState([])
  const [user, setUser] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [photoFiles, setPhotoFiles] = useState([])
  const [editingId, setEditingId] = useState(null)
  const [actionState, setActionState] = useState({ id: null, error: '' })
  const [state, setState] = useState({ loading: true, saving: false, error: '', success: '' })
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    if (!getToken()) {
      window.location.hash = '#sign-in'
      return
    }

    Promise.all([getCurrentUser(), getMyListings()])
      .then(([userResult, listingsResult]) => {
        if (userResult.user.role !== 'lister') {
          clearToken()
          throw new Error('This dashboard is only available to listers.')
        }
        setUser(userResult.user)
        setListings(listingsResult.listings)
      })
      .catch((error) => {
        clearToken()
        setState({ loading: false, saving: false, error: error.message, success: '' })
        window.location.hash = '#sign-in'
      })
      .finally(() => setState((current) => ({ ...current, loading: false })))
  }, [])

  function startEditing(listing) {
    setEditingId(listing.id)
    setForm({
      title: listing.title,
      description: listing.description,
      monthlyRent: String(listing.monthly_rent),
      bedrooms: String(listing.bedrooms),
      location: listing.location_name,
      amenities: listing.amenities || [],
      photoUrls: (listing.photos || []).map((photo) => photo.imageUrl).join('\n'),
      availability: listing.availability_status,
    })
    setPhotoFiles([])
    document.getElementById('add-property')?.scrollIntoView({ behavior: 'smooth' })
  }

  async function removeListing(listing) {
    if (!window.confirm(`Delete "${listing.title}"? This cannot be undone.`)) return
    setActionState({ id: listing.id, error: '' })
    try {
      await deleteListing(listing.id)
      setListings((current) => current.filter((item) => item.id !== listing.id))
    } catch (error) {
      setActionState({ id: listing.id, error: error.message })
    } finally {
      setActionState((current) => ({ ...current, id: null }))
    }
  }

  async function changeAvailability(listing, availability) {
    setActionState({ id: listing.id, error: '' })
    try {
      const result = await updateListingAvailability(listing.id, availability)
      setListings((current) => current.map((item) => item.id === listing.id ? result.listing : item))
    } catch (error) {
      setActionState({ id: listing.id, error: error.message })
    } finally {
      setActionState((current) => ({ ...current, id: null }))
    }
  }

  async function submit(event) {
    event.preventDefault()
    setState((current) => ({ ...current, saving: true, error: '', success: '' }))
    try {
      const photoResult = photoFiles.length > 0 ? await uploadPhotos(photoFiles) : { photoUrls: [] }
      const payload = {
        ...form,
        amenities: form.amenities,
        photoUrls: [...photoResult.photoUrls, ...form.photoUrls.split(/\s+/).map((item) => item.trim()).filter(Boolean)].slice(0, 12),
      }
      const result = editingId
        ? await updateListing(editingId, payload)
        : await createListing(payload)
      setListings((current) => editingId
        ? current.map((item) => item.id === editingId ? result.listing : item)
        : [result.listing, ...current])
      setForm(emptyForm)
      setPhotoFiles([])
      setEditingId(null)
      setState({ loading: false, saving: false, error: '', success: editingId ? 'Listing updated successfully.' : 'Listing published successfully.' })
    } catch (error) {
      setState((current) => ({ ...current, saving: false, error: error.message }))
    }
  }

  function update(name, value) {
    setForm((current) => ({ ...current, [name]: value }))
  }

  const publishedCount = listings.filter((listing) => listing.moderation_status === 'approved').length
  const navItems = [
    { label: 'Dashboard', icon: Home, href: '#dashboard', active: true },
    { label: 'My properties', icon: Building2, href: '#dashboard' },
    { label: 'Viewings', icon: CalendarDays, href: '#dashboard' },
    { label: 'Messages', icon: MessageCircle, href: '#dashboard' },
  ]

  return (
    <main className="flex min-h-screen overflow-x-hidden bg-page text-ink">
      <aside className={`${menuOpen ? 'flex' : 'hidden'} fixed inset-y-0 left-0 z-40 w-[238px] flex-col border-r border-border bg-surface px-5 py-7 md:sticky md:flex md:h-screen`}>
        <div className="flex items-center justify-between">
          <a href="#top" className="text-[25px] font-bold text-brand">nairent<span className="text-brand-muted">.</span></a>
          <button type="button" onClick={() => setMenuOpen(false)} className="text-ink-muted md:hidden" aria-label="Close menu"><X size={19} /></button>
        </div>
        <p className="mt-12 px-3 text-[10px] font-bold uppercase tracking-[0.14em] text-ink-muted">Workspace</p>
        <nav className="mt-3 flex flex-col gap-1">
          {navItems.map(({ label, icon: Icon, href, active }) => (
            <a key={label} href={href} className={`flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium ${active ? 'bg-brand-tint text-brand' : 'text-ink-muted hover:bg-page hover:text-ink'}`}><Icon size={18} />{label}</a>
          ))}
        </nav>
        <div className="mt-auto flex flex-col gap-1">
          <a href="#dashboard" className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium text-ink-muted hover:bg-page"><Settings size={18} />Settings</a>
          <button type="button" onClick={() => { window.localStorage.removeItem('nairent_token'); window.location.hash = '#top' }} className="flex items-center gap-3 rounded-lg px-3 py-3 text-left text-sm font-medium text-ink-muted hover:bg-page"><LogOut size={18} />Sign out</button>
        </div>
      </aside>
      {menuOpen && <button type="button" onClick={() => setMenuOpen(false)} className="fixed inset-0 z-30 bg-ink/30 md:hidden" aria-label="Close navigation" />}
      <section className="min-w-0 flex-1">
        <header className="flex h-[76px] items-center justify-between border-b border-border bg-surface px-5 sm:px-8 lg:px-10">
          <button type="button" onClick={() => setMenuOpen(true)} className="rounded-lg border border-border p-2 text-ink md:hidden" aria-label="Open menu"><Menu size={19} /></button>
          <div className="hidden items-center gap-3 rounded-lg border border-border bg-page px-3 py-2 text-xs text-ink-muted sm:flex"><Search size={15} />Search your workspace</div>
          <div className="ml-auto flex items-center gap-4"><button type="button" className="text-ink-muted" aria-label="Notifications"><Bell size={19} /></button><span className="flex size-9 items-center justify-center rounded-full bg-brand text-xs font-bold text-white">{user ? user.full_name.split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase() : '…'}</span></div>
        </header>
        <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-8 px-5 py-8 sm:px-8 lg:px-10">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div><p className="text-xs font-semibold text-brand">GOOD MORNING, {user?.full_name?.split(/\s+/)[0]?.toUpperCase() || 'LISTER'}</p><h1 className="mt-2 text-[30px] font-semibold tracking-tight text-ink sm:text-[38px]">Your dashboard</h1><p className="mt-2 text-sm text-ink-muted">Manage your properties and keep your listings up to date.</p></div>
            <button type="button" onClick={() => document.getElementById('add-property')?.scrollIntoView({ behavior: 'smooth' })} className="flex h-11 items-center gap-2 rounded-lg bg-brand px-4 text-sm font-semibold text-white"><Plus size={17} /> Add property</button>
          </div>
          <section className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-border bg-surface p-5"><div className="flex items-center justify-between"><p className="text-xs font-semibold text-ink-muted">TOTAL PROPERTIES</p><Building2 size={18} className="text-brand" /></div><p className="mt-4 text-3xl font-semibold">{listings.length}</p><p className="mt-1 text-xs text-ink-muted">Across your portfolio</p></div>
            <div className="rounded-xl border border-border bg-surface p-5"><div className="flex items-center justify-between"><p className="text-xs font-semibold text-ink-muted">PUBLISHED</p><CheckCircle2 size={18} className="text-brand" /></div><p className="mt-4 text-3xl font-semibold">{publishedCount}</p><p className="mt-1 text-xs text-ink-muted">Visible to renters</p></div>
          </section>
          <section>
            <div className="mb-4 flex items-center justify-between"><div><h2 className="text-xl font-semibold">Your properties</h2><p className="mt-1 text-sm text-ink-muted">Review and manage your latest listings.</p></div><a href="#dashboard" className="text-sm font-semibold text-brand">View all</a></div>
            {state.loading && <p className="rounded-xl border border-border bg-surface p-6 text-sm text-ink-muted">Loading properties…</p>}
            {!state.loading && listings.length === 0 && <p className="rounded-xl border border-border bg-surface p-6 text-sm text-ink-muted">You have not added a property yet.</p>}
            {!state.loading && listings.length > 0 && <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{listings.map((listing) => { const image = listing.photos?.[0]?.imageUrl || fallbackPropertyImage; return <article key={listing.id} className="overflow-hidden rounded-xl border border-border bg-surface"><img src={image} alt="" onError={(event) => { event.currentTarget.src = fallbackPropertyImage }} className="h-40 w-full object-cover" /><div className="p-4"><div className="flex items-start justify-between gap-3"><h3 className="truncate font-semibold">{listing.title}</h3><span className="shrink-0 rounded-full bg-brand-tint px-2 py-1 text-[10px] font-semibold text-brand">Published</span></div><p className="mt-2 text-xs text-ink-muted">{listing.location_name}</p><p className="mt-3 text-sm font-semibold text-brand">KSh {Number(listing.monthly_rent).toLocaleString()} <span className="font-normal text-ink-muted">/ month</span></p><div className="mt-3 flex flex-wrap gap-2 text-[11px] text-ink-muted"><span>{listing.photos?.length || 0} photos</span><span>{listing.amenities?.length || 0} amenities</span></div><label className="mt-4 flex flex-col gap-1 text-xs font-semibold text-ink-muted">Availability<select value={listing.availability_status} disabled={actionState.id === listing.id} onChange={(event) => changeAvailability(listing, event.target.value)} className="h-9 rounded-lg border border-border px-2 text-xs font-normal text-ink"><option value="available">Available now</option><option value="available_this_month">Available this month</option><option value="unavailable">Unavailable</option></select></label><div className="mt-3 flex gap-2"><button type="button" onClick={() => startEditing(listing)} className="flex-1 rounded-lg border border-brand px-3 py-2 text-xs font-semibold text-brand">Edit</button><button type="button" onClick={() => removeListing(listing)} disabled={actionState.id === listing.id} className="flex-1 rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 disabled:opacity-50">Delete</button></div>{actionState.id === listing.id && actionState.error && <p className="mt-2 text-xs text-red-600">{actionState.error}</p>}</div></article> })}</div>}
          </section>
          <section id="add-property" className="grid gap-6 rounded-xl border border-border bg-surface p-5 sm:p-7 lg:grid-cols-[1fr_1.15fr]">
            <div><p className="text-xs font-semibold text-brand">{editingId ? 'EDIT PROPERTY' : 'NEW LISTING'}</p><h2 className="mt-2 text-2xl font-semibold">{editingId ? 'Edit property' : 'Add a property'}</h2><p className="mt-2 max-w-md text-sm leading-relaxed text-ink-muted">Complete the required details below. Your property will appear to renters as soon as it is published.</p><div className="mt-6 hidden rounded-lg bg-brand-tint p-4 text-sm leading-relaxed text-brand lg:block">Required fields are marked with *. Add at least one clear photo for the best result.</div></div>
            <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
              <label className="flex flex-col gap-1 text-sm font-medium text-ink sm:col-span-2">Property title *<span className="text-xs font-normal text-ink-muted">3–180 characters</span><input required minLength="3" maxLength="180" value={form.title} onChange={(event) => update('title', event.target.value)} placeholder="e.g. Bright two-bedroom apartment" className="h-11 rounded-lg border border-border px-3 text-sm" /></label>
              <label className="flex flex-col gap-1 text-sm font-medium text-ink sm:col-span-2">Location *<span className="text-xs font-normal text-ink-muted">Choose a Nairobi location</span><select required value={form.location} onChange={(event) => update('location', event.target.value)} className="h-11 rounded-lg border border-border px-3 text-sm"><option value="">Select Nairobi location</option>{['Kilimani', 'South B', 'Kileleshwa', 'Langata', 'Lavington', 'Westlands', 'Parklands', 'Kasarani', 'Embakasi', 'Donholm', 'Runda', 'Karen', 'Roysambu', 'Kahawa West', 'Ruaka', 'Umoja', 'Kasarani Mwiki', 'Ngong Road', 'Madaraka'].map((location) => <option key={location}>{location}</option>)}</select></label>
              <label className="flex flex-col gap-1 text-sm font-medium text-ink">Monthly rent (KSh) *<span className="text-xs font-normal text-ink-muted">Whole number above 0</span><input required min="1" type="number" value={form.monthlyRent} onChange={(event) => update('monthlyRent', event.target.value)} placeholder="65000" className="h-11 rounded-lg border border-border px-3 text-sm" /></label><label className="flex flex-col gap-1 text-sm font-medium text-ink">Bedrooms *<span className="text-xs font-normal text-ink-muted">Use 0 for a studio</span><input required min="0" max="20" type="number" value={form.bedrooms} onChange={(event) => update('bedrooms', event.target.value)} placeholder="2" className="h-11 rounded-lg border border-border px-3 text-sm" /></label>
              <label className="flex flex-col gap-1 text-sm font-medium text-ink sm:col-span-2">Description *<span className="text-xs font-normal text-ink-muted">10–2,000 characters; mention nearby transport or important details</span><textarea required minLength="10" maxLength="2000" rows="4" value={form.description} onChange={(event) => update('description', event.target.value)} placeholder="Describe the property, amenities and nearby transport." className="rounded-lg border border-border p-3 text-sm" /></label>
              <fieldset className="sm:col-span-2"><legend className="text-sm font-medium text-ink">Amenities <span className="font-normal text-ink-muted">(optional; choose all that apply)</span></legend><div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">{amenityOptions.map((amenity) => <label key={amenity} className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs text-ink"><input type="checkbox" checked={form.amenities.includes(amenity)} onChange={() => update('amenities', form.amenities.includes(amenity) ? form.amenities.filter((item) => item !== amenity) : [...form.amenities, amenity])} />{amenity}</label>)}</div></fieldset>
              <label className="flex flex-col gap-1 text-sm font-medium text-ink sm:col-span-2">Upload property photos <span className="text-xs font-normal text-ink-muted">Optional, up to 12 images; JPEG, PNG or WebP; maximum 10 MB each</span><input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={(event) => setPhotoFiles(Array.from(event.target.files || []).slice(0, 12))} className="rounded-lg border border-border p-2 text-sm" /><span className="text-xs font-normal text-ink-muted">{photoFiles.length} file(s) selected</span></label>
              <label className="flex flex-col gap-1 text-sm font-medium text-ink sm:col-span-2">Existing photo URLs <span className="text-xs font-normal text-ink-muted">Optional; separate URLs with spaces or new lines</span><textarea rows="3" value={form.photoUrls} onChange={(event) => update('photoUrls', event.target.value)} placeholder="https://example.com/photo.jpg" className="rounded-lg border border-border p-3 text-sm" /></label>
              {state.error && <p className="text-sm text-red-600 sm:col-span-2" role="alert">{state.error}</p>}{state.success && <p className="text-sm text-brand sm:col-span-2" role="status">{state.success}</p>}
              <div className="flex gap-2 sm:col-span-2"><button disabled={state.saving} className="flex h-11 flex-1 items-center justify-center rounded-lg bg-brand text-sm font-semibold text-white disabled:opacity-60">{state.saving ? 'Saving…' : editingId ? 'Save changes' : 'Publish property'}</button>{editingId && <button type="button" onClick={() => { setEditingId(null); setForm(emptyForm); setPhotoFiles([]) }} className="h-11 rounded-lg border border-border px-4 text-sm font-semibold text-ink-muted">Cancel</button>}</div>
            </form>
          </section>
        </div>
      </section>
    </main>
  )
}
