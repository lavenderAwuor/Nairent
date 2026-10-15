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
