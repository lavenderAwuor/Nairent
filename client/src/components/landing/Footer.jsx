import brandMark from '../../assets/landing/brand-mark.svg'

const footerGroups = [
  {
    title: 'Find a home',
    links: ['Browse rentals', 'Explore neighborhoods', 'Saved searches'],
  },
  {
    title: 'For listers',
    links: ['List a property', 'Lister sign in', 'Listing guidelines'],
  },
  {
    title: 'Nairent',
    links: ['Help & support', 'Terms of use', 'Privacy policy'],
  },
]

export default function Footer() {
  return (
    <footer className="flex w-full flex-col gap-8 border-t border-border bg-surface px-5 py-9 md:px-14">
      <div className="flex flex-col gap-10 md:flex-row md:gap-20">
        <div className="flex w-full flex-col gap-4 md:max-w-[440px]">
          <div className="flex items-center gap-2.5">
            <img src={brandMark} alt="" className="size-[34px]" />
            <p className="text-[27px] font-bold text-brand">
              nairent<span className="text-brand-muted">.</span>
            </p>
          </div>
          <p className="text-[15px] leading-relaxed text-ink-muted">
            A clearer way to find and list a rental home in Nairobi.
          </p>
        </div>

        <div className="grid flex-1 grid-cols-2 gap-8 sm:grid-cols-3">
          {footerGroups.map((group) => (
            <div key={group.title} className="flex flex-col gap-3 text-sm">
              <p className="font-semibold text-ink">{group.title}</p>
              {group.links.map((link) => (
                <a key={link} href="#top" className="text-ink-muted">
                  {link}
                </a>
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="h-px w-full bg-border" />

      <div className="flex flex-col gap-2 text-[11px] text-ink-muted sm:flex-row sm:items-start sm:justify-between">
        <p>© 2026 Nairent · Nairobi, Kenya</p>
        <p>Illustrative listings only. Confirm availability and rental terms before paying.</p>
      </div>
    </footer>
  )
}
