export function errorHandler(error, _request, response, _next) {
  void _next
  console.error(error)

  if (error.name === 'ZodError') {
    return response.status(400).json({
      error: 'Validation failed',
      details: error.issues,
    })
  }

  if (error.code === '23505' && error.constraint === 'users_email_key') {
    return response.status(409).json({ error: 'An account with that email already exists' })
  }

  if (error.code === '23505' && error.constraint === 'viewing_appointments_listing_id_tenant_id_preferred_date_preferred_time_key') {
    return response.status(409).json({ error: 'You already requested this viewing time' })
  }

  if (error.statusCode) {
    return response.status(error.statusCode).json({ error: error.message })
  }

  return response.status(500).json({ error: 'An unexpected server error occurred' })
}
