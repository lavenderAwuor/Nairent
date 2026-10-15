import { useState } from 'react'
import { BellPlus, ChevronDown, MapPin, MapPinned, Search, Ticket } from 'lucide-react'
import cedarCourtLivingRoom from '../../assets/landing/cedar-court-living-room.png'

const neighborhoods = ['Any location', 'Kilimani', 'South B', 'Langata', 'Donholm', 'Kileleshwa', 'Roysambu', 'Kahawa West', 'Ruaka']
const budgets = ['Any budget', 'Up to KSh 10,000', 'Up to KSh 15,000', 'Up to KSh 25,000', 'Up to KSh 40,000', 'Up to KSh 65,000', 'Up to KSh 100,000']
const bedroomOptions = ['Any bedrooms', 'Studio', '1 bedroom', '2 bedrooms', '3+ bedrooms']
const availabilityOptions = ['Available now', 'Available this month', 'Any time']

const benefits = [
  {
    icon: Ticket,
    title: 'Free viewings, upfront',
    description: 'Request a viewing without extra charges.',
  },
  {
    icon: MapPinned,
    title: 'More neighborhood possibilities',
    description: 'Explore alternatives when no exact match exists.',
  },
  {
    icon: BellPlus,
    title: 'A search that stays with you',
    description: 'Save your preferences for new-listing alerts.',
  },
]

function SearchField({ label, icon: Icon, options, value, onChange }) {
  return (
    <label className="flex w-full flex-col gap-2 sm:w-auto sm:flex-1">
      <span className="text-xs font-semibold text-ink-muted">{label}</span>
      <div className="relative">
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-12 w-full appearance-none rounded-lg border border-border bg-transparent px-3 pr-9 text-[13px] text-ink"
        >
          {options.map((option) => (
            <option key={option}>{option}</option>
          ))}
        </select>
        <Icon size={15} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted" />
      </div>
    </label>
  )
}

