// Maps the apps hash routes to the matching page.
import { useEffect, useState } from 'react'
import LandingPage from './pages/LandingPage.jsx'
import AuthPage from './pages/AuthPage.jsx'
import BrowsePage from './pages/BrowsePage.jsx'
import ListerDashboard from './pages/ListerDashboard.jsx'
import TenantDashboard from './pages/TenantDashboard.jsx'
import AdminDashboard from './pages/AdminDashboard.jsx'
import VerifyEmailPage from './pages/VerifyEmailPage.jsx'
import SupportPage from './pages/SupportPage.jsx'

export default function App() {
  const [hash, setHash] = useState(window.location.hash)

  useEffect(() => {
    const handleHashChange = () => setHash(window.location.hash)
    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  if (hash === '#list-a-property' || hash === '#sign-in' || hash === '#sign-up' || hash === '#tenant-sign-up') {
    return (
      <AuthPage
        initialMode={hash === '#sign-up' || hash === '#tenant-sign-up' ? 'signup' : 'login'}
        initialRole={hash === '#tenant-sign-up' ? 'tenant' : 'lister'}
      />
    )
  }
  if (hash === '#browse' || hash.startsWith('#browse?')) {
    const query = hash.includes('?') ? hash.slice(hash.indexOf('?') + 1) : ''
    const listingId = new URLSearchParams(query).get('listing') || ''
    return <BrowsePage initialListingId={listingId} />
  }
  if (hash === '#support') return <SupportPage />
  if (hash === '#verify-email' || hash.startsWith('#verify-email?')) {
    const query = hash.includes('?') ? hash.slice(hash.indexOf('?') + 1) : ''
    const token = new URLSearchParams(query).get('token') || ''
    return <VerifyEmailPage token={token} />
  }
  if (hash === '#dashboard') return <ListerDashboard />
  if (hash === '#account') return <TenantDashboard />
  if (hash === '#admin') return <AdminDashboard />

  return <LandingPage />
}
