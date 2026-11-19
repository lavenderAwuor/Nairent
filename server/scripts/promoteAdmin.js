// Promotes an existing account to the administrator role.
import 'dotenv/config'
import pg from 'pg'

const { Pool } = pg
const email = process.argv[2]?.trim().toLowerCase()

if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
  throw new Error('Usage: npm run admin:promote -- user@example.com')
}
if (['admin@nairent.local', 'demo.lister@nairent.local'].includes(email)) {
  throw new Error('Demo accounts cannot be promoted to administrator')
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL, connectionTimeoutMillis: 8_000 })

try {
  const result = await pool.query(
    `UPDATE users
     SET role = 'admin', updated_at = NOW()
     WHERE LOWER(email) = $1
     RETURNING email`,
    [email],
  )

  if (result.rowCount === 0) {
    throw new Error(`No account found for ${email}. Register that account before promoting it.`)
  }

  console.log(`Administrator access granted to ${result.rows[0].email}. Sign out and sign in again to refresh the account token.`)
} finally {
  await pool.end()
}
