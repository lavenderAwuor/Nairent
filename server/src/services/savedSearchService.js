// Stores renter search filters.
import { pool } from '../db/pool.js'

export async function listSavedSearches(tenantId) {
  const result = await pool.query(
    `SELECT s.id, s.location_id, loc.name AS location_name, s.min_rent,
            s.max_rent, s.bedrooms, s.availability_status, s.created_at
     FROM saved_searches s
     LEFT JOIN locations loc ON loc.id = s.location_id
     WHERE s.tenant_id = $1
     ORDER BY s.created_at DESC`,
    [tenantId],
  )
  return result.rows
}

export async function createSavedSearch(tenantId, { location, minRent, maxRent, bedrooms, availability }) {
  const result = await pool.query(
    `INSERT INTO saved_searches (tenant_id, location_id, min_rent, max_rent, bedrooms, availability_status)
     SELECT
       $1,
       CASE WHEN $2::text IS NULL THEN NULL
            ELSE (SELECT id FROM locations WHERE LOWER(name) = LOWER($2)) END,
       $3, $4, $5, $6
     WHERE $2::text IS NULL
        OR EXISTS (SELECT 1 FROM locations WHERE LOWER(name) = LOWER($2))
     RETURNING id`,
    [tenantId, location || null, minRent ?? null, maxRent ?? null, bedrooms ?? null, availability || null],
  )
  if (!result.rows[0]) return null
  return (await listSavedSearches(tenantId)).find((search) => search.id === result.rows[0].id) ?? null
}

export async function deleteSavedSearch(tenantId, searchId) {
  const result = await pool.query(
    'DELETE FROM saved_searches WHERE id = $1 AND tenant_id = $2 RETURNING id',
    [searchId, tenantId],
  )
  return Boolean(result.rows[0])
}
