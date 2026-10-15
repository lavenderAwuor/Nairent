import { pool } from '../db/pool.js'

export async function listLocations() {
  const result = await pool.query(
    `SELECT id, name, latitude, longitude
     FROM locations
     ORDER BY name ASC`,
  )
  return result.rows
}
