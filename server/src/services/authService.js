import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'
import { pool } from '../db/pool.js'

const publicUserColumns = 'id, full_name, email, role, created_at'

function createToken(user) {
  return jwt.sign({ sub: user.id, role: user.role, email: user.email }, env.JWT_SECRET, {
    expiresIn: '7d',
  })
}

export async function registerUser({ fullName, email, password, role }) {
  const passwordHash = await bcrypt.hash(password, 12)
  const result = await pool.query(
    `INSERT INTO users (full_name, email, password_hash, role)
     VALUES ($1, $2, $3, $4)
     RETURNING ${publicUserColumns}`,
    [fullName, email.toLowerCase(), passwordHash, role],
  )
  const user = result.rows[0]
  return { user, token: createToken(user) }
}

export async function loginUser({ email, password }) {
  const result = await pool.query(
    'SELECT id, full_name, email, password_hash, role, created_at FROM users WHERE email = $1',
    [email.toLowerCase()],
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
