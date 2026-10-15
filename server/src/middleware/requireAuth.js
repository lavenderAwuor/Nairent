import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'

export function requireAuth(request, response, next) {
  const authorization = request.get('authorization')
  const token = authorization?.startsWith('Bearer ') ? authorization.slice(7) : null

  if (!token) {
    return response.status(401).json({ error: 'Authentication is required' })
  }

  try {
    request.user = jwt.verify(token, env.JWT_SECRET)
    return next()
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return response.status(401).json({ error: 'Invalid or expired authentication token' })
    }
    return next(error)
  }
}
