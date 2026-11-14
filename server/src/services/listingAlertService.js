// Queues, sends, and retries emails for matching saved searches.
import { pool } from '../db/pool.js'
import { clearInterval, setInterval } from 'node:timers'
import { sendNewListingAlertEmail } from './emailService.js'

export async function queueListingAlerts(client, listingId) {
  return client.query(
    'INSERT INTO listing_alert_outbox (tenant_id, saved_search_id, listing_id) ' +
    'SELECT DISTINCT ON (s.tenant_id, l.id) s.tenant_id, s.id, l.id ' +
    'FROM listings l ' +
    'JOIN saved_searches s ON s.notify_new_listings = TRUE ' +
    'JOIN users u ON u.id = s.tenant_id ' +
    'WHERE l.id = $1 AND l.moderation_status = \'approved\' ' +
    'AND l.availability_status IN (\'available\', \'available_this_month\') ' +
    'AND u.email_verified_at IS NOT NULL ' +
    'AND (s.location_id IS NULL OR s.location_id = l.location_id) ' +
    'AND (s.min_rent IS NULL OR l.monthly_rent >= s.min_rent) ' +
    'AND (s.max_rent IS NULL OR l.monthly_rent <= s.max_rent) ' +
    'AND (s.bedrooms IS NULL OR l.bedrooms >= s.bedrooms) ' +
    'AND (s.availability_status IS NULL ' +
    '  OR s.availability_status = l.availability_status ' +
    '  OR (s.availability_status = \'available_this_month\' AND l.availability_status = \'available\')) ' +
    'ORDER BY s.tenant_id, l.id, s.created_at ASC ' +
    'ON CONFLICT (tenant_id, listing_id) DO NOTHING',
    [listingId],
  )
}

async function claimNextAlert() {
  const result = await pool.query(
    'WITH candidate AS (' +
    '  SELECT id FROM listing_alert_outbox ' +
    '  WHERE available_at <= NOW() AND (' +
    '    status = \'pending\' OR (status = \'sending\' AND locked_at < NOW() - INTERVAL \'5 minutes\')' +
    '  ) ORDER BY created_at LIMIT 1 FOR UPDATE SKIP LOCKED' +
    ') ' +
    'UPDATE listing_alert_outbox AS outbox ' +
    'SET status = \'sending\', locked_at = NOW(), attempt_count = attempt_count + 1 ' +
    'FROM candidate WHERE outbox.id = candidate.id ' +
    'RETURNING outbox.id',
  )
  return result.rows[0]?.id ?? null
}

async function loadAlertDetails(alertId) {
  const result = await pool.query(
    'SELECT outbox.id, outbox.tenant_id, u.email, u.full_name, ' +
    'l.id AS listing_id, l.title, l.monthly_rent, l.bedrooms, l.availability_status, ' +
    'loc.name AS location_name, ' +
    'EXISTS (' +
    '  SELECT 1 FROM saved_searches s ' +
    '  WHERE s.tenant_id = outbox.tenant_id AND s.notify_new_listings = TRUE ' +
    '    AND (s.location_id IS NULL OR s.location_id = l.location_id) ' +
    '    AND (s.min_rent IS NULL OR l.monthly_rent >= s.min_rent) ' +
    '    AND (s.max_rent IS NULL OR l.monthly_rent <= s.max_rent) ' +
    '    AND (s.bedrooms IS NULL OR l.bedrooms >= s.bedrooms) ' +
    '    AND (s.availability_status IS NULL ' +
    '      OR s.availability_status = l.availability_status ' +
    '      OR (s.availability_status = \'available_this_month\' AND l.availability_status = \'available\'))' +
    ') AS still_subscribed ' +
    'FROM listing_alert_outbox outbox ' +
    'JOIN users u ON u.id = outbox.tenant_id ' +
    'JOIN listings l ON l.id = outbox.listing_id ' +
    'JOIN locations loc ON loc.id = l.location_id ' +
    'WHERE outbox.id = $1 AND u.email_verified_at IS NOT NULL ' +
    'AND l.moderation_status = \'approved\' ' +
    'AND l.availability_status IN (\'available\', \'available_this_month\')',
    [alertId],
  )
  return result.rows[0] ?? null
}

async function markAlertCancelled(alertId) {
  await pool.query(
    'UPDATE listing_alert_outbox SET status = \'cancelled\', locked_at = NULL WHERE id = $1',
    [alertId],
  )
}

async function markAlertSent(alertId) {
  await pool.query(
    'UPDATE listing_alert_outbox SET status = \'sent\', sent_at = NOW(), locked_at = NULL, last_error = NULL WHERE id = $1',
    [alertId],
  )
}

async function retryAlert(alertId, error) {
  await pool.query(
    'UPDATE listing_alert_outbox ' +
    'SET status = CASE WHEN attempt_count >= 10 THEN \'failed\' ELSE \'pending\' END, ' +
    'available_at = NOW() + make_interval(secs => LEAST(3600, 30 * POWER(2::numeric, LEAST(attempt_count, 7))::integer)), ' +
    'locked_at = NULL, last_error = $2 ' +
    'WHERE id = $1',
    [alertId, String(error?.message || 'Email delivery failed').slice(0, 1000)],
  )
}

export async function processListingAlertBatch() {
  for (let sent = 0; sent < 20; sent += 1) {
    const alertId = await claimNextAlert()
    if (!alertId) return

    try {
      const alert = await loadAlertDetails(alertId)
      if (!alert || !alert.still_subscribed) {
        await markAlertCancelled(alertId)
        continue
      }

      const accepted = await sendNewListingAlertEmail(alert)
      if (!accepted) throw new Error('The email provider did not accept the recipient')
      await markAlertSent(alertId)
    } catch (error) {
      await retryAlert(alertId, error)
      console.error('New listing alert delivery failed:', error.code || error.name || 'unknown error')
    }
  }
}

export function startListingAlertWorker() {
  let running = false
  const run = async () => {
    if (running) return
    running = true
    try {
      await processListingAlertBatch()
    } catch (error) {
      console.error('New listing alert worker failed:', error.code || error.name || 'unknown error')
    } finally {
      running = false
    }
  }

  void run()
  const interval = setInterval(() => { void run() }, 10_000)
  interval.unref()
  return () => clearInterval(interval)
}
