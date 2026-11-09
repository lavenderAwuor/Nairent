import test from 'node:test'
import assert from 'node:assert/strict'
import jwt from 'jsonwebtoken'
import { env } from '../src/config/env.js'
import { requireAuth } from '../src/middleware/requireAuth.js'
import { requireRole } from '../src/middleware/requireRole.js'

function responseMock() {
  return {
    statusCode: null,
    body: null,
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

test('requireAuth accepts a valid bearer token', () => {
  const request = { get: () => `Bearer ${jwt.sign({ sub: 'user-id', role: 'lister' }, env.JWT_SECRET)}` }
  const response = responseMock()
  let nextCalled = false

  requireAuth(request, response, () => { nextCalled = true })

  assert.equal(nextCalled, true)
  assert.equal(request.user.sub, 'user-id')
  assert.equal(response.statusCode, null)
})

test('requireAuth rejects a missing bearer token', () => {
  const response = responseMock()
  let nextCalled = false

  requireAuth({ get: () => undefined }, response, () => { nextCalled = true })

  assert.equal(nextCalled, false)
  assert.equal(response.statusCode, 401)
  assert.equal(response.body.error, 'Authentication is required')
})

test('requireAuth rejects an expired token', () => {
  const token = jwt.sign({ sub: 'user-id' }, env.JWT_SECRET, { expiresIn: -1 })
  const response = responseMock()

  requireAuth({ get: () => `Bearer ${token}` }, response, () => {})

  assert.equal(response.statusCode, 401)
  assert.equal(response.body.error, 'Invalid or expired authentication token')
})

test('requireRole rejects users outside the allowed roles', () => {
  const response = responseMock()
  let nextCalled = false

  requireRole('lister')({ user: { role: 'tenant' } }, response, () => { nextCalled = true })

  assert.equal(nextCalled, false)
  assert.equal(response.statusCode, 403)
  assert.equal(response.body.error, 'You do not have permission to perform this action')
})
