// Converts validation and server errors into safe API responses.
export function errorHandler(error, _request, response, _next) {
  void _next
  console.error(error)

  if (error.name === 'ZodError') {
    return response.status(400).json({
      error: 'Validation failed',
      details: error.issues,
    })
  }

  if (error.type === 'entity.parse.failed') {
    return response.status(400).json({ error: 'Request body must contain valid JSON' })
  }

  if (error.name === 'MulterError') {
    const statusCode = error.code === 'LIMIT_FILE_SIZE' ? 413 : 400
    const message = error.code === 'LIMIT_FILE_SIZE'
      ? 'Each photo must be 5 MB or smaller'
      : 'Photo upload is invalid or exceeds the allowed file count'
    return response.status(statusCode).json({ error: message })
  }

  if (error.message === 'Origin is not allowed by CORS') {
    return response.status(403).json({ error: 'Origin is not allowed' })
  }

  if (error.code === '23505' && error.constraint === 'users_email_key') {
    return response.status(409).json({ error: 'An account with that email already exists' })
  }

  if (error.code === '23505' && error.constraint === 'viewing_appointments_listing_id_tenant_id_preferred_date_preferred_time_key') {
    return response.status(409).json({ error: 'You already requested this viewing time' })
  }

  if (error.code === '22P02') {
    return response.status(400).json({ error: 'Invalid identifier format' })
  }

  if (error.statusCode) {
    return response.status(error.statusCode).json({ error: error.message })
  }

  return response.status(500).json({ error: 'An unexpected server error occurred' })
}
