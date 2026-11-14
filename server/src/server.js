// Starts the API and manages the email worker and graceful shutdown.
import { app } from './app.js'
import { env } from './config/env.js'
import { pool } from './db/pool.js'
import { startListingAlertWorker } from './services/listingAlertService.js'
import { verifyEmailTransport } from './services/emailService.js'

const emailConfigured = Boolean(env.SMTP_HOST && env.SMTP_FROM)
if (!emailConfigured) {
  console.warn('Email delivery is disabled. Set SMTP_HOST and SMTP_FROM in server/.env to send account and listing emails.')
}
const stopListingAlertWorker = emailConfigured ? startListingAlertWorker() : () => {}
if (emailConfigured) {
  void verifyEmailTransport().catch((error) => {
    console.error('SMTP connection check failed:', {
      code: error.code || error.name || 'unknown error',
      message: error.message,
    })
  })
}
const server = app.listen(env.PORT, '0.0.0.0', () => {
  console.log(`Nairent API listening on port ${env.PORT}`)
})

let shuttingDown = false
async function shutdown(signal) {
  if (shuttingDown) return
  shuttingDown = true
  console.log(`${signal} received, shutting down`)
  const timeout = setTimeout(() => process.exit(1), 10_000)
  timeout.unref()
  stopListingAlertWorker()
  server.close(async (error) => {
    try {
      await pool.end()
      clearTimeout(timeout)
      process.exit(error ? 1 : 0)
    } catch (shutdownError) {
      console.error('Graceful shutdown failed:', shutdownError)
      process.exit(1)
    }
  })
}

process.on('SIGINT', () => shutdown('SIGINT'))
process.on('SIGTERM', () => shutdown('SIGTERM'))
process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error)
  shutdown('uncaughtException')
})
process.on('unhandledRejection', (error) => {
  console.error('Unhandled promise rejection:', error)
  shutdown('unhandledRejection')
})
