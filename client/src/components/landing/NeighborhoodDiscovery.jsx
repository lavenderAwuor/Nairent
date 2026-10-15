import { ArrowUpRight, Route } from 'lucide-react'
import { neighborhoods } from '../../data/landingContent.js'

export default function NeighborhoodDiscovery() {
  return (
    <section id="neighborhoods" className="flex w-full flex-col gap-7 bg-surface p-5 md:p-14">
      <div className="flex flex-col gap-3">
        <p className="text-[11px] font-semibold text-brand">GET TO KNOW YOUR OPTIONS</p>
        <h2 className="text-[26px] font-semibold leading-[1.15] text-ink md:text-[34px]">
          One city. Many ways to feel at home.
        </h2>
        <p className="max-w-[640px] text-[15px] leading-relaxed text-ink-muted">
          Start with a neighborhood, then compare the homes and rents that suit your search.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-5 md:grid-cols-4">
        {neighborhoods.map((neighborhood) => (
          <a key={neighborhood.id} href="#rentals" className="flex flex-col gap-3">
            <div className="h-[140px] w-full overflow-hidden rounded-xl md:h-[176px]">
              <img src={neighborhood.photo} alt={neighborhood.name} className="size-full object-cover" />
            </div>
            <div className="flex items-start justify-between">
              <p className="text-base font-semibold text-ink md:text-[19px]">{neighborhood.name}</p>
              <ArrowUpRight size={18} className="shrink-0 text-ink" />
            </div>
            <p className="text-xs leading-relaxed text-ink-muted">{neighborhood.description}</p>
          </a>
        ))}
      </div>

      <div className="flex items-center gap-3 rounded-lg bg-brand-tint p-4">
        <Route size={18} className="shrink-0 text-brand" />
        <p className="flex-1 text-[13px] leading-relaxed text-brand">
          No exact match? Compare suggested neighborhoods while keeping your budget and bedroom preferences.
          Alternative locations are clearly labeled, not presented as exact matches.
        </p>
      </div>
    </section>
  )
}
