const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'

async function request(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  })
  const body = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(body.error || 'Something went wrong')
  return body
}

export function getToken() {
  return window.localStorage.getItem('nairent_token')
}

export function saveToken(token) {
  window.localStorage.setItem('nairent_token', token)
}

export function clearToken() {
  window.localStorage.removeItem('nairent_token')
}

export function getCurrentUser() {
  return request('/auth/me', { headers: { Authorization: `Bearer ${getToken()}` } })
}

export function login(input) {
  return request('/auth/login', { method: 'POST', body: JSON.stringify(input) })
}

export function register(input) {
  return request('/auth/register', { method: 'POST', body: JSON.stringify(input) })
}

export function getMyListings() {
  return request('/lister/listings', { headers: { Authorization: `Bearer ${getToken()}` } })
}

export function createListing(input) {
  return request('/lister/listings', {
    method: 'POST',
    body: JSON.stringify(input),
    headers: { Authorization: `Bearer ${getToken()}` },
  })
}

export function updateListing(id, input) {
  return request(`/lister/listings/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
    headers: { Authorization: `Bearer ${getToken()}` },
  })
}

export function updateListingAvailability(id, availability) {
  return request(`/lister/listings/${id}/availability`, {
    method: 'PATCH',
    body: JSON.stringify({ availability }),
    headers: { Authorization: `Bearer ${getToken()}` },
  })
}

export function deleteListing(id) {
  return request(`/lister/listings/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${getToken()}` },
  })
}

export async function uploadPhotos(files) {
  const formData = new FormData()
  files.forEach((file) => formData.append('photos', file))
  const response = await fetch(`${API_URL}/lister/uploads`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${getToken()}` },
    body: formData,
  })
  const body = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(body.error || 'Photo upload failed')
  return body
}

export function searchListings(filters = {}) {
  const params = new URLSearchParams(Object.entries(filters).filter(([, value]) => value))
  return request(`/listings?${params}`)
}

export function listLocations() {
  return request('/locations')
}

export function requestAppointment(input) {
  return request('/appointments', {
    method: 'POST',
    body: JSON.stringify(input),
    headers: { Authorization: `Bearer ${getToken()}` },
  })
}

export function reserveListing(input) {
  return request('/reservations', { method: 'POST', body: JSON.stringify(input) })
}
