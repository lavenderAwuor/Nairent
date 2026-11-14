// Restricts protected routes to users with the required role.
export function requireRole(...allowedRoles) {
  return (request, response, next) => {
    if (!allowedRoles.includes(request.user.role)) {
      return response.status(403).json({ error: 'You do not have permission to perform this action' })
    }

    return next()
  }
}
