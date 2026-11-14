// Shares Google Maps browser settings and loads the JavaScript API once per page.
export const googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY?.trim()
export const googleMapsMapId = import.meta.env.VITE_GOOGLE_MAPS_MAP_ID?.trim() || 'DEMO_MAP_ID'
let mapsApiLoadPromise

// Loads the shared Google Maps JavaScript API script once per page.
export function loadGoogleMapsApi() {
  if (window.google?.maps?.importLibrary) return Promise.resolve(window.google.maps)
  if (mapsApiLoadPromise) return mapsApiLoadPromise

  mapsApiLoadPromise = new Promise((resolve, reject) => {
    const callbackName = '__nairentGoogleMapsLoaded'
    const script = document.createElement('script')
    const scriptUrl = new URL('https://maps.googleapis.com/maps/api/js')
    scriptUrl.searchParams.set('key', googleMapsApiKey)
    scriptUrl.searchParams.set('callback', callbackName)
    scriptUrl.searchParams.set('libraries', 'marker')
    scriptUrl.searchParams.set('loading', 'async')
    scriptUrl.searchParams.set('v', 'weekly')

    window[callbackName] = () => {
      delete window[callbackName]
      resolve(window.google.maps)
    }
    script.async = true
    script.src = scriptUrl.toString()
    script.onerror = () => {
      delete window[callbackName]
      mapsApiLoadPromise = null
      reject(new Error('Google Maps could not load. Check the browser API key and Maps JavaScript API settings.'))
    }
    document.head.append(script)
  })
  return mapsApiLoadPromise
}
