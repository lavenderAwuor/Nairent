// Builds the Express API, applies shared middleware, and mounts feature routes.
import cors from 'cors'
import express from 'express'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { clientOrigins } from './config/env.js'
import { errorHandler } from './middleware/errorHandler.js'
import { securityHeaders } from './middleware/security.js'
import { pool } from './db/pool.js'
import authRoutes from './routes/authRoutes.js'
import listingRoutes from './routes/listingRoutes.js'
import appointmentRoutes from './routes/appointmentRoutes.js'
import locationRoutes from './routes/locationRoutes.js'
import listerRoutes from './routes/listerRoutes.js'
import reservationRoutes from './routes/reservationRoutes.js'
import savedSearchRoutes from './routes/savedSearchRoutes.js'
import inquiryRoutes from './routes/inquiryRoutes.js'
import adminRoutes from './routes/adminRoutes.js'
import supportRoutes from './routes/supportRoutes.js'

export const app = express()
export default app

const appDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const candidateRoots = [
  path.resolve(appDir, 'public'),
  path.resolve(appDir, '../client/dist'),
  path.resolve(appDir, '../public'),
  path.resolve(process.cwd(), 'client/dist'),
  path.resolve(process.cwd(), 'public'),
]
const webRoot = candidateRoots.find((dir) => fs.existsSync(dir)) || path.resolve(appDir, 'public')
const webIndex = path.join(webRoot, 'index.html')

app.disable('x-powered-by')
app.set('trust proxy', 1)
app.use(securityHeaders)
app.use(cors({
  origin(origin, callback) {
    if (!origin || clientOrigins.includes(origin)) return callback(null, true)
    return callback(new Error('Origin is not allowed by CORS'))
  },
}))
app.use(express.json({ limit: '1mb' }))

app.get('/api/health/live', (_request, response) => {
  response.json({ status: 'ok' })
})

app.get('/api/health', async (_request, response) => {
  try {
    await pool.query('SELECT 1')
    return response.json({
      status: 'ok',
      database: 'ok',
    })
  } catch (error) {
    console.error('Database health check failed:', error)
    return response.status(503).json({ status: 'degraded', database: 'unavailable' })
  }
})

app.use(express.static(webRoot))

app.use('/api/auth', authRoutes)
app.use('/api/listings', listingRoutes)
app.use('/api/appointments', appointmentRoutes)
app.use('/api/locations', locationRoutes)
app.use('/api/lister', listerRoutes)
app.use('/api/reservations', reservationRoutes)
app.use('/api/saved-searches', savedSearchRoutes)
app.use('/api/inquiries', inquiryRoutes)
app.use('/api/support', supportRoutes)
app.use('/api/admin', adminRoutes)

app.get('/{*splat}', (request, response, next) => {
  if (request.path.startsWith('/api/')) return next()
  if (!request.accepts('html')) return next()
  if (!fs.existsSync(webIndex)) return next()
  return response.sendFile(webIndex)
})

app.use((_request, response) => {
  response.status(404).json({ error: 'Route not found' })
})

app.use(errorHandler)
