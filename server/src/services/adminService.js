// Reads and updates users, listings, and reports for the admin dashboard.
import { pool } from '../db/pool.js'

export async function listAllListingsForAdmin(status) {
  const values = []
  let whereClause = ''
  if (status) {
    values.push(status)
    whereClause = 'WHERE l.moderation_status = $1'
  }

  const result = await pool.query(
    `SELECT l.id, l.title, l.description, l.monthly_rent, l.viewing_fee, l.bedrooms, l.amenities, l.property_address,
            l.latitude AS property_latitude, l.longitude AS property_longitude,
            l.availability_status, l.moderation_status, l.created_at, l.updated_at,
            loc.name AS location_name,
            u.id AS owner_id, u.full_name AS lister_name, u.email AS lister_email, u.phone AS lister_phone,
            COALESCE(
              json_agg(json_build_object('id', p.id, 'imageUrl', p.image_url)
                ORDER BY p.sort_order) FILTER (WHERE p.id IS NOT NULL),
              '[]'
            ) AS photos
     FROM listings l
     JOIN users u ON u.id = l.owner_id
     JOIN locations loc ON loc.id = l.location_id
     LEFT JOIN listing_photos p ON p.listing_id = l.id
     ${whereClause}
     GROUP BY l.id, loc.id, u.id
     ORDER BY l.created_at DESC`,
    values,
  )
  return result.rows
}

export async function updateListingModerationStatus(listingId, moderationStatus) {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const result = await client.query(
      'UPDATE listings SET moderation_status = $2, updated_at = NOW() ' +
      'WHERE id = $1 RETURNING id, title, moderation_status, availability_status, updated_at',
      [listingId, moderationStatus],
    )
    if (!result.rows[0]) {
      await client.query('ROLLBACK')
      return null
    }
    await client.query('COMMIT')
    return result.rows[0]
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}

export async function deleteListingByAdmin(listingId) {
  const result = await pool.query(
    'DELETE FROM listings WHERE id = $1 RETURNING id',
    [listingId],
  )
  return Boolean(result.rows[0])
}

export async function listUsersForAdmin() {
  const result = await pool.query(
    `SELECT u.id, u.full_name, u.email, u.phone, u.role, u.created_at,
            COUNT(DISTINCT l.id)::int AS listing_count,
            COUNT(DISTINCT a.id)::int AS appointment_count
     FROM users u
     LEFT JOIN listings l ON l.owner_id = u.id
     LEFT JOIN viewing_appointments a ON a.tenant_id = u.id
     GROUP BY u.id
     ORDER BY u.created_at DESC`,
  )
  return result.rows
}

export async function updateUserRoleByAdmin(userId, role) {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    await client.query('SELECT pg_advisory_xact_lock(7812, 1)')
    const current = await client.query(
      'SELECT id, role FROM users WHERE id = $1 FOR UPDATE',
      [userId],
    )
    if (!current.rows[0]) {
      await client.query('ROLLBACK')
      return null
    }
    if (current.rows[0].role === 'admin' && role !== 'admin') {
      await preventRemovingLastAdmin(client)
    }
    const result = await client.query(
      `UPDATE users SET role = $2, updated_at = NOW()
       WHERE id = $1
       RETURNING id, full_name, email, role, updated_at`,
      [userId, role],
    )
    await client.query('COMMIT')
    return result.rows[0] ?? null
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}

export async function deleteUserByAdmin(userId, currentAdminId) {
  if (userId === currentAdminId) {
    const error = new Error('You cannot delete your own administrator account')
    error.statusCode = 400
    throw error
  }
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    await client.query('SELECT pg_advisory_xact_lock(7812, 1)')
    const current = await client.query(
      'SELECT id, role FROM users WHERE id = $1 FOR UPDATE',
      [userId],
    )
    if (!current.rows[0]) {
      await client.query('ROLLBACK')
      return false
    }
    if (current.rows[0].role === 'admin') {
      await preventRemovingLastAdmin(client)
    }
    const result = await client.query('DELETE FROM users WHERE id = $1 RETURNING id', [userId])
    await client.query('COMMIT')
    return Boolean(result.rows[0])
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}

// Keeps role changes and deletions from removing the final administrator.
async function preventRemovingLastAdmin(client) {
  const result = await client.query("SELECT COUNT(*)::int AS count FROM users WHERE role = 'admin'")
  if (result.rows[0].count <= 1) {
    const error = new Error('At least one administrator account must remain active.')
    error.statusCode = 409
    throw error
  }
}

export async function listAllAppointmentsForAdmin() {
  const result = await pool.query(
    `SELECT a.id, a.listing_id, a.guest_name, a.guest_email,
            a.preferred_date, a.preferred_time, a.note, a.status, a.created_at,
            l.title, l.viewing_fee, loc.name AS location_name,
            u.full_name AS lister_name, u.email AS lister_email, u.phone AS lister_phone
     FROM viewing_appointments a
     JOIN listings l ON l.id = a.listing_id
     JOIN locations loc ON loc.id = l.location_id
     JOIN users u ON u.id = l.owner_id
     ORDER BY a.created_at DESC
     LIMIT 50`,
  )
  return result.rows
}

export async function listAllReservationsForAdmin() {
  const result = await pool.query(
    `SELECT r.id, r.listing_id, r.guest_name, r.guest_email,
            r.move_in_date, r.note, r.status, r.created_at,
            l.title, l.viewing_fee, loc.name AS location_name,
            u.full_name AS lister_name, u.email AS lister_email, u.phone AS lister_phone
     FROM reservations r
     JOIN listings l ON l.id = r.listing_id
     JOIN locations loc ON loc.id = l.location_id
     JOIN users u ON u.id = l.owner_id
     ORDER BY r.created_at DESC
     LIMIT 50`,
  )
  return result.rows
}

export async function listAllInquiriesForAdmin() {
  const result = await pool.query(
    `SELECT i.id, i.listing_id, i.tenant_id, i.guest_name, i.guest_email, i.guest_phone,
            i.message, i.created_at,
            l.title, loc.name AS location_name,
            t.full_name AS tenant_name, t.email AS tenant_email,
            u.full_name AS lister_name, u.email AS lister_email
     FROM inquiries i
     JOIN listings l ON l.id = i.listing_id
     JOIN locations loc ON loc.id = l.location_id
     JOIN users u ON u.id = l.owner_id
     LEFT JOIN users t ON t.id = i.tenant_id
     ORDER BY i.created_at DESC
     LIMIT 100`,
  )
  return result.rows
}

export async function getPlatformStats() {
  const [userStats, listingStats, appointmentStats, reservationStats, inquiryStats] = await Promise.all([
    pool.query(`SELECT role, COUNT(*)::int AS count FROM users GROUP BY role`),
    pool.query(`SELECT moderation_status, COUNT(*)::int AS count FROM listings GROUP BY moderation_status`),
    pool.query(`SELECT status, COUNT(*)::int AS count FROM viewing_appointments GROUP BY status`),
    pool.query(`SELECT status, COUNT(*)::int AS count FROM reservations GROUP BY status`),
    pool.query(`SELECT COUNT(*)::int AS count FROM inquiries`),
  ])

  return {
    users: userStats.rows,
    listings: listingStats.rows,
    appointments: appointmentStats.rows,
    reservations: reservationStats.rows,
    inquiries: inquiryStats.rows[0]?.count || 0,
  }
}
