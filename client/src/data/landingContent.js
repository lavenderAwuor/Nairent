import cedarCourtLivingRoom from '../assets/landing/cedar-court-living-room.png'
import propertyPhotograph1 from '../assets/landing/property-photograph-1.png'
import propertyPhotograph2 from '../assets/landing/property-photograph-2.png'
import neighborhoodRental1 from '../assets/landing/neighborhood-rental-1.png'
import neighborhoodRental2 from '../assets/landing/neighborhood-rental-2.png'

export const featuredListings = [
  {
    id: 'cedar-court',
    photo: cedarCourtLivingRoom,
    badge: 'Demo listing · Apartment',
    price: 'KSh 65,000',
    name: 'Cedar Court Apartment',
    location: 'Kilimani · Wood Avenue',
    beds: 2,
    baths: 2,
    area: '94 m²',
    viewingFee: { label: 'Free viewing', kind: 'free' },
    availability: 'Available now',
  },
  {
    id: 'acacia-heights',
    photo: propertyPhotograph1,
    badge: 'Demo listing · Apartment',
    price: 'KSh 58,000',
    name: 'Acacia Heights',
    location: 'Kilimani · Kindaruma Road',
    beds: 2,
    baths: 2,
    area: '86 m²',
    viewingFee: { label: 'Free viewing', kind: 'free' },
    availability: 'Available now',
  },
  {
    id: 'south-b-park',
    photo: propertyPhotograph2,
    badge: 'Demo listing · Apartment',
    price: 'KSh 38,000',
    name: 'South B Park Apartment',
    location: 'South B · Plainsview Road',
    beds: 2,
    baths: 2,
    area: '72 m²',
    viewingFee: { label: 'Free viewing', kind: 'free' },
    availability: 'Available now',
  },
]

export const neighborhoods = [
  {
    id: 'kilimani',
    photo: propertyPhotograph1,
    name: 'Kilimani',
    description: 'Apartment living · Everyday amenities',
  },
  {
    id: 'south-b',
    photo: propertyPhotograph2,
    name: 'South B',
    description: 'Established residential streets',
  },
  {
    id: 'langata',
    photo: neighborhoodRental1,
    name: 'Lang’ata',
    description: 'Leafy pockets · Residential options',
  },
  {
    id: 'donholm',
    photo: neighborhoodRental2,
    name: 'Donholm',
    description: 'Explore homes east of the city',
  },
]

export const tenantJourney = [
  {
    step: '01',
    title: 'Set your priorities',
    description: 'Choose your location, monthly budget, bedrooms and availability.',
  },
  {
    step: '02',
    title: 'Compare the details',
    description: 'See rent clearly and explore alternative areas when needed.',
  },
  {
    step: '03',
    title: 'Start a conversation',
    description: 'Contact the landlord or agent to confirm terms and arrange a visit.',
  },
]

export const listerJourney = [
  {
    step: '01',
    title: 'Create your lister account',
    description: 'Join as a landlord or property agent, then open your dashboard.',
  },
  {
    step: '02',
    title: 'Prepare your listing',
    description: 'Add clear photos, rental details and availability.',
  },
  {
    step: '03',
    title: 'Manage it in one place',
    description: 'Submit for administrator review, keep details current and reply to inquiries.',
  },
]

export const faqItems = [
  {
    question: 'Are viewings free?',
    answer:
      'Yes. Viewings arranged through Nairent are free. The platform does not charge a booking or viewing fee.',
  },
  {
    question: 'What if there are no homes that match my search?',
    answer:
      'Nairent suggests alternative neighborhoods with homes that fit your budget and bedroom preferences. You can also save your original search for new-listing alerts.',
  },
  {
    question: 'Who can list a property?',
    answer:
      'Landlords and property agents can create a lister account. Add photos, rental terms and availability, then submit the listing for administrator review.',
  },
  {
    question: 'What should I check before paying?',
    answer:
      'Confirm current availability, the lister’s identity, rent, deposit and any additional charges directly. Visit the property before sending a deposit.',
  },
]
