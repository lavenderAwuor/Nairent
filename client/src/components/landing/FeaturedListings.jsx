import { useState } from 'react'
import { Bath, BedDouble, Heart } from 'lucide-react'
import { featuredListings } from '../../data/landingContent.js'

function ListingCard({ listing }) {
  const [saved, setSaved] = useState(false)

  return (
    <article className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-xl border border-border bg-surface">
      <div className="relative h-[200px] w-full md:h-[230px]">
        <img src={listing.photo} alt={listing.name} className="size-full object-cover" />
        <span className="absolute left-3.5 top-3.5 rounded bg-white px-2.5 py-1.5 text-[10px] font-semibold text-ink">
          {listing.badge}
        </span>
        <button
          type="button"
          onClick={() => setSaved((value) => !value)}
          aria-pressed={saved}
          aria-label={saved ? 'Remove from saved homes' : 'Save this home'}
          className="absolute right-3.5 top-3.5 flex size-8 items-center justify-center rounded-full bg-white"
        >
          <Heart size={17} className={saved ? 'fill-brand text-brand' : 'text-ink'} />
        </button>
      </div>
      <div className="flex flex-col gap-2.5 p-5">
        <p className="text-[25px] font-bold text-ink">
          {listing.price}
          <span className="text-xs font-normal text-ink-muted"> / month</span>
        </p>
        <p className="text-[17px] font-semibold text-ink">{listing.name}</p>
        <p className="text-[13px] leading-relaxed text-ink-muted">{listing.location}</p>
        <div className="flex items-center gap-2.5">
          <BedDouble size={16} className="text-ink" />
          <p className="text-xs text-ink">{listing.beds} beds</p>
          <Bath size={16} className="text-ink" />
          <p className="text-xs text-ink">{listing.baths} baths</p>
          <p className="text-xs text-ink-muted">{listing.area}</p>
        </div>
        <div className="h-px w-full bg-border" />
        <div className="flex items-center justify-between">
          <p className={`text-xs font-semibold ${listing.viewingFee.kind === 'free' ? 'text-brand' : 'text-fee'}`}>
            {listing.viewingFee.label}
          </p>
          <p className="text-[11px] text-ink-muted">{listing.availability}</p>
        </div>
        <a
          href="#browse"
          className="mt-1 flex h-10 items-center justify-center rounded-lg bg-brand text-xs font-semibold text-white hover:bg-[#123a2d]"
        >
          View property
        </a>
      </div>
    </article>
  )
}

export default function FeaturedListings() {
  return (
    <section id="rentals" className="flex w-full flex-col gap-7 p-5 md:p-14">
      <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
        <div className="flex max-w-[850px] flex-col gap-3">
          <p className="text-[11px] font-semibold text-brand">A FEW PLACES TO BEGIN</p>
          <h2 className="text-[26px] font-semibold leading-[1.15] text-ink md:text-[34px]">
            A glimpse of your next home.
          </h2>
          <p className="text-[15px] leading-relaxed text-ink-muted">
            Explore these demo rentals. Monthly rent is shown clearly, and every viewing is free.
          </p>
        </div>
        <a href="#browse" className="shrink-0 text-sm font-semibold text-brand">
          Browse all homes →
        </a>
      </div>

      <div className="flex flex-col gap-6 md:flex-row">
        {featuredListings.map((listing) => (
          <ListingCard key={listing.id} listing={listing} />
        ))}
      </div>
    </section>
  )
}
