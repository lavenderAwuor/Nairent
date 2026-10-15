import { tenantJourney, listerJourney } from '../../data/landingContent.js'

function JourneyStep({ step, title, description, markerClassName }) {
  return (
    <div className="flex w-full items-start gap-4">
      <div className={`flex size-7 shrink-0 items-center justify-center rounded-full ${markerClassName}`}>
        <p className="text-xs font-semibold text-brand">{step}</p>
      </div>
      <div className="flex flex-1 flex-col gap-1">
        <p className="text-[15px] font-semibold text-ink">{title}</p>
        <p className="text-[13px] leading-relaxed text-ink-muted">{description}</p>
      </div>
    </div>
  )
}

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="flex w-full flex-col gap-7 p-5 md:p-14">
      <div className="flex flex-col gap-3">
        <p className="text-[11px] font-semibold text-brand">A CLEARER PATH TO RENTING</p>
        <h2 className="text-[26px] font-semibold leading-[1.15] text-ink md:text-[34px]">
          From the first search to the next conversation.
        </h2>
      </div>

      <div className="flex flex-col gap-6 md:flex-row md:items-stretch">
        <div className="flex flex-1 flex-col gap-6 rounded-xl border border-border bg-surface p-7">
          <p className="text-xl font-semibold text-brand">Looking for a home?</p>
          {tenantJourney.map((item) => (
            <JourneyStep key={item.step} {...item} markerClassName="bg-brand-tint" />
          ))}
        </div>

        <div className="flex flex-1 flex-col gap-6 rounded-xl border border-brand-tint bg-brand-tint p-7">
          <p className="text-xl font-semibold text-brand">Have a property to let?</p>
          {listerJourney.map((item) => (
            <JourneyStep key={item.step} {...item} markerClassName="bg-white" />
          ))}
        </div>
      </div>
    </section>
  )
}
