// Checks the API health endpoints and core application responses.
import test from 'node:test'
import assert from 'node:assert/strict'
import { app } from '../src/app.js'

function createMockReqRes({ url, method = 'GET', headers = {}, body = null } = {}) {
  const req = {
    url,
    originalUrl: url,
    path: url.split('?')[0],
    method,
    headers: { host: 'localhost', ...headers },
    query: {},
    params: {},
    body,
    ip: '127.0.0.1',
    socket: { remoteAddress: '127.0.0.1' },
    get(name) {
      return this.headers[name.toLowerCase()]
    },
    accepts(type) {
      return type === 'json'
    },
  }

  const res = {
    statusCode: 200,
    headers: {},
    ended: false,
    body: null,
    setHeader(name, value) {
      this.headers[name.toLowerCase()] = value
    },
    getHeader(name) {
      return this.headers[name.toLowerCase()]
    },
    status(code) {
      this.statusCode = code
      return this
    },
    json(data) {
      this.body = data
      this.ended = true
      if (this.onFinish) this.onFinish()
      return this
    },
    send(data) {
      this.body = data
      this.ended = true
      if (this.onFinish) this.onFinish()
      return this
    },
    end() {
      this.ended = true
      if (this.onFinish) this.onFinish()
      return this
    },
  }

  return { req, res }
}

test('GET /api/health/live returns status ok without requiring database', async () => {
  const { req, res } = createMockReqRes({ url: '/api/health/live' })
  await new Promise((resolve) => {
    res.onFinish = resolve
    app.handle(req, res)
  })

  assert.equal(res.statusCode, 200)
  assert.equal(res.body.status, 'ok')
})

test('GET /api/unknown-route returns 404 Route not found', async () => {
  const { req, res } = createMockReqRes({ url: '/api/unknown-route' })
  await new Promise((resolve) => {
    res.onFinish = resolve
    app.handle(req, res)
  })

  assert.equal(res.statusCode, 404)
  assert.equal(res.body.error, 'Route not found')
})

test('App includes security headers in responses', async () => {
  const { req, res } = createMockReqRes({ url: '/api/health/live' })
  await new Promise((resolve) => {
    res.onFinish = resolve
    app.handle(req, res)
  })

  assert.equal(res.getHeader('x-content-type-options'), 'nosniff')
  assert.equal(res.getHeader('x-frame-options'), 'SAMEORIGIN')
})
