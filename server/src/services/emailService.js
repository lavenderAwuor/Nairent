// Builds and sends confirmation, reservation, inquiry, and listing-alert emails.
import nodemailer from 'nodemailer'
import { clientOrigins, env } from '../config/env.js'

let transporter
let transportStatus = env.SMTP_HOST && env.SMTP_FROM ? 'checking' : 'not_configured'

export function getEmailTransportStatus() {
  return transportStatus
}

export async function verifyEmailTransport() {
  const mailer = getTransporter()
  if (!mailer) {
    transportStatus = 'not_configured'
    return transportStatus
  }

  try {
    await mailer.verify()
    transportStatus = 'ready'
    return transportStatus
  } catch (error) {
    transportStatus = 'unavailable'
    throw error
  }
}

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

// Builds the link sent to an account holder to confirm their email address.
export function buildVerificationUrl(token) {
  const origin = env.EMAIL_VERIFICATION_ORIGIN || clientOrigins[0]
  return `${origin}/#verify-email?token=${encodeURIComponent(token)}`
}

export async function sendVerificationEmail({ email, fullName, token }) {
  const verificationUrl = buildVerificationUrl(token)
  const mailer = getTransporter()

  if (!mailer) {
    if (env.NODE_ENV === 'production') {
      throw new Error('Email verification delivery is not configured')
    }
    console.info(`Development email verification link for ${email}: ${verificationUrl}`)
    return false
  }

  const safeName = escapeHtml(fullName)
  let info
  try {
    info = await mailer.sendMail({
      from: `Nairent <${env.SMTP_FROM}>`,
      to: email,
      subject: 'Confirm your Nairent email address',
      text: `Hi ${fullName},\n\nConfirm your email address and choose a password to activate your Nairent account:\n${verificationUrl}\n\nThis link expires in 24 hours. If you did not create a Nairent account, you can ignore this email.`,
      html: `<div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#202d28"><h1 style="color:#184b3a">Confirm your email</h1><p>Hi ${safeName},</p><p>Confirm your email address and choose a password to activate your Nairent account.</p><p style="margin:28px 0"><a href="${verificationUrl}" style="background:#184b3a;color:#fff;padding:12px 18px;border-radius:6px;text-decoration:none">Confirm email address</a></p><p>If the button does not work, open this link:</p><p><a href="${verificationUrl}">${verificationUrl}</a></p><p>This link expires in 24 hours. If you did not create a Nairent account, you can ignore this email.</p></div>`,
    })
  } catch (error) {
    transportStatus = 'unavailable'
    throw error
  }
  const accepted = (info.accepted || []).some((recipient) => {
    const address = typeof recipient === 'string' ? recipient : recipient.address
    return address?.toLowerCase() === email.toLowerCase()
  })
  if (!accepted) throw new Error('The email provider did not accept the confirmation recipient')
  transportStatus = 'ready'
  return true
}

export async function sendReservationAcceptedEmail(reservation) {
  const mailer = getTransporter()
  if (!mailer) {
    if (env.NODE_ENV === 'production') {
      throw new Error('Reservation email delivery is not configured')
    }
    console.info('Development reservation acceptance email skipped because SMTP is not configured')
    return false
  }

  const location = reservation.location_name || 'Nairobi'
  const hasPropertyAddress = Boolean(reservation.property_address?.trim())
  const hasExactCoordinates = reservation.property_latitude != null && reservation.property_longitude != null
  const mapQuery = hasExactCoordinates
    ? `${reservation.property_latitude},${reservation.property_longitude}`
    : hasPropertyAddress
    ? reservation.property_address.trim()
    : reservation.latitude != null && reservation.longitude != null
      ? `${reservation.latitude},${reservation.longitude}`
    : `${location}, Nairobi, Kenya`
  const mapsUrl = new URL('https://www.google.com/maps/search/')
  mapsUrl.searchParams.set('api', '1')
  mapsUrl.searchParams.set('query', mapQuery)
  const safeGuestName = escapeHtml(reservation.guest_name || 'there')
  const safeTitle = escapeHtml(reservation.title || 'your selected home')
  const safeLocation = escapeHtml(location)
  const safeMapNote = hasExactCoordinates
    ? 'The map opens the exact property point selected by the lister.'
    : hasPropertyAddress
    ? 'The map opens the property location supplied by the lister.'
    : 'The map shows the approximate neighborhood only because the lister has not added an exact address.'
  const moveInDate = reservation.move_in_date
    ? new Date(reservation.move_in_date).toLocaleDateString('en-KE', { dateStyle: 'long', timeZone: 'UTC' })
    : 'Not specified'

  const info = await mailer.sendMail({
    from: `Nairent <${env.SMTP_FROM}>`,
    to: reservation.guest_email,
    subject: 'Your Nairent reservation was accepted',
    text: `Hi ${reservation.guest_name || 'there'},\n\nYour reservation request for ${reservation.title || 'your selected home'} in ${location} has been accepted.\nPreferred move-in date: ${moveInDate}.\nViewing fee: ${Number(reservation.viewing_fee) > 0 ? `KSh ${Number(reservation.viewing_fee).toLocaleString()}` : 'None'}.\n\n${safeMapNote} ${mapsUrl}\n\nPlease arrange a viewing and verify the property before making any payment. Confirm any viewing fee and payment arrangements directly with the lister. Nairent does not collect viewing fees.`,
    html: `<div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#202d28"><h1 style="color:#184b3a">Your reservation was accepted</h1><p>Hi ${safeGuestName},</p><p>Your reservation request for <strong>${safeTitle}</strong> in <strong>${safeLocation}</strong> has been accepted.</p><p><strong>Preferred move-in date:</strong> ${escapeHtml(moveInDate)}</p><p><strong>Viewing fee:</strong> ${Number(reservation.viewing_fee) > 0 ? `KSh ${Number(reservation.viewing_fee).toLocaleString()}` : 'None'}</p><p style="margin:28px 0"><a href="${mapsUrl.href}" style="background:#184b3a;color:#fff;padding:12px 18px;border-radius:6px;text-decoration:none">Open property location in Google Maps</a></p><p style="font-size:13px;color:#58645f">${escapeHtml(safeMapNote)} Please arrange a viewing and verify the property before making any payment. Confirm any viewing fee and payment arrangements directly with the lister. Nairent does not collect viewing fees.</p></div>`,
  })
  const accepted = (info.accepted || []).some((recipient) => {
    const address = typeof recipient === 'string' ? recipient : recipient.address
    return address?.toLowerCase() === reservation.guest_email.toLowerCase()
  })
  if (!accepted) throw new Error('The email provider did not accept the renter address')
  return true
}

