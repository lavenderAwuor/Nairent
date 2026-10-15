import { useState } from 'react'
import { Menu, X } from 'lucide-react'
import brandMark from '../../assets/landing/brand-mark.svg'

const exploreLinks = [
  { label: 'Find a home', href: '#browse' },
  { label: 'Neighborhoods', href: '#neighborhoods' },
  { label: 'How it works', href: '#how-it-works' },
]

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-30 w-full border-b border-border bg-surface">
      <div className="flex h-[72px] md:h-[88px] items-center justify-between px-5 md:px-14">
        <a href="#top" className="flex shrink-0 items-center gap-2.5">
          <img src={brandMark} alt="" className="size-[34px]" />
          <p className="text-[27px] font-bold text-brand">
            nairent<span className="text-brand-muted">.</span>
          </p>
        </a>

        <nav className="hidden items-start gap-8 text-sm text-ink-muted lg:flex">
          {exploreLinks.map((link) => (
            <a key={link.label} href={link.href} className="hover:text-ink">
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-6 lg:flex">
          <a
            href="#list-a-property"
            className="flex h-12 items-center justify-center rounded-lg border border-brand bg-brand px-[22px] text-sm font-semibold text-white hover:bg-[#123a2d]"
          >
            List a property
          </a>
        </div>

        <button
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          className="flex size-10 items-center justify-center rounded-lg border border-border text-ink lg:hidden"
          aria-expanded={menuOpen}
          aria-label="Toggle navigation menu"
        >
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {menuOpen && (
        <div className="flex flex-col gap-4 border-t border-border px-5 py-5 lg:hidden">
          {exploreLinks.map((link) => (
            <a key={link.label} href={link.href} className="text-sm text-ink-muted">
              {link.label}
            </a>
          ))}
          <a
            href="#list-a-property"
            className="flex h-12 items-center justify-center rounded-lg border border-brand bg-brand px-[22px] text-sm font-semibold text-white"
          >
            List a property
          </a>
        </div>
      )}
    </header>
  )
}
