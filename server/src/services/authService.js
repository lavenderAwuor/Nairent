// Creates accounts, verifies email tokens, and authenticates users.
import bcrypt from 'bcryptjs'
import { createHash, randomBytes } from 'node:crypto'
import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'
import { pool } from '../db/pool.js'

const publicUserColumns = 'id, full_name, email, phone, role, email_verified_at, created_at'
const verificationTokenLifetimeMs = 24 * 60 * 60 * 1000

async function createVerificationToken(client, userId) {
  const token = randomBytes(32).toString('hex')
  const tokenHash = createHash('sha256').update(token).digest('hex')

  await client.query('DELETE FROM email_verification_tokens WHERE user_id = $1 OR expires_at <= NOW()', [userId])
  await client.query(
    `INSERT INTO email_verification_tokens (token_hash, user_id, expires_at)
     VALUES ($1, $2, $3)`,
    [tokenHash, userId, new Date(Date.now() + verificationTokenLifetimeMs)],
  )
  return token
}

function createToken(user) {
  return jwt.sign({ sub: user.id, role: user.role, email: user.email }, env.JWT_SECRET, {
    expiresIn: '7d',
  })
}

export async function registerUser({ fullName, email, phone, role }) {
  const passwordHash = await bcrypt.hash(randomBytes(32).toString('hex'), 12)
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const result = await client.query(
      `INSERT INTO users (full_name, email, password_hash, phone, role)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING ${publicUserColumns}`,
      [fullName, email.toLowerCase(), passwordHash, phone, role],
    )
    const user = result.rows[0]
    const verificationToken = await createVerificationToken(client, user.id)
    await client.query('COMMIT')
    return { user, verificationToken }
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}

export async function loginUser({ email, password }) {
  const normalizedEmail = email.toLowerCase()
  const demoAccounts = ['admin@nairent.local', 'demo.lister@nairent.local']
  if (env.NODE_ENV === 'production' && demoAccounts.includes(normalizedEmail)) {
    return null
  }

  const result = await pool.query(
    'SELECT id, full_name, email, phone, password_hash, role, email_verified_at, created_at FROM users WHERE email = $1',
    [normalizedEmail],
  )
  const user = result.rows[0]
  const passwordMatches = user ? await bcrypt.compare(password, user.password_hash) : false

  if (!passwordMatches) {
    return null
  }

  if (!user.email_verified_at) {
    return { emailVerificationRequired: true }
  }

  const publicUser = { ...user }
  delete publicUser.password_hash
  return { user: publicUser, token: createToken(publicUser) }
}

export async function getUserById(userId) {
  const result = await pool.query(`SELECT ${publicUserColumns} FROM users WHERE id = $1`, [userId])
  return result.rows[0] ?? null
}

export async function updateUserProfile(userId, { fullName, phone }) {
  const result = await pool.query(
    `UPDATE users
     SET full_name = $2, phone = $3, updated_at = NOW()
     WHERE id = $1
     RETURNING ${publicUserColumns}`,
    [userId, fullName, phone],
  )
  return result.rows[0] ?? null
}

export async function createResendVerification(email) {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const result = await client.query(
      `SELECT id, full_name, email, email_verified_at
       FROM users
       WHERE email = $1
       FOR UPDATE`,
      [email.toLowerCase()],
    )
    const user = result.rows[0]
    if (!user || user.email_verified_at) {
      await client.query('COMMIT')
      return null
    }

    const recent = await client.query(
      `SELECT 1 FROM email_verification_tokens
       WHERE user_id = $1 AND created_at > NOW() - INTERVAL '60 seconds'
       LIMIT 1`,
      [user.id],
    )
    if (recent.rowCount > 0) {
      await client.query('COMMIT')
      return null
    }

    const verificationToken = await createVerificationToken(client, user.id)
    await client.query('COMMIT')
    return { email: user.email, fullName: user.full_name, verificationToken }
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}

export async function verifyEmail(token, password) {
  const tokenHash = createHash('sha256').update(token).digest('hex')
  const candidate = await pool.query(
    'SELECT 1 FROM email_verification_tokens WHERE token_hash = $1 AND expires_at > NOW()',
    [tokenHash],
  )
  if (candidate.rowCount === 0) return false

  const passwordHash = await bcrypt.hash(password, 12)
  const result = await pool.query(
    `WITH consumed AS (
       DELETE FROM email_verification_tokens
       WHERE token_hash = $1 AND expires_at > NOW()
       RETURNING user_id
     )
     UPDATE users AS u
     SET email_verified_at = COALESCE(u.email_verified_at, NOW()), password_hash = $2, updated_at = NOW()
     FROM consumed
     WHERE u.id = consumed.user_id
     RETURNING u.id`,
    [tokenHash, passwordHash],
  )
  return result.rowCount > 0
}
