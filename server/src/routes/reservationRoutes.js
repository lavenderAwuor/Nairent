import { Router } from 'express'
import { z } from 'zod'
import { pool } from '../db/pool.js'

const router = Router()
const reservationSchema = z.object({
  listingId: z.string().uuid(),
  guestName: z.string().trim().min(2).max(120),
  guestEmail: z.string().trim().email(),
  moveInDate: z.string().date().optional(),
  note: z.string().trim().max(500).optional(),
})

router.post('/', async (request, response, next) => {
  try {
    const input = reservationSchema.parse(request.body)
    const result = await pool.query(
      `INSERT INTO reservations (listing_id, guest_name, guest_email, move_in_date, note)
       SELECT $1, $2, $3, $4, $5
       WHERE EXISTS (
         SELECT 1 FROM listings
         WHERE id = $1 AND moderation_status = 'approved'
           AND availability_status IN ('available', 'available_this_month')
       )
       RETURNING id, listing_id, move_in_date, note, status, created_at`,
      [input.listingId, input.guestName, input.guestEmail, input.moveInDate || null, input.note || null],
    )
    if (result.rowCount === 0) return response.status(409).json({ error: 'This listing is not currently accepting reservations' })
    return response.status(201).json({ reservation: result.rows[0] })
  } catch (error) {
    return next(error)
  }
})

export default router
