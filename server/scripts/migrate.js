import 'dotenv/config'
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import pg from 'pg'

const { Pool } = pg
const directory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'migrations')

const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) {
  throw new Error('DATABASE_URL is required')
}

const migrationFiles = (await fs.readdir(directory)).filter((file) => file.endsWith('.sql')).sort()

if (databaseUrl.startsWith('http://') || databaseUrl.startsWith('https://')) {
  const accessToken = process.env.access_token
  if (!accessToken) {
    throw new Error('access_token is required when DATABASE_URL is a Supabase project URL')
  }

  const projectRef = new URL(databaseUrl).hostname.split('.')[0]
  const endpoint = `https://api.supabase.com/v1/projects/${projectRef}/database/query`

  const runQuery = async (query) => {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query }),
    })

    if (!response.ok) {
      const details = await response.text()
      throw new Error(`Supabase database query failed (${response.status}): ${details}`)
    }

    return response.json()
  }

  await runQuery(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      filename TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `)

  for (const filename of migrationFiles) {
    const escapedFilename = filename.replaceAll("'", "''")
    const result = await runQuery(
      `SELECT 1 FROM schema_migrations WHERE filename = '${escapedFilename}' LIMIT 1`,
    )
    if (Array.isArray(result) && result.length > 0) {
      console.log(`Skipping ${filename} (already applied)`)
      continue
    }

    const sql = await fs.readFile(path.join(directory, filename), 'utf8')
    await runQuery(`${sql}\nINSERT INTO schema_migrations (filename) VALUES ('${escapedFilename}')`)
    console.log(`Applied ${filename}`)
  }
} else {
  const pool = new Pool({ connectionString: databaseUrl, connectionTimeoutMillis: 8_000 })
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        filename TEXT PRIMARY KEY,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `)

    for (const filename of migrationFiles) {
      const applied = await pool.query('SELECT 1 FROM schema_migrations WHERE filename = $1', [filename])
      if (applied.rowCount > 0) {
        console.log(`Skipping ${filename} (already applied)`)
        continue
      }

      const sql = await fs.readFile(path.join(directory, filename), 'utf8')
      const client = await pool.connect()
      try {
        await client.query('BEGIN')
        await client.query(sql)
        await client.query('INSERT INTO schema_migrations (filename) VALUES ($1)', [filename])
        await client.query('COMMIT')
        console.log(`Applied ${filename}`)
      } catch (error) {
        await client.query('ROLLBACK')
        throw new Error(`Migration ${filename} failed: ${error.message}`, { cause: error })
      } finally {
        client.release()
      }
    }
  } finally {
    await pool.end()
  }
}
