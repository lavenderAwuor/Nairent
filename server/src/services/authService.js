// Creates accounts and authenticates users.
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'
import { pool } from '../db/pool.js'

const publicUserColumns = 'id, full_name, email, phone, role, created_at'

function createToken(user) {
  return jwt.sign({ sub: user.id, role: user.role, email: user.email }, env.JWT_SECRET, {
    expiresIn: '7d',
  })
}

export async function registerUser({ fullName, email, phone, password, role }) {
  const passwordHash = await bcrypt.hash(password, 12)
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const result = await client.query(
      `INSERT INTO users (full_name, email, password_hash, phone, role, email_verified_at)
       VALUES ($1, $2, $3, $4, $5, NOW())
       RETURNING ${publicUserColumns}`,
      [fullName, email.toLowerCase(), passwordHash, phone, role],
    )
    const user = result.rows[0]
    await client.query('COMMIT')
    return { user, token: createToken(user) }
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
    'SELECT id, full_name, email, phone, password_hash, role, created_at FROM users WHERE email = $1',
    [normalizedEmail],
  )
  const user = result.rows[0]
  const passwordMatches = user ? await bcrypt.compare(password, user.password_hash) : false

  if (!passwordMatches) {
    return null
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
