// Reads a listers reservations and changes their status.
import { pool } from '../db/pool.js'

export async function getReservationsForLister(ownerId) {
  const result = await pool.query(
    `SELECT r.id, r.listing_id, r.guest_name, r.guest_email,
            r.move_in_date, r.note, r.status, r.created_at,
            l.title, l.viewing_fee, l.property_address,
            loc.name AS location_name, loc.latitude, loc.longitude,
            l.latitude AS property_latitude, l.longitude AS property_longitude
     FROM reservations r
     JOIN listings l ON l.id = r.listing_id
     JOIN locations loc ON loc.id = l.location_id
     WHERE l.owner_id = $1
     ORDER BY r.created_at DESC`,
    [ownerId],
  )
  return result.rows
}

export async function updateReservationStatus(ownerId, reservationId, status) {
  const result = await pool.query(
    `WITH target AS (
       SELECT r.id
       FROM reservations r
       JOIN listings l ON l.id = r.listing_id
       WHERE r.id = $1 AND l.owner_id = $2
       FOR UPDATE OF r
     ), updated AS (
       UPDATE reservations r
       SET status = $3
       FROM target t
       WHERE r.id = t.id AND r.status IS DISTINCT FROM $3
       RETURNING r.id
     )
     SELECT u.id FROM updated u`,
    [reservationId, ownerId, status],
  )
  const reservation = (await getReservationsForLister(ownerId)).find((item) => item.id === reservationId) ?? null
  if (!reservation) return null
  return { reservation, changed: Boolean(result.rows[0]) }
}
