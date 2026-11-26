// Checks that inquiry notifications can be replied to directly by renters.
import test from 'node:test'
import assert from 'node:assert/strict'
import { buildInquiryNotificationEmail } from '../src/services/inquiryNotificationService.js'

test('inquiry notification sets the renter as reply-to', () => {
  const email = buildInquiryNotificationEmail({
    lister_email: 'lister@example.com',
    guest_name: 'Renter',
    guest_email: 'renter@example.com',
    guest_phone: '+254700000000',
    listing_title: 'Sunny apartment',
    location_name: 'Kilimani',
    message: 'Is it still available?',
  })

  assert.equal(email.to, 'lister@example.com')
  assert.equal(email.replyTo, 'renter@example.com')
  assert.match(email.text, /Is it still available\?/)
  assert.match(email.html, /Reply to this email to respond directly to the renter\./)
})

test('inquiry notification omits reply-to without a renter email', () => {
  const email = buildInquiryNotificationEmail({
    lister_email: 'lister@example.com',
    guest_name: 'Renter',
    listing_title: 'Sunny apartment',
    location_name: 'Kilimani',
    message: 'Is it still available?',
  })

  assert.equal(email.replyTo, undefined)
  assert.match(email.text, /The renter did not provide an email address\./)
})
