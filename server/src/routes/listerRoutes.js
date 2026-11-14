// Lister endpoints for properties, photos, viewings, and reservations.
import { Router } from 'express'
import { z } from 'zod'
import { requireAuth } from '../middleware/requireAuth.js'
import { requireRole } from '../middleware/requireRole.js'
import { createListerListing, deleteListerListing, getListingsForLister, updateListerListing, updateListingAvailability } from '../services/listerService.js'
import { uploadListingPhotos } from '../services/storageService.js'
import { getAppointmentsForLister, updateAppointmentStatus } from '../services/appointmentService.js'
import { getReservationsForLister, updateReservationStatus } from '../services/reservationService.js'
import { sendReservationAcceptedEmail } from '../services/emailService.js'
import { createRateLimiter } from '../middleware/security.js'
import multer from 'multer'

const router = Router()
const reservationEmailLimiter = createRateLimiter({ windowMs: 60_000, max: 5, message: 'Too many reservation emails. Please wait a minute before trying again.' })
const photoUploadLimiter = createRateLimiter({ windowMs: 60_000, max: 5, message: 'Too many photo uploads. Please wait a minute before trying again.' })
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { files: 8, fileSize: 5 * 1024 * 1024 },
  fileFilter: (_request, file, callback) => {
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)) {
      const error = new Error('Only JPEG, PNG, or WebP images are allowed')
      error.statusCode = 400
      return callback(error)
    }
    return callback(null, true)
  },
})
const listingSchema = z.object({
  title: z.string().trim().min(3).max(180),
  description: z.string().trim().min(10).max(2000),
  propertyAddress: z.string().trim().max(300).optional().default('').transform((value) => value || null),
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
  monthlyRent: z.coerce.number().int().positive(),
  viewingFee: z.coerce.number().int().nonnegative().max(1_000_000).default(0),
  bedrooms: z.coerce.number().int().nonnegative().max(20),
  location: z.string().trim().min(2).max(120),
  amenities: z.array(z.string().trim().min(1).max(80)).max(30).default([]),
  photoUrls: z.array(z.string().trim().url().max(2000)).max(15).default([]),
  availability: z.enum(['available', 'available_this_month', 'unavailable']).default('available'),
})
const newListingSchema = listingSchema.refine((listing) => Boolean(listing.propertyAddress), {
  message: 'Add the property street, building, or Google Maps searchable location.',
  path: ['propertyAddress'],
})
const availabilitySchema = z.object({
  availability: z.enum(['available', 'available_this_month', 'unavailable']),
})
const appointmentStatusSchema = z.object({
  status: z.enum(['confirmed', 'declined', 'cancelled', 'completed']),
})
const reservationStatusSchema = z.object({
  status: z.enum(['accepted', 'declined', 'cancelled']),
  resendEmail: z.boolean().default(false),
})

router.use(requireAuth, requireRole('lister'))

router.post('/uploads', photoUploadLimiter, upload.array('photos', 8), async (request, response, next) => {
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

router.get('/appointments', async (request, response, next) => {
  try {
    return response.json({ appointments: await getAppointmentsForLister(request.user.sub) })
  } catch (error) {
    return next(error)
  }
})

router.patch('/appointments/:appointmentId/status', async (request, response, next) => {
  try {
    const { status } = appointmentStatusSchema.parse(request.body)
    const appointment = await updateAppointmentStatus(request.user.sub, request.params.appointmentId, status)
    if (!appointment) return response.status(404).json({ error: 'Viewing request not found' })
    return response.json({ appointment })
  } catch (error) {
    return next(error)
  }
})

router.get('/reservations', async (request, response, next) => {
  try {
    return response.json({ reservations: await getReservationsForLister(request.user.sub) })
  } catch (error) {
    return next(error)
  }
})

router.patch('/reservations/:reservationId/status', (request, response, next) => {
  if (request.body?.resendEmail) return reservationEmailLimiter(request, response, next)
  return next()
}, async (request, response, next) => {
  try {
    const { status, resendEmail } = reservationStatusSchema.parse(request.body)
    const reservation = await updateReservationStatus(request.user.sub, request.params.reservationId, status)
    if (!reservation) return response.status(404).json({ error: 'Reservation not found' })

    let notificationSent = null
    if (status === 'accepted' && reservation.reservation.status === 'accepted' && (reservation.changed || resendEmail)) {
      try {
        notificationSent = await sendReservationAcceptedEmail(reservation.reservation)
      } catch (error) {
        console.error('Could not send reservation acceptance email:', error)
        notificationSent = false
      }
    }

    return response.json({ reservation: reservation.reservation, notificationSent })
  } catch (error) {
    return next(error)
  }
})

router.post('/listings', async (request, response, next) => {
  try {
    const input = newListingSchema.parse(request.body)
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
