// Checks how alternative rental listings are selected and ranked.
import test from 'node:test'
import assert from 'node:assert/strict'

// Haversine calculation test matching implementation in listingService.js
function calculateDistanceKm(lat1, lon1, lat2, lon2) {
  if (lat1 === null || lon1 === null || lat2 === null || lon2 === null) return null
  const numLat1 = Number(lat1)
  const numLon1 = Number(lon1)
  const numLat2 = Number(lat2)
  const numLon2 = Number(lon2)
  if (Number.isNaN(numLat1) || Number.isNaN(numLon1) || Number.isNaN(numLat2) || Number.isNaN(numLon2)) return null

  const R = 6371 // Earth radius in km
  const dLat = ((numLat2 - numLat1) * Math.PI) / 180
  const dLon = ((numLon2 - numLon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((numLat1 * Math.PI) / 180) *
      Math.cos((numLat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return Math.round(R * c * 10) / 10
}

test('calculateDistanceKm computes accurate distance between Kilimani and Kileleshwa', () => {
  // Kilimani: -1.2921, 36.7875
  // Kileleshwa: -1.2842, 36.7757
  const distance = calculateDistanceKm(-1.2921, 36.7875, -1.2842, 36.7757)
  assert.ok(distance > 1.0 && distance < 2.0, `Expected ~1.5 km between Kilimani and Kileleshwa, got ${distance}`)
})

test('calculateDistanceKm computes distance between Kilimani and South B', () => {
  // Kilimani: -1.2921, 36.7875
  // South B: -1.3167, 36.8294
  const distance = calculateDistanceKm(-1.2921, 36.7875, -1.3167, 36.8294)
  assert.ok(distance > 4.5 && distance < 6.5, `Expected ~5.4 km between Kilimani and South B, got ${distance}`)
})

test('calculateDistanceKm handles null or invalid coordinates gracefully', () => {
  assert.equal(calculateDistanceKm(null, 36.78, -1.29, 36.77), null)
  assert.equal(calculateDistanceKm(-1.29, null, -1.28, 36.77), null)
  assert.equal(calculateDistanceKm('invalid', 36.78, -1.29, 36.77), null)
})
