// Accepts public support messages with basic validation and abuse protection.
import { Router } from 'express'
import { z } from 'zod'
import { createRateLimiter } from '../middleware/security.js'
import { createSupportRequest } from '../services/supportService.js'

const router = Router()
const supportRequestLimiter = createRateLimiter({
  windowMs: 15 * 60_000,
  max: 5,
  message: 'Too many support requests. Please wait before sending another message.',
})
const supportRequestSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(254),
  topic: z.enum(['account', 'listing', 'viewing', 'technical', 'other']),
  message: z.string().trim().min(20).max(3000),
})

router.post('/', supportRequestLimiter, async (request, response, next) => {
  try {
    const input = supportRequestSchema.parse(request.body)
    const supportRequest = await createSupportRequest(input)
    return response.status(201).json({ supportRequest })
  } catch (error) {
    return next(error)
  }
})

export default router
