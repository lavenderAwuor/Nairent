export function errorHandler(error, _request, response, _next) {
  void _next
  console.error(error)

  if (error.name === 'ZodError') {
    return response.status(400).json({
      error: 'Validation failed',
      details: error.issues,
    })
  }

  if (error.code === '23505') {
    return response.status(409).json({ error: 'An account with that email already exists' })
  }

  return response.status(500).json({ error: 'An unexpected server error occurred' })
}
