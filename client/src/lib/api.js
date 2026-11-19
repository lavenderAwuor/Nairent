// Sends frontend requests to the API and attaches the saved login token.
const API_URL = import.meta.env.VITE_API_URL || '/api'

async function request(path, options = {}) {
  let response
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
    })
  } catch {
    throw new Error('Cannot reach the Nairent API. Start the server or check VITE_API_URL.')
  }

  if (response.status === 204) return null

  const contentType = response.headers.get('content-type') || ''
  if (!contentType.includes('application/json')) {
    const responseType = contentType.split(';')[0] || 'no content type'
    const error = new Error(`API request ${path} returned HTTP ${response.status} as ${responseType}. Check that the server is running and VITE_API_URL points to the API.`)
    error.status = response.status
    throw error
  }
  const body = await response.json().catch(() => ({}))
  if (!response.ok) {
    const error = new Error(body.error || `Request failed (${response.status})`)
    error.code = body.code
    error.status = response.status
    throw error
  }
  return body
}

export function getToken() {
  return window.localStorage.getItem('nairent_token')
}

function authHeaders() {
  const token = getToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export function saveToken(token) {
  window.localStorage.setItem('nairent_token', token)
}

export function clearToken() {
  window.localStorage.removeItem('nairent_token')
}

export function getCurrentUser() {
  return request('/auth/me', { headers: authHeaders() })
}

export function updateMyProfile(input) {
  return request('/auth/me', {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify(input),
  })
}

export function login(input) {
  return request('/auth/login', { method: 'POST', body: JSON.stringify(input) })
}

export function register(input) {
  return request('/auth/register', { method: 'POST', body: JSON.stringify(input) })
}

export function getMyListings() {
  return request('/lister/listings', { headers: authHeaders() })
}

export function getMyListerAppointments() {
  return request('/lister/appointments', { headers: authHeaders() })
}

export function updateAppointmentStatus(id, status) {
  return request(`/lister/appointments/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
    headers: authHeaders(),
  })
}

export function getMyReservations() {
  return request('/lister/reservations', { headers: authHeaders() })
}

export function getMyAppointments() {
  return request('/appointments/mine', { headers: authHeaders() })
}

export function getSavedSearches() {
  return request('/saved-searches', { headers: authHeaders() })
}

export function createSavedSearch(input) {
  return request('/saved-searches', {
    method: 'POST',
    body: JSON.stringify(input),
    headers: authHeaders(),
  })
}

export function deleteSavedSearch(id) {
  return request(`/saved-searches/${id}`, { method: 'DELETE', headers: authHeaders() })
}

export function updateReservationStatus(id, status) {
  return request(`/lister/reservations/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
    headers: authHeaders(),
  })
}

export function createListing(input) {
  return request('/lister/listings', {
    method: 'POST',
    body: JSON.stringify(input),
    headers: authHeaders(),
  })
}

export function updateListing(id, input) {
  return request(`/lister/listings/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
    headers: authHeaders(),
  })
}

export function updateListingAvailability(id, availability) {
  return request(`/lister/listings/${id}/availability`, {
    method: 'PATCH',
    body: JSON.stringify({ availability }),
    headers: authHeaders(),
  })
}

export function deleteListing(id) {
  return request(`/lister/listings/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  })
}

export async function uploadPhotos(files, onProgress) {
  const photoUrls = []
  const filesPerBatch = 8

  for (let offset = 0; offset < files.length; offset += filesPerBatch) {
    const batch = files.slice(offset, offset + filesPerBatch)
    const formData = new FormData()
    batch.forEach((file) => formData.append('photos', file))

    let response
    try {
      response = await fetch(`${API_URL}/lister/uploads`, {
        method: 'POST',
        headers: authHeaders(),
        body: formData,
      })
    } catch (error) {
      error.uploadedPhotoUrls = photoUrls
      error.uploadedFileCount = offset
      throw error
    }

    const body = await response.json().catch(() => ({}))
    if (!response.ok) {
      const error = new Error(body.error || 'Photo upload failed')
      error.uploadedPhotoUrls = photoUrls
      error.uploadedFileCount = offset
      throw error
    }

    photoUrls.push(...(Array.isArray(body.photoUrls) ? body.photoUrls : []))
    onProgress?.(photoUrls.length, files.length)
  }

  return { photoUrls }
}

export function searchListings(filters = {}) {
  const params = new URLSearchParams(Object.entries(filters).filter(([, value]) => value !== '' && value !== undefined))
  return request(`/listings?${params}`)
}

// Loads the newest approved homes used by the landing page.
export async function getFeaturedListings() {
  // Uses the stable search route so older API processes never treat a static path as a UUID.
  const result = await searchListings({ limit: 3, availableOnly: 'true' })
  const listings = (result.listings || []).filter((listing) => ['available', 'available_this_month'].includes(listing.availability_status))
  return { listings: listings.slice(0, 3) }
}

// Loads a single approved home for links that open its details directly.
export function getListingById(id) {
  return request(`/listings/${encodeURIComponent(id)}`)
}

export function getAlternativeRecommendations(filters = {}) {
  const params = new URLSearchParams(Object.entries(filters).filter(([, value]) => value !== '' && value !== undefined))
  return request(`/listings/recommendations?${params}`)
}

export function listLocations() {
  return request('/locations')
}

export function requestAppointment(input) {
  return request('/appointments', {
    method: 'POST',
    body: JSON.stringify(input),
    headers: authHeaders(),
  })
}

export function reserveListing(input) {
  return request('/reservations', { method: 'POST', body: JSON.stringify(input) })
}

export function sendInquiry(input) {
  return request('/inquiries', {
    method: 'POST',
    body: JSON.stringify(input),
    headers: authHeaders(),
  })
}

export function getMyTenantInquiries() {
  return request('/inquiries/mine', { headers: authHeaders() })
}

export function getMyListerInquiries() {
  return request('/inquiries/lister', { headers: authHeaders() })
}

export function getAdminListings(status) {
  const params = status ? `?status=${status}` : ''
  return request(`/admin/listings${params}`, { headers: authHeaders() })
}

export function updateListingModeration(id, status) {
  return request(`/admin/listings/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
    headers: authHeaders(),
  })
}

export function getAdminStats() {
  return request('/admin/stats', { headers: authHeaders() })
}
export function deleteListingByAdmin(id) {
  return request(`/admin/listings/${id}`, { method: 'DELETE', headers: authHeaders() })
}

export function getAdminUsers() {
  return request('/admin/users', { headers: authHeaders() })
}

export function updateUserRoleByAdmin(id, role) {
  return request(`/admin/users/${id}/role`, {
    method: 'PATCH',
    body: JSON.stringify({ role }),
    headers: authHeaders(),
  })
}

export function deleteUserByAdmin(id) {
  return request(`/admin/users/${id}`, { method: 'DELETE', headers: authHeaders() })
}

export function getAdminAppointments() {
  return request('/admin/appointments', { headers: authHeaders() })
}

export function getAdminReservations() {
  return request('/admin/reservations', { headers: authHeaders() })
}

export function getAdminInquiries() {
  return request('/admin/inquiries', { headers: authHeaders() })
}

// Sends public support messages and manages them in the administrator inbox.
export function createSupportRequest(input) {
  return request('/support', { method: 'POST', body: JSON.stringify(input) })
}

export function getAdminSupportRequests() {
  return request('/admin/support', { headers: authHeaders() })
}

export function updateAdminSupportRequestStatus(id, status) {
  return request(`/admin/support/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
    headers: authHeaders(),
  })
}
