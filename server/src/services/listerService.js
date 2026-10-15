import { pool } from '../db/pool.js'

const listingColumns = `l.id, l.title, l.description, l.monthly_rent, l.bedrooms,
  l.availability_status, l.moderation_status, loc.name AS location_name`

export async function getListingsForLister(ownerId) {
  const result = await pool.query(
    `SELECT ${listingColumns},
            COALESCE(
              json_agg(json_build_object('id', p.id, 'imageUrl', p.image_url)
                ORDER BY p.sort_order) FILTER (WHERE p.id IS NOT NULL),
              '[]'
            ) AS photos
     FROM listings l
     JOIN locations loc ON loc.id = l.location_id
     LEFT JOIN listing_photos p ON p.listing_id = l.id
     WHERE l.owner_id = $1
     GROUP BY l.id, loc.id
     ORDER BY l.created_at DESC`,
    [ownerId],
  )
  return result.rows
}

export async function createListerListing({ ownerId, title, description, monthlyRent, bedrooms, location }) {
  const result = await pool.query(
    `INSERT INTO listings
      (owner_id, location_id, title, description, monthly_rent, bedrooms, availability_status, moderation_status)
     SELECT $1, id, $2, $3, $4, $5, 'available', 'pending'
     FROM locations
     WHERE LOWER(name) = LOWER($6)
     RETURNING id`,
    [ownerId, title, description, monthlyRent, bedrooms, location],
  )
  if (!result.rows[0]) return null
  const listing = await pool.query(
    `SELECT ${listingColumns}, '[]'::json AS photos
     FROM listings l
     JOIN locations loc ON loc.id = l.location_id
     WHERE l.id = $1`,
    [result.rows[0].id],
  )
  return listing.rows[0] ?? null
}
