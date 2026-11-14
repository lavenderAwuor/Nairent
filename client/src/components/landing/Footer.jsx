// Displays the landing page footer and navigation links.
import brandMark from '../../assets/landing/brand-mark.svg'

const footerGroups = [
  {
    title: 'Find a home',
    links: [
      { label: 'Browse rentals', href: '#browse' },
      { label: 'Explore neighborhoods', href: '#neighborhoods' },
      { label: 'Saved searches', href: '#account' },
    ],
  },
  {
    title: 'For listers',
    links: [
      { label: 'List a property', href: '#list-a-property' },
      { label: 'Lister workspace', href: '#dashboard' },
      { label: 'Admin moderation', href: '#admin' },
    ],
  },
  {
    title: 'Nairent',
    links: [
      { label: 'How it works', href: '#how-it-works' },
      { label: 'Viewing fees', href: '#rentals' },
      { label: 'Help & support', href: '#support' },
    ],
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
            A clearer way to find and list a rental home in Nairobi, with viewing fees shown upfront.
          </p>
        </div>

        <div className="grid flex-1 grid-cols-2 gap-8 sm:grid-cols-3">
          {footerGroups.map((group) => (
            <div key={group.title} className="flex flex-col gap-3 text-sm">
              <p className="font-semibold text-ink">{group.title}</p>
              {group.links.map((link) => (
                <a key={link.label} href={link.href} className="text-ink-muted hover:text-brand">
                  {link.label}
                </a>
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="h-px w-full bg-border" />

      <div className="flex flex-col gap-2 text-[11px] text-ink-muted sm:flex-row sm:items-start sm:justify-between">
        <p>© 2026 Nairent · Nairobi, Kenya · Viewing fees vary by property</p>
        <p>Confirm availability and rental terms before paying any security deposit.</p>
      </div>
    </footer>
  )
}
