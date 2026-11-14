// Creates and updates property viewing appointment records.
import { pool } from '../db/pool.js'

export async function createAppointment({ listingId, tenantId = null, guestName, guestEmail, preferredDate, preferredTime, note }) {
  const result = await pool.query(
    `INSERT INTO viewing_appointments
      (listing_id, tenant_id, guest_name, guest_email, preferred_date, preferred_time, note)
     SELECT $1, $2, $3, $4, $5
      , $6, $7
     WHERE EXISTS (
       SELECT 1 FROM listings
       WHERE id = $1 AND moderation_status = 'approved'
         AND availability_status IN ('available', 'available_this_month')
     )
     RETURNING id, listing_id, tenant_id, preferred_date, preferred_time, note, status, created_at`,
    [listingId, tenantId, guestName, guestEmail, preferredDate, preferredTime, note || null],
  )
  return result.rows[0] ?? null
}

export async function getAppointmentsForTenant(tenantId) {
  const result = await pool.query(
    `SELECT a.id, a.listing_id, a.preferred_date, a.preferred_time,
            a.note, a.status, a.created_at, l.title, l.viewing_fee,
            loc.name AS location_name
     FROM viewing_appointments a
     JOIN listings l ON l.id = a.listing_id
     JOIN locations loc ON loc.id = l.location_id
     WHERE a.tenant_id = $1
     ORDER BY a.preferred_date ASC, a.preferred_time ASC`,
    [tenantId],
  )
  return result.rows
}

export async function getAppointmentsForLister(ownerId) {
  const result = await pool.query(
    `SELECT a.id, a.listing_id, a.guest_name, a.guest_email,
            a.preferred_date, a.preferred_time, a.note, a.status, a.created_at,
            l.title, l.viewing_fee, loc.name AS location_name
     FROM viewing_appointments a
     JOIN listings l ON l.id = a.listing_id
     JOIN locations loc ON loc.id = l.location_id
     WHERE l.owner_id = $1
     ORDER BY a.preferred_date ASC, a.preferred_time ASC, a.created_at ASC`,
    [ownerId],
  )
  return result.rows
}

export async function updateAppointmentStatus(ownerId, appointmentId, status) {
  const result = await pool.query(
    `UPDATE viewing_appointments a
     SET status = $3, updated_at = NOW()
     FROM listings l
     WHERE a.id = $1 AND l.id = a.listing_id AND l.owner_id = $2
     RETURNING a.id, a.listing_id, a.guest_name, a.guest_email,
               a.preferred_date, a.preferred_time, a.note, a.status, a.created_at`,
    [appointmentId, ownerId, status],
  )
  if (!result.rows[0]) return null
  return (await getAppointmentsForLister(ownerId)).find((appointment) => appointment.id === appointmentId) ?? null
}
