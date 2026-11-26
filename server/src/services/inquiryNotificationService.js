// Sends new listing inquiries to listers with replies addressed to the renter.
import nodemailer from 'nodemailer'
import { env } from '../config/env.js'

let transporter

function getTransporter() {
  if (!env.SMTP_HOST || !env.SMTP_FROM) return null
  if (transporter) return transporter

  transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_SECURE,
    ...(env.SMTP_USER && env.SMTP_PASSWORD
      ? { auth: { user: env.SMTP_USER, pass: env.SMTP_PASSWORD } }
      : {}),
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 20_000,
  })
  return transporter
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[character])
}

export function buildInquiryNotificationEmail(inquiry) {
  const guestName = inquiry.guest_name || 'A prospective renter'
  const safeGuestName = escapeHtml(guestName)
  const safeGuestEmail = escapeHtml(inquiry.guest_email || 'Not provided')
  const safeGuestPhone = escapeHtml(inquiry.guest_phone || 'Not provided')
  const safeListingTitle = escapeHtml(inquiry.listing_title)
  const safeLocation = escapeHtml(inquiry.location_name)
  const safeMessage = escapeHtml(inquiry.message).replace(/\r?\n/g, '<br>')

  return {
    from: env.SMTP_FROM ? `Nairent <${env.SMTP_FROM}>` : undefined,
    to: inquiry.lister_email,
    ...(inquiry.guest_email ? { replyTo: inquiry.guest_email } : {}),
    subject: `New inquiry: ${inquiry.listing_title.replace(/[\r\n]/g, ' ')}`,
    text: `Hi,\n\n${guestName} sent an inquiry about ${inquiry.listing_title} in ${inquiry.location_name}.\n\nEmail: ${inquiry.guest_email || 'Not provided'}\nPhone: ${inquiry.guest_phone || 'Not provided'}\n\nMessage:\n${inquiry.message}\n\n${inquiry.guest_email ? 'Reply to this email to respond directly to the renter.' : 'The renter did not provide an email address.'}`,
    html: `<div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#202d28"><h1 style="color:#184b3a">You have a new listing inquiry</h1><p><strong>${safeGuestName}</strong> sent an inquiry about <strong>${safeListingTitle}</strong> in ${safeLocation}.</p><p><strong>Email:</strong> ${safeGuestEmail}<br><strong>Phone:</strong> ${safeGuestPhone}</p><p><strong>Message:</strong></p><p>${safeMessage}</p><p style="font-size:13px;color:#58645f">${inquiry.guest_email ? 'Reply to this email to respond directly to the renter.' : 'The renter did not provide an email address.'}</p></div>`,
  }
}

export async function sendInquiryNotificationEmail(inquiry) {
  const mailer = getTransporter()
  if (!mailer) {
    console.warn('Inquiry notification email skipped because SMTP_HOST and SMTP_FROM are not configured')
    return false
  }

  const info = await mailer.sendMail(buildInquiryNotificationEmail(inquiry))
  const accepted = (info.accepted || []).some((recipient) => {
    const address = typeof recipient === 'string' ? recipient : recipient.address
    return address?.toLowerCase() === inquiry.lister_email.toLowerCase()
  })
  if (!accepted) throw new Error('The email provider did not accept the lister address')
  return true
}
