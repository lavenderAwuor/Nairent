import Navbar from '../components/landing/Navbar.jsx'
import Hero from '../components/landing/Hero.jsx'
import FeaturedListings from '../components/landing/FeaturedListings.jsx'
import NeighborhoodDiscovery from '../components/landing/NeighborhoodDiscovery.jsx'
import HowItWorks from '../components/landing/HowItWorks.jsx'
import SaveSearchCta from '../components/landing/SaveSearchCta.jsx'
import ListerInvitation from '../components/landing/ListerInvitation.jsx'
import Faq from '../components/landing/Faq.jsx'
import Footer from '../components/landing/Footer.jsx'

export default function LandingPage() {
  return (
    <div className="flex min-h-screen w-full flex-col items-start bg-page">
      <Navbar />
      <Hero />
      <FeaturedListings />
      <NeighborhoodDiscovery />
      <HowItWorks />
      <SaveSearchCta />
      <ListerInvitation />
      <Faq />
      <Footer />
    </div>
  )
}
