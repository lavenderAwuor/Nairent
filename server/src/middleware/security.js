// Adds HTTP security headers and limits repeated requests.
export function securityHeaders(request, response, next) {
  response.setHeader('X-Content-Type-Options', 'nosniff')
  response.setHeader('X-Frame-Options', 'SAMEORIGIN')
  response.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.setHeader('X-DNS-Prefetch-Control', 'off')

  if (process.env.NODE_ENV === 'production') {
    response.setHeader('Strict-Transport-Security', 'max-age=15552000; includeSubDomains')
  }

  next()
}

export function createRateLimiter({ windowMs = 60_000, max = 30, message = 'Too many requests, please try again shortly.' } = {}) {
  const requestWindows = new Map()
  let requestCount = 0

  return function rateLimiter(request, response, next) {
    // In test environment, skip rate limiting to avoid test interference
    if (process.env.NODE_ENV === 'test') return next()

    const clientIp = request.ip || request.socket.remoteAddress || 'unknown'
    const now = Date.now()
    requestCount += 1

    // Remove expired client records periodically so long-running servers do not retain old IPs forever.
    if (requestCount % 256 === 0) {
      for (const [ip, record] of requestWindows) {
        if (now - record.startTime > windowMs) requestWindows.delete(ip)
      }
    }

    const record = requestWindows.get(clientIp)
    if (!record || now - record.startTime > windowMs) {
      if (requestWindows.size >= 10_000) {
        for (const [ip, entry] of requestWindows) {
          if (now - entry.startTime > windowMs) requestWindows.delete(ip)
        }
        if (requestWindows.size >= 10_000) {
          return response.status(429).json({ error: 'Too many distinct clients. Please try again shortly.' })
        }
      }
      requestWindows.set(clientIp, { startTime: now, count: 1 })
      return next()
    }

    record.count += 1
    if (record.count > max) {
      response.setHeader('Retry-After', Math.ceil((record.startTime + windowMs - now) / 1000))
      return response.status(429).json({ error: message })
    }

    return next()
  }
}
