// Checks HTTP security headers and request rate limits.
import test from 'node:test'
import assert from 'node:assert/strict'
import { createRateLimiter, securityHeaders } from '../src/middleware/security.js'

function responseMock() {
  const headers = {}
  return {
    headers,
    statusCode: null,
    body: null,
    setHeader(name, value) {
      headers[name] = value
    },
    status(code) {
      this.statusCode = code
      return this
    },
    json(body) {
      this.body = body
      return this
    },
  }
}

test('securityHeaders sets expected security headers', () => {
  const req = {}
  const res = responseMock()
  let nextCalled = false

  securityHeaders(req, res, () => { nextCalled = true })

  assert.equal(nextCalled, true)
  assert.equal(res.headers['X-Content-Type-Options'], 'nosniff')
  assert.equal(res.headers['X-Frame-Options'], 'SAMEORIGIN')
  assert.equal(res.headers['Referrer-Policy'], 'strict-origin-when-cross-origin')
  assert.equal(res.headers['X-DNS-Prefetch-Control'], 'off')
})

test('createRateLimiter throttles requests exceeding max limit', () => {
  // Test rate limiter with NODE_ENV temporarily not 'test'
  const prevEnv = process.env.NODE_ENV
  process.env.NODE_ENV = 'development'

  try {
    const limiter = createRateLimiter({ windowMs: 10_000, max: 2, message: 'Too many requests' })
    const req = { ip: '127.0.0.1', path: '/test-throttle', headers: {} }

    // 1st request
    const res1 = responseMock()
    let next1 = false
    limiter(req, res1, () => { next1 = true })
    assert.equal(next1, true)

    // 2nd request
    const res2 = responseMock()
    let next2 = false
    limiter(req, res2, () => { next2 = true })
    assert.equal(next2, true)

    // 3rd request should be blocked
    const res3 = responseMock()
    let next3 = false
    limiter(req, res3, () => { next3 = true })
    assert.equal(next3, false)
    assert.equal(res3.statusCode, 429)
    assert.equal(res3.body.error, 'Too many requests')
  } finally {
    process.env.NODE_ENV = prevEnv
  }
})
