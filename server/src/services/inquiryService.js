// Stores and retrieves tenant messages about listings.
import { pool } from '../db/pool.js'

export async function createInquiry({ listingId, tenantId = null, guestName, guestEmail, guestPhone, message }) {
  const result = await pool.query(
    `INSERT INTO inquiries (listing_id, tenant_id, guest_name, guest_email, guest_phone, message)
     SELECT $1, $2, $3, $4, $5, $6
     WHERE EXISTS (
       SELECT 1 FROM listings
       WHERE id = $1 AND moderation_status = 'approved'
     )
     RETURNING id, listing_id, tenant_id, guest_name, guest_email, guest_phone, message, created_at`,
    [listingId, tenantId, guestName || null, guestEmail || null, guestPhone || null, message],
  )
  return result.rows[0] ?? null
}

export async function getInquiriesForTenant(tenantId) {
  const result = await pool.query(
    `SELECT i.id, i.listing_id, i.message, i.created_at,
            l.title, loc.name AS location_name,
            u.full_name AS lister_name, u.email AS lister_email, u.phone AS lister_phone
     FROM inquiries i
     JOIN listings l ON l.id = i.listing_id
     JOIN locations loc ON loc.id = l.location_id
     JOIN users u ON u.id = l.owner_id
     WHERE i.tenant_id = $1
     ORDER BY i.created_at DESC`,
    [tenantId],
  )
  return result.rows
}

export async function getInquiriesForLister(ownerId) {
  const result = await pool.query(
    `SELECT i.id, i.listing_id, i.guest_name, i.guest_email, i.guest_phone,
            i.message, i.created_at,
            l.title, loc.name AS location_name,
            t.full_name AS tenant_name, t.email AS tenant_email, t.phone AS tenant_phone
     FROM inquiries i
     JOIN listings l ON l.id = i.listing_id
     JOIN locations loc ON loc.id = l.location_id
     LEFT JOIN users t ON t.id = i.tenant_id
     WHERE l.owner_id = $1
     ORDER BY i.created_at DESC`,
    [ownerId],
  )
  return result.rows
}
