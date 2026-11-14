// Shows the newest approved homes from the API on the landing page.
import { useEffect, useState } from 'react'
import { ArrowRight, BedDouble, MapPin } from 'lucide-react'
import { getFeaturedListings } from '../../lib/api.js'
import fallbackPropertyImage from '../../assets/landing/property-photograph-1.png'

function formatViewingFee(fee) {
  const amount = Number(fee) || 0
  return amount > 0 ? `KSh ${amount.toLocaleString()} viewing fee` : 'No viewing fee'
}

function ListingCard({ listing }) {
  const photo = listing.photos?.[0]?.imageUrl || fallbackPropertyImage
  const detailsHref = `#browse?listing=${encodeURIComponent(listing.id)}`

  return (
    <article className="flex min-w-0 flex-col overflow-hidden rounded-xl border border-border bg-surface transition hover:-translate-y-0.5 hover:shadow-md">
      <a href={detailsHref} aria-label={`View details for ${listing.title}`} className="relative block aspect-[4/3] w-full bg-page">
        <img src={photo} alt={listing.title} loading="lazy" decoding="async" onError={(event) => { event.currentTarget.src = fallbackPropertyImage }} className="absolute inset-0 h-full w-full object-contain p-1" />
        <span className="absolute left-3 top-3 rounded-md bg-white px-2.5 py-1.5 text-[10px] font-semibold text-brand shadow-sm">Latest listing</span>
      </a>
      <div className="flex flex-1 flex-col gap-3 p-5">
        <div>
          <p className="text-2xl font-bold text-ink">KSh {Number(listing.monthly_rent).toLocaleString()}<span className="ml-1 text-xs font-normal text-ink-muted">/ month</span></p>
          <a href={detailsHref} className="mt-1 block text-base font-semibold text-ink hover:text-brand">{listing.title}</a>
          <p className="mt-1 flex items-center gap-1.5 text-xs text-ink-muted"><MapPin size={13} className="shrink-0 text-brand" />{listing.property_address || listing.location_name}</p>
        </div>
        <div className="flex items-center justify-between border-t border-border pt-3 text-xs">
          <span className="flex items-center gap-1.5 text-ink-muted"><BedDouble size={15} className="text-brand" />{listing.bedrooms === 0 ? 'Studio' : `${listing.bedrooms} bedrooms`}</span>
          <span className="capitalize text-ink-muted">{listing.availability_status?.replaceAll('_', ' ')}</span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-semibold text-brand">{formatViewingFee(listing.viewing_fee)}</span>
          <a href={detailsHref} className="inline-flex h-10 items-center gap-2 rounded-lg bg-brand px-4 text-xs font-semibold text-white hover:bg-[#123a2d]">
            View details <ArrowRight size={14} />
          </a>
        </div>
      </div>
    </article>
  )
}

export default function FeaturedListings() {
  const [listings, setListings] = useState([])
  const [state, setState] = useState({ loading: true, error: '' })

  useEffect(() => {
    let active = true
    getFeaturedListings()
      .then((result) => {
        if (active) setListings(result.listings || [])
      })
      .catch((error) => {
        if (active) setState({ loading: false, error: error.message })
      })
      .finally(() => {
        if (active) setState((current) => ({ ...current, loading: false }))
      })
    return () => { active = false }
  }, [])

  return (
    <section id="rentals" className="w-full px-5 py-10 md:px-14 md:py-14">
      <div className="mx-auto flex max-w-7xl flex-col gap-7">
        <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
          <div className="flex max-w-[760px] flex-col gap-3">
            <p className="text-[11px] font-semibold tracking-wide text-brand">RECENTLY LISTED</p>
            <h2 className="text-[26px] font-semibold leading-[1.15] text-ink md:text-[34px]">Homes added to Nairent.</h2>
            <p className="text-[15px] leading-relaxed text-ink-muted">See the newest approved homes, with rent and viewing fees shown upfront.</p>
          </div>
          <a href="#browse" className="inline-flex shrink-0 items-center gap-2 text-sm font-semibold text-brand hover:underline">Browse all homes <ArrowRight size={16} /></a>
        </div>

        {state.loading ? (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3" aria-label="Loading recently listed homes">
            {[0, 1, 2].map((item) => <div key={item} className="h-[360px] animate-pulse rounded-xl border border-border bg-surface" />)}
          </div>
        ) : listings.length > 0 ? (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {listings.map((listing) => <ListingCard key={listing.id} listing={listing} />)}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-border bg-surface px-6 py-10 text-center">
            <p className="font-semibold text-ink">{state.error ? 'Latest homes are temporarily unavailable.' : 'No approved homes are available yet.'}</p>
            <p className="mt-2 text-sm text-ink-muted">{state.error ? 'You can still search all homes or try again shortly.' : 'New listings will appear here as soon as they are approved.'}</p>
            <a href="#browse" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-brand">Find a home <ArrowRight size={15} /></a>
          </div>
        )}
      </div>
    </section>
  )
}
