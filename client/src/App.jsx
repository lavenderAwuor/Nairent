import { useEffect, useState } from 'react'
import LandingPage from './pages/LandingPage.jsx'
import AuthPage from './pages/AuthPage.jsx'
import BrowsePage from './pages/BrowsePage.jsx'
import ListerDashboard from './pages/ListerDashboard.jsx'

export default function App() {
  const [hash, setHash] = useState(window.location.hash)

  useEffect(() => {
    const handleHashChange = () => setHash(window.location.hash)
    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  if (hash === '#list-a-property' || hash === '#sign-in' || hash === '#sign-up') {
    return <AuthPage initialMode={hash === '#sign-up' || hash === '#list-a-property' ? 'signup' : 'login'} />
  }
  if (hash === '#browse') return <BrowsePage />
  if (hash === '#dashboard') return <ListerDashboard />

  return <LandingPage />
}
