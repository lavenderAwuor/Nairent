import { app } from './app.js'
import { env } from './config/env.js'
import { pool } from './db/pool.js'

const server = app.listen(env.PORT, () => {
  console.log(`Nairent API listening on http://localhost:${env.PORT}`)
})

async function shutdown(signal) {
  console.log(`${signal} received, shutting down`)
  server.close(async () => {
    await pool.end()
    process.exit(0)
  })
}

process.on('SIGINT', () => shutdown('SIGINT'))
process.on('SIGTERM', () => shutdown('SIGTERM'))
