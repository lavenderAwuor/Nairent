// Shows renters the precise point selected by the lister.
import { useEffect, useRef, useState } from 'react'
import { googleMapsApiKey, googleMapsMapId, loadGoogleMapsApi } from './googleMapsApi.js'

export default function GoogleMapDisplay({ latitude, longitude, title }) {
  const mapElement = useRef(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!googleMapsApiKey || !mapElement.current) return undefined
    let active = true
    let marker

    // Centers a renter-facing map on the lister-selected coordinates and places its marker.
    async function showLocation() {
      try {
        const maps = await loadGoogleMapsApi()
        const [{ Map }, { AdvancedMarkerElement }] = await Promise.all([
          maps.importLibrary('maps'),
          maps.importLibrary('marker'),
        ])
        if (!active || !mapElement.current) return
        const point = { lat: Number(latitude), lng: Number(longitude) }
        const map = new Map(mapElement.current, {
          center: point,
          zoom: 18,
          mapId: googleMapsMapId,
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: true,
        })
        marker = new AdvancedMarkerElement({
          map,
          position: point,
          title: title || 'Property location',
        })
      } catch (mapError) {
        if (active) setError(mapError.message)
      }
    }

    void showLocation()
    return () => {
      active = false
      if (marker) marker.map = null
    }
  }, [latitude, longitude, title])

  return (
    <div className="relative mt-3 h-56 w-full overflow-hidden rounded-xl border border-border bg-page">
      <div ref={mapElement} className="h-full w-full" aria-label={`Google Map showing ${title || 'the property location'}`} />
      {error && <p className="absolute inset-0 flex items-center justify-center bg-page/95 p-5 text-center text-sm text-red-700" role="alert">{error}</p>}
    </div>
  )
}
