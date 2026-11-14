// Admin-only endpoints for moderation, account roles, and platform reports.
import { Router } from 'express'
import { z } from 'zod'
import { requireAuth } from '../middleware/requireAuth.js'
import { requireRole } from '../middleware/requireRole.js'
import {
  deleteListingByAdmin,
  deleteUserByAdmin,
  getPlatformStats,
  listAllAppointmentsForAdmin,
  listAllInquiriesForAdmin,
  listAllListingsForAdmin,
  listAllReservationsForAdmin,
  listUsersForAdmin,
  updateListingModerationStatus,
  updateUserRoleByAdmin,
} from '../services/adminService.js'
import { listSupportRequests, updateSupportRequestStatus } from '../services/supportService.js'

const router = Router()

router.use(requireAuth, requireRole('admin'))

const statusSchema = z.object({
  status: z.enum(['approved', 'rejected', 'pending']),
})

const roleSchema = z.object({
  role: z.enum(['tenant', 'lister', 'admin']),
})
const supportStatusSchema = z.object({
  status: z.enum(['open', 'resolved']),
})

router.get('/listings', async (request, response, next) => {
  try {
    const status = request.query.status
    if (status && !['approved', 'rejected', 'pending'].includes(status)) {
      return response.status(400).json({ error: 'Invalid status filter' })
    }
    const listings = await listAllListingsForAdmin(status)
    return response.json({ listings })
  } catch (error) {
    return next(error)
  }
})

router.patch('/listings/:listingId/status', async (request, response, next) => {
  try {
    const { status } = statusSchema.parse(request.body)
    const listing = await updateListingModerationStatus(request.params.listingId, status)
    if (!listing) return response.status(404).json({ error: 'Listing not found' })
    return response.json({ listing })
  } catch (error) {
    return next(error)
  }
})

router.delete('/listings/:listingId', async (request, response, next) => {
  try {
    const deleted = await deleteListingByAdmin(request.params.listingId)
    if (!deleted) return response.status(404).json({ error: 'Listing not found' })
    return response.status(204).send()
  } catch (error) {
    return next(error)
  }
})

router.get('/users', async (_request, response, next) => {
  try {
    const users = await listUsersForAdmin()
    return response.json({ users })
  } catch (error) {
    return next(error)
  }
})

router.patch('/users/:userId/role', async (request, response, next) => {
  try {
    const { role } = roleSchema.parse(request.body)
    const user = await updateUserRoleByAdmin(request.params.userId, role)
    if (!user) return response.status(404).json({ error: 'User not found' })
    return response.json({ user })
  } catch (error) {
    return next(error)
  }
})

router.delete('/users/:userId', async (request, response, next) => {
  try {
    const deleted = await deleteUserByAdmin(request.params.userId, request.user.sub)
    if (!deleted) return response.status(404).json({ error: 'User not found' })
    return response.status(204).send()
  } catch (error) {
    return next(error)
  }
})

router.get('/appointments', async (_request, response, next) => {
  try {
    const appointments = await listAllAppointmentsForAdmin()
    return response.json({ appointments })
  } catch (error) {
    return next(error)
  }
})

router.get('/reservations', async (_request, response, next) => {
  try {
    const reservations = await listAllReservationsForAdmin()
    return response.json({ reservations })
  } catch (error) {
    return next(error)
  }
})

router.get('/inquiries', async (_request, response, next) => {
  try {
    const inquiries = await listAllInquiriesForAdmin()
    return response.json({ inquiries })
  } catch (error) {
    return next(error)
  }
})

router.get('/support', async (_request, response, next) => {
  try {
    return response.json({ supportRequests: await listSupportRequests() })
  } catch (error) {
    return next(error)
  }
})

router.patch('/support/:requestId/status', async (request, response, next) => {
  try {
    const { status } = supportStatusSchema.parse(request.body)
    const supportRequest = await updateSupportRequestStatus(request.params.requestId, status)
    if (!supportRequest) return response.status(404).json({ error: 'Support request not found' })
    return response.json({ supportRequest })
  } catch (error) {
    return next(error)
  }
})

router.get('/stats', async (_request, response, next) => {
  try {
    const stats = await getPlatformStats()
    return response.json({ stats })
  } catch (error) {
    return next(error)
  }
})

export default router
