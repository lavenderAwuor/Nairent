import { Router } from 'express'
import { z } from 'zod'
import { requireAuth } from '../middleware/requireAuth.js'
import { requireRole } from '../middleware/requireRole.js'
import { createListerListing, getListingsForLister } from '../services/listerService.js'

const router = Router()
const listingSchema = z.object({
  title: z.string().trim().min(3).max(180),
  description: z.string().trim().min(10).max(2000),
  monthlyRent: z.coerce.number().int().positive(),
  bedrooms: z.coerce.number().int().nonnegative().max(20),
  location: z.string().trim().min(2).max(120),
})

router.use(requireAuth, requireRole('lister'))

router.get('/listings', async (request, response, next) => {
  try {
    return response.json({ listings: await getListingsForLister(request.user.sub) })
  } catch (error) {
    return next(error)
  }
})

router.post('/listings', async (request, response, next) => {
  try {
    const input = listingSchema.parse(request.body)
    const listing = await createListerListing({ ...input, ownerId: request.user.sub })
    if (!listing) return response.status(400).json({ error: 'Choose a valid Nairobi location' })
    return response.status(201).json({ listing })
  } catch (error) {
    return next(error)
  }
})

export default router
