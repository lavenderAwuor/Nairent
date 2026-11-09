import { Router } from 'express'
import { z } from 'zod'
import { requireAuth } from '../middleware/requireAuth.js'
import { getUserById, loginUser, registerUser } from '../services/authService.js'

const router = Router()

const credentialsSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(8).max(72),
})

const registrationSchema = credentialsSchema.extend({
  fullName: z.string().trim().min(2).max(120),
  phone: z.string().trim().min(7).max(32),
  role: z.enum(['tenant', 'lister']).default('tenant'),
})

router.post('/register', async (request, response, next) => {
  try {
    const input = registrationSchema.parse(request.body)
    const result = await registerUser(input)
    return response.status(201).json(result)
  } catch (error) {
    return next(error)
  }
})

router.post('/login', async (request, response, next) => {
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

export default router
