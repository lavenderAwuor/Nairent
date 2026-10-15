import { ArrowRight, Info } from 'lucide-react'
import imaniParkResidences from '../../assets/landing/imani-park-residences.png'

export default function ListerInvitation() {
  return (
    <section className="flex w-full flex-col items-center gap-10 bg-brand p-5 md:flex-row md:gap-16 md:p-14">
      <div className="relative w-full shrink-0 overflow-hidden rounded-xl md:w-[500px]">
        <img
          src={imaniParkResidences}
          alt="Imani Park residences"
          className="h-[220px] w-full object-cover md:h-[330px]"
        />
        <span className="absolute bottom-[18px] left-[18px] rounded bg-white px-3 py-2 text-[11px] text-brand">
          Nairobi rentals · Illustrative property
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-5">
        <p className="text-[11px] font-semibold text-brand-muted">FOR LANDLORDS &amp; PROPERTY AGENTS</p>
        <h2 className="text-[28px] font-semibold leading-[1.15] text-white md:text-[38px]">
          A place for your properties.
          <br />
          A workspace for you.
        </h2>
        <p className="max-w-[560px] text-base leading-relaxed text-brand-muted">
          Create listings with clear photos and complete rental details. Keep availability
          up to date, and manage tenant inquiries from your lister dashboard.
        </p>
        <div className="flex flex-wrap items-center gap-6">
          <a
            href="#list-a-property"
            className="flex h-12 items-center justify-center gap-2.5 rounded-lg border border-border bg-surface px-[22px] text-sm font-semibold text-brand hover:bg-brand-tint"
          >
            List a property
            <ArrowRight size={18} />
          </a>
          <a href="#sign-in" className="text-sm font-semibold text-white">
            Already a lister? Sign in →
          </a>
        </div>
        <div className="flex items-center gap-2">
          <Info size={16} className="shrink-0 text-brand-muted" />
          <p className="flex-1 text-xs leading-relaxed text-brand-muted">
            Create an account → Open your dashboard → Submit a listing for review.
          </p>
        </div>
      </div>
    </section>
  )
}
