// Endpoints for requesting viewings and viewing a tenant appointment history.
import { Router } from 'express'
import { z } from 'zod'
import { requireAuth } from '../middleware/requireAuth.js'
import { requireRole } from '../middleware/requireRole.js'
import { optionalAuth } from '../middleware/optionalAuth.js'
import { createRateLimiter } from '../middleware/security.js'
import { createAppointment, getAppointmentsForTenant } from '../services/appointmentService.js'

const router = Router()
const appointmentLimiter = createRateLimiter({ windowMs: 60_000, max: 20, message: 'Too many viewing requests, please wait a minute.' })

const appointmentSchema = z.object({
  listingId: z.string().uuid(),
  preferredDate: z.string().date(),
  preferredTime: z.string().regex(/^\d{2}:\d{2}$/),
  guestName: z.string().trim().min(2).max(120),
  guestEmail: z.string().trim().email(),
  note: z.string().trim().max(500).optional(),
})

router.post('/', optionalAuth, appointmentLimiter, async (request, response, next) => {
  try {
    const input = appointmentSchema.parse(request.body)
    const appointment = await createAppointment({ ...input, tenantId: request.user?.sub })
    if (!appointment) {
      return response.status(409).json({ error: 'This listing is not currently accepting viewing requests' })
    }
    return response.status(201).json({ appointment })
  } catch (error) {
    return next(error)
  }
})

router.get('/mine', requireAuth, requireRole('tenant'), async (request, response, next) => {
  try {
    return response.json({ appointments: await getAppointmentsForTenant(request.user.sub) })
  } catch (error) {
    return next(error)
  }
})

export default router
