// Endpoints for sending and viewing questions about rental listings.
import { Router } from 'express'
import { z } from 'zod'
import { optionalAuth } from '../middleware/optionalAuth.js'
import { requireAuth } from '../middleware/requireAuth.js'
import { requireRole } from '../middleware/requireRole.js'
import { createRateLimiter } from '../middleware/security.js'
import { createInquiry, getInquiriesForLister, getInquiriesForTenant } from '../services/inquiryService.js'
import { sendInquiryNotificationEmail } from '../services/emailService.js'

const router = Router()

const inquirySchema = z.object({
  listingId: z.string().uuid(),
  message: z.string().trim().min(3).max(1000),
  guestName: z.string().trim().min(2).max(120).optional(),
  guestEmail: z.string().trim().email().optional(),
  guestPhone: z.string().trim().min(7).max(32).optional(),
}).refine(
  (data) => Boolean(data.guestEmail || data.guestName),
  { message: 'Provide your name and email or sign in to send an inquiry', path: ['guestEmail'] },
)

const inquiryLimiter = createRateLimiter({ windowMs: 60_000, max: 20, message: 'Too many inquiries sent, please wait a minute.' })

router.post('/', optionalAuth, inquiryLimiter, async (request, response, next) => {
  try {
    const input = inquirySchema.parse(request.body)
    const createdInquiry = await createInquiry({
      ...input,
      tenantId: request.user?.sub || null,
      guestName: input.guestName || request.user?.fullName || null,
      guestEmail: input.guestEmail || request.user?.email || null,
    })

    if (!createdInquiry) {
      return response.status(404).json({ error: 'Listing not found or unavailable' })
    }

    const { lister_email, listing_title, location_name, ...inquiry } = createdInquiry
    try {
      await sendInquiryNotificationEmail({
        ...inquiry,
        lister_email,
        listing_title,
        location_name,
      })
    } catch (error) {
      console.error('Could not send inquiry notification email:', error)
    }

    return response.status(201).json({ inquiry })
  } catch (error) {
    return next(error)
  }
})

router.get('/mine', requireAuth, requireRole('tenant'), async (request, response, next) => {
  try {
    const inquiries = await getInquiriesForTenant(request.user.sub)
    return response.json({ inquiries })
  } catch (error) {
    return next(error)
  }
})

router.get('/lister', requireAuth, requireRole('lister'), async (request, response, next) => {
  try {
    const inquiries = await getInquiriesForLister(request.user.sub)
    return response.json({ inquiries })
  } catch (error) {
    return next(error)
  }
})

export default router
