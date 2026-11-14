// Displays the public navigation and signed-in account links.
import { useEffect, useState } from 'react'
import { LogOut, Menu, User, X } from 'lucide-react'
import brandMark from '../../assets/landing/brand-mark.svg'
import { clearToken, getCurrentUser, getToken } from '../../lib/api.js'

const baseExploreLinks = [
  { label: 'Find a home', href: '#browse' },
  { label: 'Neighborhoods', href: '#neighborhoods' },
  { label: 'How it works', href: '#how-it-works' },
]

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [user, setUser] = useState(null)

  useEffect(() => {
    if (getToken()) {
      getCurrentUser()
        .then((result) => setUser(result.user))
        .catch(() => clearToken())
    }
  }, [])

  function signOut() {
    clearToken()
    setUser(null)
    window.location.hash = '#top'
  }

  const role = user?.role

  return (
    <header className="sticky top-0 z-30 w-full border-b border-border bg-surface">
      <div className="flex h-[72px] md:h-[88px] items-center justify-between px-5 md:px-14">
        <a href="#top" className="flex shrink-0 items-center gap-2.5">
          <img src={brandMark} alt="" className="size-[34px]" />
          <p className="text-[27px] font-bold text-brand">
            nairent<span className="text-brand-muted">.</span>
          </p>
        </a>

        <nav className="hidden items-center gap-8 text-sm text-ink-muted lg:flex">
          {baseExploreLinks.map((link) => (
            <a key={link.label} href={link.href} className="hover:text-ink">
              {link.label}
            </a>
          ))}
          {role === 'tenant' && (
            <a href="#account" className="font-semibold text-brand hover:underline">
              My Rental Journey
            </a>
          )}
          {role === 'lister' && (
            <a href="#dashboard" className="font-semibold text-brand hover:underline">
              Lister Workspace
            </a>
          )}
          {role === 'admin' && (
            <a href="#admin" className="font-semibold text-brand hover:underline">
              Admin Dashboard
            </a>
          )}
        </nav>

        <div className="hidden items-center gap-4 lg:flex">
          {user ? (
            <div className="flex items-center gap-4">
              <a
                href={role === 'tenant' ? '#account' : role === 'admin' ? '#admin' : '#dashboard'}
                className="flex items-center gap-2 text-sm font-semibold text-ink hover:text-brand"
              >
                <User size={16} className="text-brand" />
                <span>{user.full_name}</span>
              </a>
              <button
                type="button"
                onClick={signOut}
                className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-semibold text-ink-muted hover:bg-page hover:text-ink"
              >
                <LogOut size={14} />
                Sign out
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <a href="#sign-in" className="text-sm font-semibold text-ink hover:text-brand">
                Sign in
              </a>
              <a
                href="#list-a-property"
                className="flex h-12 items-center justify-center rounded-lg border border-brand bg-brand px-[22px] text-sm font-semibold text-white hover:bg-[#123a2d]"
              >
                List a property
              </a>
            </div>
          )}
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
          {baseExploreLinks.map((link) => (
            <a key={link.label} href={link.href} className="text-sm text-ink-muted" onClick={() => setMenuOpen(false)}>
              {link.label}
            </a>
          ))}
          {user ? (
            <div className="flex flex-col gap-3 pt-2">
              <a
                href={role === 'tenant' ? '#account' : role === 'admin' ? '#admin' : '#dashboard'}
                className="text-sm font-semibold text-brand"
                onClick={() => setMenuOpen(false)}
              >
                {role === 'tenant' ? 'My Account' : role === 'admin' ? 'Admin Dashboard' : 'Lister Dashboard'} ({user.full_name})
              </a>
              <button
                type="button"
                onClick={() => { setMenuOpen(false); signOut() }}
                className="flex items-center gap-2 text-sm text-ink-muted"
              >
                <LogOut size={16} /> Sign out
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-3 pt-2">
              <a href="#sign-in" className="text-sm font-semibold text-brand" onClick={() => setMenuOpen(false)}>
                Sign in
              </a>
              <a
                href="#list-a-property"
                className="flex h-12 items-center justify-center rounded-lg border border-brand bg-brand px-[22px] text-sm font-semibold text-white"
                onClick={() => setMenuOpen(false)}
              >
                List a property
              </a>
            </div>
          )}
        </div>
      )}
    </header>
  )
}
