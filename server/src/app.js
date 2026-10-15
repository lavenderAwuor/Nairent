import cors from 'cors'
import express from 'express'
import { env } from './config/env.js'
import { errorHandler } from './middleware/errorHandler.js'
import authRoutes from './routes/authRoutes.js'
import listingRoutes from './routes/listingRoutes.js'
import appointmentRoutes from './routes/appointmentRoutes.js'
import locationRoutes from './routes/locationRoutes.js'
import listerRoutes from './routes/listerRoutes.js'
import reservationRoutes from './routes/reservationRoutes.js'

export const app = express()

app.use(cors({ origin: env.CLIENT_ORIGIN }))
app.use(express.json({ limit: '1mb' }))

app.get('/api/health', (_request, response) => {
  response.json({ status: 'ok' })
})

app.use('/api/auth', authRoutes)
app.use('/api/listings', listingRoutes)
app.use('/api/appointments', appointmentRoutes)
app.use('/api/locations', locationRoutes)
app.use('/api/lister', listerRoutes)
app.use('/api/reservations', reservationRoutes)
app.use((_request, response) => {
  response.status(404).json({ error: 'Route not found' })
})
app.use(errorHandler)
