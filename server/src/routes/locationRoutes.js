import { Router } from 'express'
import { listLocations } from '../services/locationService.js'

const router = Router()

router.get('/', async (_request, response, next) => {
  try {
    return response.json({ locations: await listLocations() })
  } catch (error) {
    return next(error)
  }
})

export default router
