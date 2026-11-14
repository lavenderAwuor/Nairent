// Stores user support requests and provides admin queue actions.
import { pool } from '../db/pool.js'

export async function createSupportRequest({ fullName, email, topic, message }) {
  const result = await pool.query(
    `INSERT INTO support_requests (full_name, email, topic, message)
     VALUES ($1, $2, $3, $4)
     RETURNING id, created_at`,
    [fullName, email, topic, message],
  )
  return result.rows[0]
}

export async function listSupportRequests() {
  const result = await pool.query(
    `SELECT id, full_name, email, topic, message, status, created_at, updated_at
     FROM support_requests
     ORDER BY CASE WHEN status = 'open' THEN 0 ELSE 1 END, created_at DESC
     LIMIT 200`,
  )
  return result.rows
}

export async function updateSupportRequestStatus(requestId, status) {
  const result = await pool.query(
    `UPDATE support_requests
     SET status = $2, updated_at = NOW()
     WHERE id = $1
     RETURNING id, status, updated_at`,
    [requestId, status],
  )
  return result.rows[0] ?? null
}
