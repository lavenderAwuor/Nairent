import { pool } from '../db/pool.js'

const listingColumns = `l.id, l.title, l.description, l.monthly_rent, l.bedrooms,
  l.availability_status, l.moderation_status, l.amenities, loc.name AS location_name`

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

export async function createListerListing({ ownerId, title, description, monthlyRent, bedrooms, location, amenities, photoUrls }) {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const result = await client.query(
      `INSERT INTO listings
        (owner_id, location_id, title, description, monthly_rent, bedrooms, availability_status, moderation_status, amenities)
       SELECT $1, id, $2, $3, $4, $5, 'available', 'approved', $7::jsonb
       FROM locations
       WHERE LOWER(name) = LOWER($6)
       RETURNING id`,
      [ownerId, title, description, monthlyRent, bedrooms, location, JSON.stringify(amenities)],
    )
    if (!result.rows[0]) {
      await client.query('ROLLBACK')
      return null
    }
    await insertPhotos(client, result.rows[0].id, photoUrls)
    const listing = await client.query(
      `SELECT ${listingColumns}, '[]'::json AS photos
       FROM listings l
       JOIN locations loc ON loc.id = l.location_id
       WHERE l.id = $1`,
      [result.rows[0].id],
    )
    const photos = await client.query(
      `SELECT id, image_url AS "imageUrl" FROM listing_photos WHERE listing_id = $1 ORDER BY sort_order`,
      [result.rows[0].id],
    )
    await client.query('COMMIT')
    return listing.rows[0] ? { ...listing.rows[0], photos: photos.rows } : null
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}

async function insertPhotos(client, listingId, photoUrls) {
  if (photoUrls.length === 0) return
  await client.query(
    `INSERT INTO listing_photos (listing_id, image_url, sort_order)
     SELECT $1, photo_url, row_number() OVER () - 1
     FROM unnest($2::text[]) AS photo_url`,
    [listingId, photoUrls],
  )
}

export async function updateListerListing({ ownerId, listingId, title, description, monthlyRent, bedrooms, location, amenities, photoUrls, availability }) {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const result = await client.query(
      `UPDATE listings l
       SET title = $3, description = $4, monthly_rent = $5, bedrooms = $6,
           location_id = (SELECT id FROM locations WHERE LOWER(name) = LOWER($7)),
           amenities = $8::jsonb, availability_status = $9, updated_at = NOW()
       WHERE l.id = $1 AND l.owner_id = $2
         AND EXISTS (SELECT 1 FROM locations WHERE LOWER(name) = LOWER($7))
       RETURNING l.id`,
      [listingId, ownerId, title, description, monthlyRent, bedrooms, location, JSON.stringify(amenities), availability],
    )
    if (!result.rows[0]) {
      await client.query('ROLLBACK')
      return null
    }
    await client.query('DELETE FROM listing_photos WHERE listing_id = $1', [listingId])
    await insertPhotos(client, listingId, photoUrls)
    await client.query('COMMIT')
    return (await getListingsForLister(ownerId)).find((listing) => listing.id === listingId) ?? null
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}

export async function updateListingAvailability(ownerId, listingId, availability) {
  const result = await pool.query(
    `UPDATE listings
     SET availability_status = $3, updated_at = NOW()
     WHERE id = $1 AND owner_id = $2
     RETURNING id`,
    [listingId, ownerId, availability],
  )
  if (!result.rows[0]) return null
  return (await getListingsForLister(ownerId)).find((listing) => listing.id === listingId) ?? null
}

export async function deleteListerListing(ownerId, listingId) {
  const result = await pool.query(
    'DELETE FROM listings WHERE id = $1 AND owner_id = $2 RETURNING id',
    [listingId, ownerId],
  )
  return Boolean(result.rows[0])
}
