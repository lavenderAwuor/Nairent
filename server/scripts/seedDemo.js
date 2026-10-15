import 'dotenv/config'
import bcrypt from 'bcryptjs'
import pg from 'pg'

const { Pool } = pg
const pool = new Pool({ connectionString: process.env.DATABASE_URL, connectionTimeoutMillis: 8_000 })
const demoEmail = 'demo.lister@nairent.local'
const demoPassword = 'DemoLister123!'

const locations = [
  { name: 'Kilimani', latitude: -1.2921, longitude: 36.7875 },
  { name: 'South B', latitude: -1.3167, longitude: 36.8294 },
  { name: 'Kileleshwa', latitude: -1.2842, longitude: 36.7757 },
  { name: 'Langata', latitude: -1.3633, longitude: 36.7541 },
  { name: 'Lavington', latitude: -1.2806, longitude: 36.7661 },
  { name: 'Westlands', latitude: -1.2676, longitude: 36.8108 },
  { name: 'Parklands', latitude: -1.2572, longitude: 36.8172 },
  { name: 'Kasarani', latitude: -1.2219, longitude: 36.8976 },
  { name: 'Embakasi', latitude: -1.3181, longitude: 36.9086 },
  { name: 'Donholm', latitude: -1.3043, longitude: 36.8947 },
  { name: 'Runda', latitude: -1.2045, longitude: 36.8344 },
  { name: 'Karen', latitude: -1.3197, longitude: 36.7073 },
  { name: 'Roysambu', latitude: -1.2186, longitude: 36.8841 },
  { name: 'Kahawa West', latitude: -1.1965, longitude: 36.9218 },
  { name: 'Ruaka', latitude: -1.2026, longitude: 36.7825 },
  { name: 'Umoja', latitude: -1.2867, longitude: 36.8942 },
  { name: 'Kasarani Mwiki', latitude: -1.2298, longitude: 36.9098 },
  { name: 'Ngong Road', latitude: -1.3032, longitude: 36.7668 },
  { name: 'Madaraka', latitude: -1.3075, longitude: 36.8242 },
]

const listings = [
  { title: 'Cedar Court Apartment', location: 'Kilimani', description: 'Bright two-bedroom apartment close to shops and public transport.', rent: 65000, bedrooms: 2, viewingFee: 0 },
  { title: 'Imani Park Residences', location: 'South B', description: 'Modern one-bedroom home in a secure residential compound.', rent: 42000, bedrooms: 1 },
  { title: 'Greenview Court', location: 'Kileleshwa', description: 'Quiet three-bedroom apartment with generous living space.', rent: 85000, bedrooms: 3 },
  { title: 'Acacia Heights', location: 'Langata', description: 'Comfortable one-bedroom apartment near green spaces and daily amenities.', rent: 35000, bedrooms: 1 },
  { title: 'Lavington Garden Home', location: 'Lavington', description: 'Spacious two-bedroom apartment in a leafy, secure compound.', rent: 78000, bedrooms: 2 },
  { title: 'Westlands City View', location: 'Westlands', description: 'Well-connected two-bedroom apartment close to offices, shops and restaurants.', rent: 95000, bedrooms: 2 },
  { title: 'Parklands Starter Home', location: 'Parklands', description: 'Practical bedsitter with reliable access to hospitals and public transport.', rent: 22000, bedrooms: 0 },
  { title: 'Kasarani Family Court', location: 'Kasarani', description: 'Affordable three-bedroom home with parking and shared outdoor space.', rent: 48000, bedrooms: 3 },
  { title: 'Embakasi View Apartments', location: 'Embakasi', description: 'Bright two-bedroom apartment with convenient airport-side access.', rent: 30000, bedrooms: 2 },
  { title: 'Donholm Palm Court', location: 'Donholm', description: 'Neat one-bedroom apartment near shopping and public transport routes.', rent: 28000, bedrooms: 1 },
  { title: 'Runda Grove Residence', location: 'Runda', description: 'Peaceful three-bedroom residence in a secure, established neighborhood.', rent: 130000, bedrooms: 3 },
  { title: 'Karen Park Cottage', location: 'Karen', description: 'Quiet two-bedroom cottage with garden space and generous parking.', rent: 90000, bedrooms: 2 },
  { title: 'Roysambu Budget Bedsitter', location: 'Roysambu', description: 'Affordable bedsitter near shops, universities and public transport.', rent: 10000, bedrooms: 0 },
  { title: 'Kahawa West Starter Room', location: 'Kahawa West', description: 'Simple, well-connected room for a budget-conscious renter.', rent: 12000, bedrooms: 0 },
  { title: 'Ruaka Compact One Bedroom', location: 'Ruaka', description: 'Compact one-bedroom home close to local amenities and transport.', rent: 18000, bedrooms: 1 },
  { title: 'Umoja Family Apartment', location: 'Umoja', description: 'Practical two-bedroom apartment with easy access to the eastern bypass.', rent: 24000, bedrooms: 2 },
  { title: 'Mwiki Green Court', location: 'Kasarani Mwiki', description: 'Affordable one-bedroom home in a growing residential neighborhood.', rent: 16000, bedrooms: 1 },
  { title: 'Ngong Road Garden Bedsitter', location: 'Ngong Road', description: 'Neat bedsitter with access to shops, offices and public transport.', rent: 20000, bedrooms: 0 },
  { title: 'Madaraka View Apartment', location: 'Madaraka', description: 'Bright one-bedroom apartment near schools, shops and town connections.', rent: 30000, bedrooms: 1 },
]

