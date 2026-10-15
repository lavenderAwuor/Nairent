export function requireRole(...allowedRoles) {
  return (request, response, next) => {
    if (!allowedRoles.includes(request.user.role)) {
      return response.status(403).json({ error: 'You do not have permission to perform this action' })
    }

    return next()
  }
}
