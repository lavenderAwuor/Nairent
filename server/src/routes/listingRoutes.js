import { Router } from 'express'
import { z } from 'zod'
import { getListingById, searchListings } from '../services/listingService.js'

const router = Router()

const searchSchema = z.object({
  location: z.string().trim().min(1).optional(),
  minRent: z.coerce.number().int().nonnegative().optional(),
  maxRent: z.coerce.number().int().positive().optional(),
  bedrooms: z.coerce.number().int().nonnegative().optional(),
  availability: z.enum(['available', 'available_this_month']).optional(),
})

router.get('/', async (request, response, next) => {
  try {
    const filters = searchSchema.parse(request.query)
    return response.json({ listings: await searchListings(filters) })
  } catch (error) {
    return next(error)
  }
})

router.get('/:listingId', async (request, response, next) => {
  try {
    const listing = await getListingById(request.params.listingId)
    if (!listing) return response.status(404).json({ error: 'Listing not found' })
    return response.json({ listing })
  } catch (error) {
    return next(error)
  }
})

export default router