const propertyPhotos = [
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=85',
  'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1200&q=85',
  'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1200&q=85',
]

try {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const passwordHash = await bcrypt.hash(demoPassword, 12)
    const userResult = await client.query(
      `INSERT INTO users (full_name, email, password_hash, role)
       VALUES ('Nairent Demo Lister', $1, $2, 'lister')
       ON CONFLICT (email) DO UPDATE SET role = 'lister'
       RETURNING id`,
      [demoEmail, passwordHash],
    )
    const ownerId = userResult.rows[0].id

    for (const location of locations) {
      await client.query(
        `INSERT INTO locations (name, latitude, longitude)
         VALUES ($1, $2, $3)
         ON CONFLICT (name) DO UPDATE
         SET latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude`,
        [location.name, location.latitude, location.longitude],
      )
    }

    for (const listing of listings) {
      const locationResult = await client.query('SELECT id FROM locations WHERE name = $1', [listing.location])
      if (locationResult.rowCount === 0) throw new Error(`Location ${listing.location} was not created`)
      const existingListing = await client.query(
        'SELECT id FROM listings WHERE owner_id = $1 AND title = $2',
        [ownerId, listing.title],
      )
      if (existingListing.rowCount === 0) {
        const insertedListing = await client.query(
          `INSERT INTO listings
            (owner_id, location_id, title, description, monthly_rent, bedrooms, availability_status, moderation_status)
           VALUES ($1, $2, $3, $4, $5, $6, 'available', 'approved')
           RETURNING id`,
          [ownerId, locationResult.rows[0].id, listing.title, listing.description, listing.rent, listing.bedrooms],
        )
        for (const [sortOrder, imageUrl] of propertyPhotos.entries()) {
          await client.query(
            'INSERT INTO listing_photos (listing_id, image_url, sort_order) VALUES ($1, $2, $3)',
            [insertedListing.rows[0].id, imageUrl, sortOrder],
          )
        }
      } else {
        const photoCount = await client.query(
          'SELECT COUNT(*)::int AS count FROM listing_photos WHERE listing_id = $1',
          [existingListing.rows[0].id],
        )
        if (photoCount.rows[0].count === 0) {
          for (const [sortOrder, imageUrl] of propertyPhotos.entries()) {
            await client.query(
              'INSERT INTO listing_photos (listing_id, image_url, sort_order) VALUES ($1, $2, $3)',
              [existingListing.rows[0].id, imageUrl, sortOrder],
            )
          }
        }
      }
    }
    await client.query('COMMIT')
    console.log(`Seeded ${listings.length} approved demo listings`)
    console.log(`Demo lister login: ${demoEmail} / ${demoPassword}`)
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
} finally {
  await pool.end()
}
