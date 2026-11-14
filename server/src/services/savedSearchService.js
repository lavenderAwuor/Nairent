// Stores renter search filters and alert preferences.
import { pool } from '../db/pool.js'

export async function listSavedSearches(tenantId) {
  const result = await pool.query(
    `SELECT s.id, s.location_id, loc.name AS location_name, s.min_rent,
            s.max_rent, s.bedrooms, s.availability_status, s.notify_new_listings, s.created_at
     FROM saved_searches s
     LEFT JOIN locations loc ON loc.id = s.location_id
     WHERE s.tenant_id = $1
     ORDER BY s.created_at DESC`,
    [tenantId],
  )
  return result.rows
}

export async function createSavedSearch(tenantId, { location, minRent, maxRent, bedrooms, availability, notifyNewListings }) {
  const result = await pool.query(
    `INSERT INTO saved_searches (tenant_id, location_id, min_rent, max_rent, bedrooms, availability_status, notify_new_listings)
     SELECT
       $1,
       CASE WHEN $2::text IS NULL THEN NULL
            ELSE (SELECT id FROM locations WHERE LOWER(name) = LOWER($2)) END,
       $3, $4, $5, $6, $7
     WHERE $2::text IS NULL
        OR EXISTS (SELECT 1 FROM locations WHERE LOWER(name) = LOWER($2))
     RETURNING id`,
    [tenantId, location || null, minRent ?? null, maxRent ?? null, bedrooms ?? null, availability || null, notifyNewListings ?? false],
  )
  if (!result.rows[0]) return null
  return (await listSavedSearches(tenantId)).find((search) => search.id === result.rows[0].id) ?? null
}

export async function updateSavedSearchNotifications(tenantId, searchId, notifyNewListings) {
  const result = await pool.query(
    'UPDATE saved_searches SET notify_new_listings = $3 WHERE id = $1 AND tenant_id = $2 RETURNING id, notify_new_listings',
    [searchId, tenantId, notifyNewListings],
  )
  return result.rows[0] ?? null
}

export async function deleteSavedSearch(tenantId, searchId) {
  const result = await pool.query(
    'DELETE FROM saved_searches WHERE id = $1 AND tenant_id = $2 RETURNING id',
    [searchId, tenantId],
  )
  return Boolean(result.rows[0])
}
