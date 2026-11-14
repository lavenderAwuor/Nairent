// Signup, login, email confirmation, and account profile endpoints.
import { Router } from 'express'
import { z } from 'zod'
import { requireAuth } from '../middleware/requireAuth.js'
import { createRateLimiter } from '../middleware/security.js'
import { env } from '../config/env.js'
import { buildVerificationUrl, getEmailTransportStatus, sendVerificationEmail } from '../services/emailService.js'
import {
  createResendVerification,
  getUserById,
  loginUser,
  registerUser,
  updateUserProfile,
  verifyEmail,
} from '../services/authService.js'

const router = Router()
const authLimiter = createRateLimiter({ windowMs: 60_000, max: 15, message: 'Too many authentication attempts, please wait a minute.' })
const resendLimiter = createRateLimiter({ windowMs: 60_000, max: 5, message: 'Too many confirmation requests. Please wait a minute.' })
const verifyLimiter = createRateLimiter({ windowMs: 60_000, max: 10, message: 'Too many confirmation attempts. Please wait a minute.' })

const emailSchema = z.object({ email: z.string().trim().email() })
const credentialsSchema = emailSchema.extend({
  password: z.string().min(8).max(72),
})

const registrationSchema = emailSchema.extend({
  fullName: z.string().trim().min(2).max(120),
  phone: z.string().trim().min(7).max(32),
  role: z.enum(['tenant', 'lister']).default('tenant'),
})
const verificationSchema = z.object({ token: z.string().regex(/^[a-f0-9]{64}$/i) })
const emailActivationSchema = verificationSchema.extend({ password: z.string().min(8).max(72) })
const profileSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  phone: z.string().trim().max(32).optional().default('').transform((value) => value || null),
})

// Returns safe signup status and exposes a test link only when local development has no mail transport.
function getVerificationResponse(developmentVerificationUrl) {
  const emailDeliveryStatus = getEmailTransportStatus()
  return {
    message: 'If the address is eligible, a confirmation email will be sent. Check your inbox and spam folder.',
    emailDeliveryConfigured: emailDeliveryStatus !== 'not_configured',
    emailDeliveryStatus,
    ...(env.NODE_ENV === 'development' && emailDeliveryStatus === 'not_configured' && developmentVerificationUrl
      ? { developmentVerificationUrl }
      : {}),
  }
}

async function deliverVerificationEmail(details) {
  try {
    return await sendVerificationEmail({ email: details.email, fullName: details.fullName, token: details.verificationToken })
  } catch (error) {
    console.error('Email confirmation delivery failed:', {
      code: error.code || error.name || 'unknown error',
      message: error.message,
    })
  }
}

router.post('/register', authLimiter, async (request, response, next) => {
  try {
    const input = registrationSchema.parse(request.body)
    const result = await registerUser(input)
    const delivered = await deliverVerificationEmail({
      email: result.user.email,
      fullName: result.user.full_name,
      verificationToken: result.verificationToken,
    })
    const verificationUrl = delivered === false ? buildVerificationUrl(result.verificationToken) : undefined
    return response.status(202).json(getVerificationResponse(verificationUrl))
  } catch (error) {
    if (error.code === '23505') {
      return response.status(202).json(getVerificationResponse())
    }
    return next(error)
  }
})

router.post('/resend-verification', resendLimiter, async (request, response, next) => {
  try {
    const { email } = emailSchema.parse({ email: request.body?.email })
    const result = await createResendVerification(email)
    const delivered = result ? await deliverVerificationEmail(result) : null
    const verificationUrl = delivered === false ? buildVerificationUrl(result.verificationToken) : undefined
    return response.status(202).json(getVerificationResponse(verificationUrl))
  } catch (error) {
    return next(error)
  }
})

router.post('/verify-email', verifyLimiter, async (request, response, next) => {
  try {
    const { token, password } = emailActivationSchema.parse(request.body)
    const verified = await verifyEmail(token, password)
    if (!verified) {
      return response.status(400).json({ error: 'This confirmation link is invalid or has expired. Request a new one.' })
    }
    return response.json({ message: 'Email confirmed. You can now sign in.' })
  } catch (error) {
    return next(error)
  }
})

router.post('/login', authLimiter, async (request, response, next) => {
  try {
    const input = credentialsSchema.parse(request.body)
    const result = await loginUser(input)

    if (result?.emailVerificationRequired) {
      return response.status(403).json({
        code: 'EMAIL_NOT_VERIFIED',
        error: 'Confirm your email address before signing in.',
      })
    }

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
