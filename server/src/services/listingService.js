import { pool } from '../db/pool.js'

export async function searchListings({ location, minRent, maxRent, bedrooms, availability }) {
  const values = []
  const conditions = ["l.moderation_status = 'approved'"]

  if (location) {
    values.push(location)
    conditions.push(`LOWER(loc.name) = LOWER($${values.length})`)
  }
  if (minRent !== undefined) {
    values.push(minRent)
    conditions.push(`l.monthly_rent >= $${values.length}`)
  }
  if (maxRent !== undefined) {
    values.push(maxRent)
    conditions.push(`l.monthly_rent <= $${values.length}`)
  }
  if (bedrooms !== undefined) {
    values.push(bedrooms)
    conditions.push(`l.bedrooms >= $${values.length}`)
  }
  if (availability) {
    if (availability === 'available_this_month') {
      conditions.push(`l.availability_status IN ('available', 'available_this_month')`)
    } else {
      values.push(availability)
      conditions.push(`l.availability_status = $${values.length}`)
    }
  }

  const result = await pool.query(
    `SELECT l.id, l.title, l.description, l.monthly_rent, l.bedrooms, l.amenities,
            l.availability_status, loc.id AS location_id,
            loc.name AS location_name, loc.latitude, loc.longitude,
            u.full_name AS lister_name, u.email AS lister_email, u.phone AS lister_phone,
            COALESCE(
              json_agg(json_build_object('id', p.id, 'imageUrl', p.image_url)
                ORDER BY p.sort_order) FILTER (WHERE p.id IS NOT NULL),
              '[]'
            ) AS photos
     FROM listings l
     JOIN users u ON u.id = l.owner_id
     JOIN locations loc ON loc.id = l.location_id
     LEFT JOIN listing_photos p ON p.listing_id = l.id
     WHERE ${conditions.join(' AND ')}
     GROUP BY l.id, loc.id, u.id
     ORDER BY l.created_at DESC`,
    values,
  )
  return result.rows
}

export async function getListingById(listingId) {
  const result = await pool.query(
    `SELECT l.id, l.title, l.description, l.monthly_rent, l.bedrooms, l.amenities,
            l.availability_status, loc.id AS location_id,
            loc.name AS location_name, loc.latitude, loc.longitude,
            u.full_name AS lister_name, u.email AS lister_email, u.phone AS lister_phone,
            COALESCE(
              json_agg(json_build_object('id', p.id, 'imageUrl', p.image_url)
                ORDER BY p.sort_order) FILTER (WHERE p.id IS NOT NULL),
              '[]'
            ) AS photos
     FROM listings l
     JOIN users u ON u.id = l.owner_id
     JOIN locations loc ON loc.id = l.location_id
     LEFT JOIN listing_photos p ON p.listing_id = l.id
     WHERE l.id = $1 AND l.moderation_status = 'approved'
     GROUP BY l.id, loc.id, u.id`,
    [listingId],
  )
  return result.rows[0] ?? null
}
