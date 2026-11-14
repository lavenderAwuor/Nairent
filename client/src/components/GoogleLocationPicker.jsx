// Lets listers choose and save the exact property point on a Google Map.
import { useEffect, useRef, useState } from 'react'
import { googleMapsApiKey, googleMapsMapId, loadGoogleMapsApi } from './googleMapsApi.js'

const defaultNairobiCenter = { lat: -1.286389, lng: 36.817223 }

// Converts coordinate field values into a validated map point.
function readPoint(latitude, longitude) {
  const lat = Number(latitude)
  const lng = Number(longitude)
  return latitude !== '' && longitude !== '' && Number.isFinite(lat) && Number.isFinite(lng)
    ? { lat, lng }
    : null
}

// Reads a draggable map marker position into form field strings.
function pointFromMarker(marker) {
  const position = marker.position
  return {
    latitude: String(typeof position.lat === 'function' ? position.lat() : position.lat),
    longitude: String(typeof position.lng === 'function' ? position.lng() : position.lng),
  }
}

// Shows a map pin selector and coordinate entry fallback for each property.
export default function GoogleLocationPicker({ latitude, longitude, centerLatitude, centerLongitude, onChange }) {
  const mapElement = useRef(null)
  const mapRef = useRef(null)
  const markerRef = useRef(null)
  const markerClassRef = useRef(null)
  const mapClickListenerRef = useRef(null)
  const onChangeRef = useRef(onChange)
  const selectedRef = useRef({ latitude, longitude, centerLatitude, centerLongitude })
  const [mapState, setMapState] = useState({ loading: Boolean(googleMapsApiKey), error: '' })

  useEffect(() => {
    onChangeRef.current = onChange
    selectedRef.current = { latitude, longitude, centerLatitude, centerLongitude }
  }, [onChange, latitude, longitude, centerLatitude, centerLongitude])

  useEffect(() => {
    if (!googleMapsApiKey || !mapElement.current) return undefined
    let active = true

    async function initializeMap() {
      try {
        const maps = await loadGoogleMapsApi()
        const [{ Map }, { AdvancedMarkerElement }] = await Promise.all([
          maps.importLibrary('maps'),
          maps.importLibrary('marker'),
        ])
        if (!active || !mapElement.current) return

        const current = selectedRef.current
        const selectedPoint = readPoint(current.latitude, current.longitude)
        const locationCenter = readPoint(current.centerLatitude, current.centerLongitude)
        const map = new Map(mapElement.current, {
          center: selectedPoint || locationCenter || defaultNairobiCenter,
          zoom: selectedPoint ? 18 : locationCenter ? 14 : 12,
          mapId: googleMapsMapId,
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: true,
        })
        mapRef.current = map
        markerClassRef.current = AdvancedMarkerElement

        const setSelectedPoint = (point) => {
          if (!markerRef.current) {
            markerRef.current = new AdvancedMarkerElement({
              map,
              position: point,
              gmpDraggable: true,
              title: 'Exact property location',
            })
            markerRef.current.addEventListener('gmp-dragend', () => {
              onChangeRef.current(pointFromMarker(markerRef.current))
            })
          } else {
            markerRef.current.position = point
            markerRef.current.map = map
          }
          onChangeRef.current({ latitude: String(point.lat), longitude: String(point.lng) })
        }

        const initialPoint = readPoint(current.latitude, current.longitude)
        if (initialPoint) {
          markerRef.current = new AdvancedMarkerElement({
            map,
            position: initialPoint,
            gmpDraggable: true,
            title: 'Exact property location',
          })
          markerRef.current.addEventListener('gmp-dragend', () => {
            onChangeRef.current(pointFromMarker(markerRef.current))
          })
        }
        mapClickListenerRef.current = map.addListener('click', (event) => {
          if (event.latLng) setSelectedPoint({ lat: event.latLng.lat(), lng: event.latLng.lng() })
        })
        if (active) setMapState({ loading: false, error: '' })
      } catch (error) {
        if (active) setMapState({ loading: false, error: error.message })
      }
    }

    let observer
    if ('IntersectionObserver' in window) {
      observer = new IntersectionObserver((entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          observer.disconnect()
          void initializeMap()
        }
      }, { rootMargin: '120px' })
      observer.observe(mapElement.current)
    } else {
      void initializeMap()
    }
    return () => {
      active = false
      observer?.disconnect()
      mapClickListenerRef.current?.remove()
      mapClickListenerRef.current = null
      if (markerRef.current) markerRef.current.map = null
      markerRef.current = null
      markerClassRef.current = null
      mapRef.current = null
    }
  }, [])

  useEffect(() => {
    const map = mapRef.current
    const Marker = markerClassRef.current
    if (!map || !Marker) return

    const point = readPoint(latitude, longitude)
    if (point) {
      if (!markerRef.current) {
        markerRef.current = new Marker({
          map,
          position: point,
          gmpDraggable: true,
          title: 'Exact property location',
        })
        markerRef.current.addEventListener('gmp-dragend', () => {
          onChangeRef.current(pointFromMarker(markerRef.current))
        })
      } else {
        markerRef.current.position = point
        markerRef.current.map = map
      }
    } else if (markerRef.current) {
      markerRef.current.map = null
      markerRef.current = null
    }

    const center = readPoint(centerLatitude, centerLongitude) || defaultNairobiCenter
    map.setCenter(point || center)
    map.setZoom(point ? 18 : centerLatitude && centerLongitude ? 14 : 12)
  }, [latitude, longitude, centerLatitude, centerLongitude])

  function updateCoordinate(name, value) {
    onChange({
      latitude: name === 'latitude' ? value : latitude,
      longitude: name === 'longitude' ? value : longitude,
    })
  }

  return (
    <fieldset className="grid gap-3 sm:col-span-2">
      <legend className="text-sm font-medium text-ink">Choose the exact property point *</legend>
      <p className="text-xs leading-relaxed text-ink-muted">Click the property on the map or drag the pin onto it. Renters will see this pin when they open the listing.</p>
      {googleMapsApiKey ? (
        <div className="relative">
          <div ref={mapElement} className="h-72 w-full overflow-hidden rounded-xl border border-border bg-page" aria-label="Google Map location picker" />
          {mapState.loading && <p className="absolute inset-0 flex items-center justify-center rounded-xl bg-page/90 px-5 text-center text-sm text-ink-muted">Loading Google Maps…</p>}
          {mapState.error && <p className="absolute inset-0 flex items-center justify-center rounded-xl bg-page/95 px-5 text-center text-sm text-ink-muted">Map preview unavailable. You can still set the exact coordinates below.</p>}
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-page p-4 text-sm text-ink-muted">
          <p className="font-medium text-ink">Set the property pin</p>
          <p className="mt-1 text-xs leading-relaxed">Open the map to find the property, then enter its latitude and longitude below. On Google Maps, right-click the point to copy its coordinates.</p>
          <a href="https://www.google.com/maps" target="_blank" rel="noreferrer" className="mt-2 inline-block text-xs font-semibold text-brand underline">Open map</a>
        </div>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-xs font-medium text-ink-muted">
          Latitude *
          <input required type="number" min="-90" max="90" step="any" value={latitude} onChange={(event) => updateCoordinate('latitude', event.target.value)} placeholder="-1.286389" className="h-10 rounded-lg border border-border px-3 text-sm text-ink" />
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-ink-muted">
          Longitude *
          <input required type="number" min="-180" max="180" step="any" value={longitude} onChange={(event) => updateCoordinate('longitude', event.target.value)} placeholder="36.817223" className="h-10 rounded-lg border border-border px-3 text-sm text-ink" />
        </label>
      </div>
      {googleMapsApiKey && !mapState.loading && !mapState.error && (
        <p className="text-xs text-ink-muted">{latitude && longitude ? `Selected point: ${Number(latitude).toFixed(6)}, ${Number(longitude).toFixed(6)}` : 'No pin selected yet.'}</p>
      )}
    </fieldset>
  )
}
