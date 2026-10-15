import { ArrowRight, BellRing } from 'lucide-react'

export default function SaveSearchCta() {
  return (
    <section className="flex w-full px-5 pb-8 pt-3 md:px-14 md:pb-14">
      <div className="flex w-full flex-col items-start gap-8 rounded-xl bg-brand-tint p-6 md:flex-row md:items-center md:gap-16 md:p-9">
        <div className="flex flex-1 flex-col gap-4">
          <BellRing size={28} className="text-brand" />
          <h2 className="text-[26px] font-semibold leading-[1.15] text-ink md:text-[30px]">
            Not today’s home?
            <br />
            Keep tomorrow’s possibilities open.
          </h2>
          <p className="max-w-[460px] text-[15px] leading-relaxed text-ink-muted">
            Browse available homes and return whenever you are ready. No account is needed to search or request a viewing.
          </p>
        </div>

        <div className="flex w-full flex-col gap-4 rounded-xl border border-border bg-surface p-6 md:w-[390px] md:shrink-0">
          <p className="text-[10px] font-semibold text-ink-muted">EXAMPLE SAVED SEARCH</p>
          <p className="text-xl font-semibold text-ink">Kileleshwa, Nairobi</p>
          <div className="text-[13px] leading-relaxed text-ink-muted">
            <p>2 bedrooms · KSh 25,000–40,000</p>
            <p>Available now</p>
          </div>
          <a
            href="#browse"
            className="flex h-12 items-center justify-center gap-2.5 rounded-lg border border-border bg-surface px-[22px] text-sm font-semibold text-brand hover:bg-brand-tint"
          >
            Browse homes
            <ArrowRight size={18} />
          </a>
          <p className="text-[11px] text-ink-muted">Search by location, rent, bedrooms and availability.</p>
        </div>
      </div>
    </section>
  )
}
