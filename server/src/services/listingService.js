// Searches approved rentals and recommends alternative neighborhoods.
import { pool } from '../db/pool.js'

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

const listingSelectFields = `
  l.id, l.title, l.description, l.monthly_rent, l.viewing_fee, l.bedrooms, l.amenities, l.created_at,
  l.availability_status, loc.id AS location_id,
  loc.name AS location_name, loc.latitude, loc.longitude, l.property_address,
  l.latitude AS property_latitude, l.longitude AS property_longitude,
  u.full_name AS lister_name, u.email AS lister_email, u.phone AS lister_phone,
  COALESCE(
    json_agg(json_build_object('id', p.id, 'imageUrl', p.image_url)
      ORDER BY p.sort_order) FILTER (WHERE p.id IS NOT NULL),
    '[]'
  ) AS photos
`

export async function getAlternativeRecommendations({ location, minRent, maxRent, bedrooms, availability }) {
  let targetLocation = null

  if (location) {
    const locResult = await pool.query(
      'SELECT id, name, latitude, longitude FROM locations WHERE LOWER(name) = LOWER($1)',
      [location],
    )
    targetLocation = locResult.rows[0] || null
  }

  const values = []
  const conditions = ["l.moderation_status = 'approved'"]

  // Exclude target location so we recommend alternative close neighborhoods
  if (targetLocation) {
    values.push(targetLocation.id)
    conditions.push(`l.location_id <> $${values.length}`)
  }

  const refPrice = maxRent !== undefined ? Number(maxRent) : minRent !== undefined ? Number(minRent) : null

  if (minRent !== undefined) {
    values.push(minRent)
    conditions.push('l.monthly_rent >= $' + values.length)
  }

  if (maxRent !== undefined) {
    values.push(maxRent)
    conditions.push('l.monthly_rent <= $' + values.length)
  }

  if (bedrooms !== undefined) {
    values.push(bedrooms)
    conditions.push('l.bedrooms >= $' + values.length)
  }

  if (availability) {
    if (availability === 'available_this_month') {
      conditions.push(`l.availability_status IN ('available', 'available_this_month')`)
    } else {
      values.push(availability)
      conditions.push(`l.availability_status = $${values.length}`)
    }
  }

  const result = await pool.query(
    `SELECT ${listingSelectFields}
     FROM listings l
     JOIN users u ON u.id = l.owner_id
     JOIN locations loc ON loc.id = l.location_id
     LEFT JOIN listing_photos p ON p.listing_id = l.id
     WHERE ${conditions.join(' AND ')}
     GROUP BY l.id, loc.id, u.id
     ORDER BY l.created_at DESC
     LIMIT 30`,
    values,
  )

  const recommendations = result.rows.map((row) => {
    const distanceKm = targetLocation && targetLocation.latitude && row.latitude
      ? calculateDistanceKm(targetLocation.latitude, targetLocation.longitude, row.latitude, row.longitude)
      : null

    const rentNum = Number(row.monthly_rent)
    let priceBadge = ''
    if (refPrice !== null && refPrice > 0) {
      const diff = rentNum - refPrice
      const pct = Math.round((diff / refPrice) * 100)
      if (pct === 0) {
        priceBadge = 'Exact budget match'
      } else if (pct > 0) {
        priceBadge = `+${pct}% (KSh +${diff.toLocaleString()})`
      } else {
        priceBadge = `${pct}% (KSh ${diff.toLocaleString()})`
      }
    }

    let recommendationReason = targetLocation
      ? `Close neighborhood: ${row.location_name}`
      : `Matching area: ${row.location_name}`
    if (distanceKm !== null && targetLocation) {
      recommendationReason = `Close neighborhood: ${row.location_name} (~${distanceKm} km from ${targetLocation.name})`
    }

    return {
      ...row,
      isRecommendation: true,
      distanceKm,
      priceBadge,
      recommendationReason,
    }
  })

  // Priority sorting: Closest neighborhood first by geographic proximity (distanceKm ASC), then closest price match
  if (targetLocation && targetLocation.latitude) {
    recommendations.sort((a, b) => {
      if (a.distanceKm !== null && b.distanceKm !== null) {
        if (a.distanceKm !== b.distanceKm) return a.distanceKm - b.distanceKm
      } else if (a.distanceKm !== null) {
        return -1
      } else if (b.distanceKm !== null) {
        return 1
      }
      if (refPrice !== null) {
        return Math.abs(a.monthly_rent - refPrice) - Math.abs(b.monthly_rent - refPrice)
      }
      return a.monthly_rent - b.monthly_rent
    })
  } else if (refPrice !== null) {
    recommendations.sort((a, b) => Math.abs(a.monthly_rent - refPrice) - Math.abs(b.monthly_rent - refPrice))
  } else {
    recommendations.sort((a, b) => a.monthly_rent - b.monthly_rent)
  }

  // Keep the renter's budget and minimum bedroom count while changing neighborhoods.
  return recommendations.slice(0, 5)
}

export async function searchListings({ location, minRent, maxRent, bedrooms, availability, limit, availableOnly }) {
  const values = []
  const conditions = ["l.moderation_status = 'approved'"]

  if (availableOnly === 'true') {
    conditions.push("l.availability_status IN ('available', 'available_this_month')")
  }

  // 1. Search priority: exact location match
  if (location) {
    values.push(location)
    conditions.push(`LOWER(loc.name) = LOWER($${values.length})`)
  }
  if (minRent !== undefined) {
    values.push(minRent)
    conditions.push(`l.monthly_rent >= $${values.length}`)
  }
  if (maxRent !== undefined) {
    values.push(maxRent)
    conditions.push(`l.monthly_rent <= $${values.length}`)
  }
  if (bedrooms !== undefined) {
    values.push(bedrooms)
    conditions.push(`l.bedrooms >= $${values.length}`)
  }
  if (availability) {
    if (availability === 'available_this_month') {
      conditions.push(`l.availability_status IN ('available', 'available_this_month')`)
    } else {
      values.push(availability)
      conditions.push(`l.availability_status = $${values.length}`)
    }
  }

  const limitClause = limit ? ` LIMIT $${values.push(limit)}` : ''

  const result = await pool.query(
    `SELECT ${listingSelectFields}
     FROM listings l
     JOIN users u ON u.id = l.owner_id
     JOIN locations loc ON loc.id = l.location_id
     LEFT JOIN listing_photos p ON p.listing_id = l.id
     WHERE ${conditions.join(' AND ')}
     GROUP BY l.id, loc.id, u.id
     ORDER BY l.created_at DESC${limitClause}`,
    values,
  )

  // 2. If query criteria is not met in that location (0 matches), fetch close neighborhood alternatives (+/- 5% price range)
  let recommendations = []
  if (result.rows.length === 0 && (location || maxRent !== undefined || bedrooms !== undefined)) {
    recommendations = await getAlternativeRecommendations({ location, minRent, maxRent, bedrooms, availability })
  }

  return {
    listings: result.rows,
    recommendations,
  }
}

export async function getListingById(listingId) {
  const result = await pool.query(
    `SELECT ${listingSelectFields}
     FROM listings l
     JOIN users u ON u.id = l.owner_id
     JOIN locations loc ON loc.id = l.location_id
     LEFT JOIN listing_photos p ON p.listing_id = l.id
     WHERE l.id = $1 AND l.moderation_status = 'approved'
     GROUP BY l.id, loc.id, u.id`,
    [listingId],
  )
  return result.rows[0] ?? null
}
