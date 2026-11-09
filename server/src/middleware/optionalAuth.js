import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'

export function optionalAuth(request, _response, next) {
  const authorization = request.get('authorization')
  const token = authorization?.startsWith('Bearer ') ? authorization.slice(7) : null

  if (!token) return next()

  try {
    request.user = jwt.verify(token, env.JWT_SECRET)
  } catch (error) {
    if (error.name !== 'JsonWebTokenError' && error.name !== 'TokenExpiredError') {
      return next(error)
    }
  }

  return next()
}