export async function sendNewListingAlertEmail(alert) {
  const mailer = getTransporter()
  if (!mailer) {
    if (env.NODE_ENV === 'production') {
      throw new Error('New listing alert email delivery is not configured')
    }
    console.info('Development listing alert email skipped because SMTP is not configured')
    return false
  }

  const origin = (env.EMAIL_VERIFICATION_ORIGIN || clientOrigins[0]).replace(/\/$/, '')
  const browseUrl = origin + '/#browse'
  const accountUrl = origin + '/#account'
  const rent = Number(alert.monthly_rent).toLocaleString('en-KE')
  const bedrooms = Number(alert.bedrooms) === 0 ? 'Studio' : Number(alert.bedrooms) + ' bedroom'
  const safeName = escapeHtml(alert.full_name || 'there')
  const safeTitle = escapeHtml(alert.title)
  const safeLocation = escapeHtml(alert.location_name)
  const safeBedrooms = escapeHtml(bedrooms)

  const info = await mailer.sendMail({
    from: 'Nairent <' + env.SMTP_FROM + '>',
    to: alert.email,
    subject: 'A new home is available in ' + alert.location_name,
    text: 'Hi ' + (alert.full_name || 'there') + ',\n\n' +
      'A home matching one of your saved searches is now available.\n\n' +
      alert.title + ' in ' + alert.location_name + '\n' +
      'Rent: KSh ' + rent + ' per month\n' +
      'Bedrooms: ' + bedrooms + '\n\n' +
      'Browse the available homes: ' + browseUrl + '\n' +
      'Manage your saved searches and email alerts: ' + accountUrl + '\n\n' +
      'You received this because you enabled email alerts for a saved search.',
    html: '<div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#202d28">' +
      '<h1 style="color:#184b3a">A home matches your search</h1>' +
      '<p>Hi ' + safeName + ',</p>' +
      '<p>A new home matching one of your saved searches is now available.</p>' +
      '<div style="border:1px solid #dce5e0;border-radius:8px;padding:16px;margin:20px 0">' +
      '<strong>' + safeTitle + '</strong><p>' + safeLocation + '</p>' +
      '<p>KSh ' + rent + ' per month · ' + safeBedrooms + '</p></div>' +
      '<p style="margin:24px 0"><a href="' + browseUrl + '" style="background:#184b3a;color:#fff;padding:12px 18px;border-radius:6px;text-decoration:none">Browse homes</a></p>' +
      '<p><a href="' + accountUrl + '">Manage saved searches and email alerts</a></p>' +
      '<p style="font-size:12px;color:#58645f">You received this because you enabled email alerts for a saved search.</p>' +
      '</div>',
  })

  const accepted = (info.accepted || []).some((recipient) => {
    const address = typeof recipient === 'string' ? recipient : recipient.address
    return address?.toLowerCase() === alert.email.toLowerCase()
  })
  if (!accepted) throw new Error('The email provider did not accept the recipient')
  return true
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
    from: `Nairent <${env.SMTP_FROM}>`,
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
    if (env.NODE_ENV === 'production') {
      throw new Error('Inquiry notification email delivery is not configured')
    }
    console.info('Development inquiry notification email skipped because SMTP is not configured')
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
