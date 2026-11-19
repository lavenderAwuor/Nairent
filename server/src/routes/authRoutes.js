// Signup, login, and account profile endpoints.
import { Router } from 'express'
import { z } from 'zod'
import { requireAuth } from '../middleware/requireAuth.js'
import { createRateLimiter } from '../middleware/security.js'
import {
  getUserById,
  loginUser,
  registerUser,
  updateUserProfile,
} from '../services/authService.js'

const router = Router()
const authLimiter = createRateLimiter({ windowMs: 60_000, max: 15, message: 'Too many authentication attempts, please wait a minute.' })

const emailSchema = z.object({ email: z.string().trim().email() })
const credentialsSchema = emailSchema.extend({
  password: z.string().min(8).max(72),
})

const registrationSchema = emailSchema.extend({
  fullName: z.string().trim().min(2).max(120),
  phone: z.string().trim().min(7).max(32),
  password: z.string().min(8).max(72),
  role: z.enum(['tenant', 'lister']).default('tenant'),
})
const profileSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  phone: z.string().trim().max(32).optional().default('').transform((value) => value || null),
})

router.post('/register', authLimiter, async (request, response, next) => {
  try {
    const input = registrationSchema.parse(request.body)
    const result = await registerUser(input)
    return response.status(201).json(result)
  } catch (error) {
    if (error.code === '23505') {
      return response.status(409).json({ error: 'An account with this email already exists. Sign in instead.' })
    }
    return next(error)
  }
})

router.post('/login', authLimiter, async (request, response, next) => {
  try {
    const input = credentialsSchema.parse(request.body)
    const result = await loginUser(input)

    if (!result) {
      return response.status(401).json({ error: 'Invalid email or password' })
    }

    return response.json(result)
  } catch (error) {
    return next(error)
  }
})

router.get('/me', requireAuth, async (request, response, next) => {
  try {
    const user = await getUserById(request.user.sub)

    if (!user) {
      return response.status(401).json({ error: 'User account no longer exists' })
    }

    return response.json({ user })
  } catch (error) {
    return next(error)
  }
})

router.patch('/me', requireAuth, async (request, response, next) => {
  try {
    const input = profileSchema.parse(request.body)
    const user = await updateUserProfile(request.user.sub, input)
    if (!user) return response.status(404).json({ error: 'User account no longer exists' })
    return response.json({ user })
  } catch (error) {
    return next(error)
  }
})

export default router
