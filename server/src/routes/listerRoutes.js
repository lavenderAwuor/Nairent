import { Router } from 'express'
import { z } from 'zod'
import { requireAuth } from '../middleware/requireAuth.js'
import { requireRole } from '../middleware/requireRole.js'
import { createListerListing, deleteListerListing, getListingsForLister, updateListerListing, updateListingAvailability } from '../services/listerService.js'
import { uploadListingPhotos } from '../services/storageService.js'
import multer from 'multer'

const router = Router()
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { files: 12, fileSize: 10 * 1024 * 1024 },
  fileFilter: (_request, file, callback) => {
    callback(null, ['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype))
  },
})
const listingSchema = z.object({
  title: z.string().trim().min(3).max(180),
  description: z.string().trim().min(10).max(2000),
  monthlyRent: z.coerce.number().int().positive(),
  bedrooms: z.coerce.number().int().nonnegative().max(20),
  location: z.string().trim().min(2).max(120),
  amenities: z.array(z.string().trim().min(1).max(80)).max(30).default([]),
  photoUrls: z.array(z.string().trim().url().max(2000)).max(12).default([]),
  availability: z.enum(['available', 'available_this_month', 'unavailable']).default('available'),
})
const availabilitySchema = z.object({
  availability: z.enum(['available', 'available_this_month', 'unavailable']),
})

router.use(requireAuth, requireRole('lister'))

router.post('/uploads', upload.array('photos', 12), async (request, response, next) => {
  try {
    if (!request.files?.length) return response.status(400).json({ error: 'Select at least one image' })
    const photoUrls = await uploadListingPhotos(request.files, request.user.sub)
    return response.status(201).json({ photoUrls })
  } catch (error) {
    return next(error)
  }
})

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

router.patch('/listings/:listingId', async (request, response, next) => {
  try {
    const input = listingSchema.parse(request.body)
    const listing = await updateListerListing({ ...input, listingId: request.params.listingId, ownerId: request.user.sub })
    if (!listing) return response.status(404).json({ error: 'Listing not found or location is invalid' })
    return response.json({ listing })
  } catch (error) {
    return next(error)
  }
})

router.patch('/listings/:listingId/availability', async (request, response, next) => {
  try {
    const { availability } = availabilitySchema.parse(request.body)
    const listing = await updateListingAvailability(request.user.sub, request.params.listingId, availability)
    if (!listing) return response.status(404).json({ error: 'Listing not found' })
    return response.json({ listing })
  } catch (error) {
    return next(error)
  }
})

router.delete('/listings/:listingId', async (request, response, next) => {
  try {
    const deleted = await deleteListerListing(request.user.sub, request.params.listingId)
    if (!deleted) return response.status(404).json({ error: 'Listing not found' })
    return response.status(204).send()
  } catch (error) {
    return next(error)
  }
})

export default router
