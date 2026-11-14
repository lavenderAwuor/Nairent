// Public search, recommendation, and detail endpoints for approved listings.
import { Router } from 'express'
import { z } from 'zod'
import { getAlternativeRecommendations, getListingById, searchListings } from '../services/listingService.js'

const router = Router()

const searchSchema = z.object({
  location: z.string().trim().min(1).optional(),
  minRent: z.coerce.number().int().nonnegative().optional(),
  maxRent: z.coerce.number().int().positive().optional(),
  bedrooms: z.coerce.number().int().nonnegative().optional(),
  availability: z.enum(['available', 'available_this_month']).optional(),
  limit: z.coerce.number().int().min(1).max(50).optional(),
  availableOnly: z.enum(['true', 'false']).optional(),
})

router.get('/', async (request, response, next) => {
  try {
    const filters = searchSchema.parse(request.query)
    const result = await searchListings(filters)
    return response.json(result)
  } catch (error) {
    return next(error)
  }
})

router.get('/recommendations', async (request, response, next) => {
  try {
    const filters = searchSchema.parse(request.query)
    const recommendations = await getAlternativeRecommendations(filters)
    return response.json({ recommendations })
  } catch (error) {
    return next(error)
  }
})

router.get('/:listingId', async (request, response, next) => {
  try {
    const listingId = z.string().uuid().safeParse(request.params.listingId)
    if (!listingId.success) return response.status(400).json({ error: 'Invalid listing ID' })
    const listing = await getListingById(listingId.data)
    if (!listing) return response.status(404).json({ error: 'Listing not found' })
    return response.json({ listing })
  } catch (error) {
    return next(error)
  }
})

export default router
