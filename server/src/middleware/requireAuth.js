// Verifies bearer tokens and attaches the authenticated user to each request.
import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'
import { pool } from '../db/pool.js'

// Verifies the bearer token and refreshes the account role so removed users or roles lose access immediately.
export async function requireAuth(request, response, next) {
  const authorization = request.get('authorization')
  const token = authorization?.startsWith('Bearer ') ? authorization.slice(7) : null

  if (!token) {
    return response.status(401).json({ error: 'Authentication is required' })
  }

  try {
    const claims = jwt.verify(token, env.JWT_SECRET)
    if (typeof claims.sub !== 'string' || !claims.sub) {
      return response.status(401).json({ error: 'Invalid or expired authentication token' })
    }
    const result = await pool.query(
      'SELECT id, role FROM users WHERE id = $1',
      [claims.sub],
    )
    const user = result.rows[0]
    if (!user) {
      return response.status(401).json({ error: 'This account is no longer available for authentication' })
    }
    request.user = { ...claims, sub: user.id, role: user.role }
    return next()
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return response.status(401).json({ error: 'Invalid or expired authentication token' })
    }
    return next(error)
  }
}
