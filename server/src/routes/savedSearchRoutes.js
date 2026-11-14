// Manages tenant searches and new-listing email alert preferences.
import { Router } from 'express'
import { z } from 'zod'
import { requireAuth } from '../middleware/requireAuth.js'
import { requireRole } from '../middleware/requireRole.js'
import { env } from '../config/env.js'
import { createSavedSearch, deleteSavedSearch, listSavedSearches, updateSavedSearchNotifications } from '../services/savedSearchService.js'

const router = Router()
const searchSchema = z.object({
  location: z.string().trim().min(1).max(120).optional(),
  minRent: z.coerce.number().int().nonnegative().optional(),
  maxRent: z.coerce.number().int().positive().optional(),
  bedrooms: z.coerce.number().int().nonnegative().optional(),
  availability: z.enum(['available', 'available_this_month']).optional(),
  notifyNewListings: z.boolean().default(false),
}).refine(({ minRent, maxRent }) => minRent === undefined || maxRent === undefined || minRent <= maxRent, {
  message: 'Minimum rent cannot exceed maximum rent',
  path: ['minRent'],
})
const notificationSchema = z.object({ notifyNewListings: z.boolean() })

router.use(requireAuth, requireRole('tenant'))

router.get('/', async (request, response, next) => {
  try {
    return response.json({ searches: await listSavedSearches(request.user.sub) })
  } catch (error) {
    return next(error)
  }
})

router.post('/', async (request, response, next) => {
  try {
    const search = await createSavedSearch(request.user.sub, searchSchema.parse(request.body))
    if (!search) return response.status(400).json({ error: 'Choose a valid Nairobi location' })
    return response.status(201).json({
      search,
      emailDeliveryConfigured: Boolean(env.SMTP_HOST && env.SMTP_FROM),
    })
  } catch (error) {
    return next(error)
  }
})

router.patch('/:searchId/notifications', async (request, response, next) => {
  try {
    const { notifyNewListings } = notificationSchema.parse(request.body)
    const search = await updateSavedSearchNotifications(request.user.sub, request.params.searchId, notifyNewListings)
    if (!search) return response.status(404).json({ error: 'Saved search not found' })
    return response.json({
      search,
      emailDeliveryConfigured: Boolean(env.SMTP_HOST && env.SMTP_FROM),
    })
  } catch (error) {
    return next(error)
  }
})

router.delete('/:searchId', async (request, response, next) => {
  try {
    const deleted = await deleteSavedSearch(request.user.sub, request.params.searchId)
    if (!deleted) return response.status(404).json({ error: 'Saved search not found' })
    return response.status(204).send()
  } catch (error) {
    return next(error)
  }
})

export default router