export default function Hero() {
  const [submitted, setSubmitted] = useState(false)
  const [filters, setFilters] = useState({
    location: '',
    maxRent: '',
    bedrooms: '',
    availability: '',
  })

  function updateFilter(name, value) {
    setFilters((current) => ({ ...current, [name]: value }))
  }

  function submitSearch(event) {
    event.preventDefault()
    setSubmitted(true)
    window.sessionStorage.setItem('nairent_search_filters', JSON.stringify(filters))
    window.location.hash = '#browse'
  }

  return (
    <section id="top" className="flex w-full flex-col gap-7 px-5 pb-8 pt-10 md:px-14 md:pt-12">
      <div className="flex flex-col items-center gap-10 md:flex-row md:gap-12">
        <div className="flex flex-1 flex-col items-start gap-6">
          <p className="text-[11px] font-semibold tracking-wide text-brand">NAIROBI. YOUR NEXT CHAPTER.</p>
          <h1 className="text-[36px] font-semibold leading-[1.15] text-ink md:text-[56px]">
            Find a home.
            <br />
            Know where
            <br />
            you stand.
          </h1>
          <p className="max-w-[480px] text-base leading-relaxed text-ink-muted md:text-lg">
            The right neighborhood, the right rent, and free viewings. A clearer rental
            search, made for Nairobi.
          </p>
          <div className="flex items-center gap-2.5">
            <MapPin size={18} className="shrink-0 text-brand" />
            <p className="text-[13px] text-brand">From Kilimani to South B. Make yourself at home.</p>
          </div>
        </div>

        <div className="relative w-full max-w-[660px] shrink-0 overflow-hidden rounded-xl">
          <img
            src={cedarCourtLivingRoom}
            alt="Living room at Cedar Court Apartment in Kilimani"
            className="h-[260px] w-full object-cover md:h-[432px]"
          />
          <div className="absolute bottom-3 left-3 right-3 flex flex-wrap gap-6 rounded-lg bg-white p-3.5 sm:right-auto sm:flex-nowrap">
            <div className="flex flex-col gap-1">
              <p className="text-sm font-semibold text-ink">Cedar Court Apartment</p>
              <p className="text-[11px] text-ink-muted">Kilimani · Demo listing</p>
            </div>
            <div className="flex flex-col gap-1">
              <p className="text-sm font-semibold text-ink">KSh 65,000 / month</p>
              <p className="text-[11px] text-brand">Free viewing</p>
            </div>
          </div>
        </div>
      </div>

      <form
        onSubmit={submitSearch}
        className="flex w-full flex-col gap-4 rounded-xl border border-border bg-surface p-5"
      >
        <div className="flex w-full flex-col items-stretch gap-5 sm:flex-row sm:flex-wrap sm:items-end">
          <label className="flex w-full flex-col gap-2 sm:w-auto sm:flex-1">
            <span className="text-xs font-semibold text-ink-muted">Location</span>
            <div className="relative">
              <select value={filters.locationLabel || neighborhoods[0]} onChange={(event) => {
                const value = event.target.value
                updateFilter('location', value === 'Any location' ? '' : value)
                updateFilter('locationLabel', value)
              }} className="h-12 w-full appearance-none rounded-lg border border-border bg-transparent px-3 pr-9 text-[13px] text-ink">
                {neighborhoods.map((option) => <option key={option}>{option}</option>)}
              </select>
              <MapPin size={15} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted" />
            </div>
          </label>
          <label className="flex w-full flex-col gap-2 sm:w-auto sm:flex-1">
            <span className="text-xs font-semibold text-ink-muted">Monthly budget (KSh)</span>
            <div className="relative">
              <select value={filters.maxRentLabel || budgets[0]} onChange={(event) => {
                const value = event.target.value
                const maxRent = value.match(/10,000/) ? '10000' : value.match(/15,000/) ? '15000' : value.match(/25,000/) ? '25000' : value.match(/40,000/) ? '40000' : value.match(/65,000/) ? '65000' : value.match(/100,000/) ? '100000' : ''
                updateFilter('maxRent', maxRent)
                updateFilter('maxRentLabel', value)
              }} className="h-12 w-full appearance-none rounded-lg border border-border bg-transparent px-3 pr-9 text-[13px] text-ink">
                {budgets.map((option) => <option key={option}>{option}</option>)}
              </select>
              <ChevronDown size={15} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted" />
            </div>
          </label>
          <SearchField
            label="Bedrooms"
            icon={ChevronDown}
            options={bedroomOptions}
            value={filters.bedroomsLabel || bedroomOptions[0]}
            onChange={(value) => {
              updateFilter('bedrooms', value === 'Any bedrooms' ? '' : value.startsWith('Studio') ? '0' : value.split(' ')[0])
              updateFilter('bedroomsLabel', value)
            }}
          />
          <SearchField
            label="Availability"
            icon={ChevronDown}
            options={availabilityOptions}
            value={filters.availabilityLabel || availabilityOptions[0]}
            onChange={(value) => {
              updateFilter('availability', value === 'Available now' ? 'available' : value === 'Available this month' ? 'available_this_month' : '')
              updateFilter('availabilityLabel', value)
            }}
          />
          <button
            type="submit"
            className="flex h-12 items-center justify-center gap-2.5 rounded-lg border border-brand bg-brand px-[22px] text-sm font-semibold text-white hover:bg-[#123a2d]"
          >
            Find a home
            <Search size={18} />
          </button>
        </div>
        <p className="text-[11px] text-ink-muted" role="status">
          {submitted
            ? 'Opening homes that match your search…'
            : 'Search apartments, homes and bedsitters from KSh 10,000. Refine your results by location, budget and bedrooms.'}
        </p>
      </form>

      <div className="flex flex-col gap-6 pb-2 pt-1.5 sm:flex-row sm:gap-10">
        {benefits.map(({ icon: Icon, title, description }) => (
          <div key={title} className="flex flex-1 items-center gap-3">
            <Icon size={24} className="shrink-0 text-brand" />
            <div className="flex flex-col gap-1">
              <p className="text-sm font-semibold text-ink">{title}</p>
              <p className="text-xs text-ink-muted">{description}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
