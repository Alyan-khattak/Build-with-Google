import { useEffect, useRef, useState } from 'react'
import BottomNav from '../components/BottomNav'

interface Position {
  lat: number
  lng: number
  accuracy: number
}

export default function LiveMapPage() {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const markerRef = useRef<any>(null)
  const circleRef = useRef<any>(null)
  const [pos, setPos] = useState<Position | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [leafletReady, setLeafletReady] = useState(false)

  const recenterToMe = () => {
    const map = mapInstanceRef.current
    if (!map) return
    // Leaflet loses container dimensions on React re-renders — recalculate before panning
    map.invalidateSize()
    if (pos) {
      map.setView([pos.lat, pos.lng], 17)
    } else if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        ({ coords }) => {
          setPos({ lat: coords.latitude, lng: coords.longitude, accuracy: coords.accuracy })
          map.invalidateSize()
          map.setView([coords.latitude, coords.longitude], 17)
        },
        () => setError('Could not get your location. Check browser permissions.')
      )
    }
  }

  // Load Leaflet CSS + JS from CDN once
  useEffect(() => {
    if ((window as any).L) { setLeafletReady(true); return }
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
    document.head.appendChild(link)
    const script = document.createElement('script')
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
    script.onload = () => setLeafletReady(true)
    document.head.appendChild(script)
  }, [])

  // Init map once Leaflet is ready
  useEffect(() => {
    if (!leafletReady || !mapRef.current || mapInstanceRef.current) return
    const L = (window as any).L
    const map = L.map(mapRef.current, { zoomControl: true }).setView([24.8607, 67.0011], 15)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
    }).addTo(map)
    mapInstanceRef.current = map
  }, [leafletReady])

  // Watch position
  useEffect(() => {
    if (!navigator.geolocation) { setError('Geolocation not available on this device.'); return }
    const id = navigator.geolocation.watchPosition(
      ({ coords }) => {
        setPos({ lat: coords.latitude, lng: coords.longitude, accuracy: coords.accuracy })
        setError(null)
      },
      () => setError('Location access denied. Enable location to see yourself on the map.'),
      { enableHighAccuracy: true, maximumAge: 5000 }
    )
    return () => navigator.geolocation.clearWatch(id)
  }, [])

  // Update map marker when position changes
  useEffect(() => {
    if (!pos || !mapInstanceRef.current) return
    const L = (window as any).L
    const map = mapInstanceRef.current

    // Blue dot icon
    const dot = L.divIcon({
      className: '',
      html: `<div style="width:16px;height:16px;border-radius:50%;background:#3b82f6;border:3px solid white;box-shadow:0 0 0 4px rgba(59,130,246,0.3)"></div>`,
      iconSize: [16, 16],
      iconAnchor: [8, 8],
    })

    if (markerRef.current) {
      markerRef.current.setLatLng([pos.lat, pos.lng])
      circleRef.current?.setLatLng([pos.lat, pos.lng]).setRadius(pos.accuracy)
    } else {
      markerRef.current = L.marker([pos.lat, pos.lng], { icon: dot })
        .addTo(map)
        .bindPopup('<b>You are here</b>')
      circleRef.current = L.circle([pos.lat, pos.lng], {
        radius: pos.accuracy,
        color: '#3b82f6',
        fillColor: '#3b82f6',
        fillOpacity: 0.1,
        weight: 1,
      }).addTo(map)
      map.setView([pos.lat, pos.lng], 16)
    }
  }, [pos])

  return (
    <div className="min-h-screen bg-gray-950 text-white pb-24 flex flex-col">
      <div className="px-4 pt-8 pb-4 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">Live Map</h1>
          <p className="text-sm text-gray-400 mt-1">Your current location</p>
        </div>
        <button
          onClick={recenterToMe}
          className="mt-1 flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-sm font-medium transition-colors"
          title="Center map on my location"
        >
          📍 My Location
        </button>
      </div>

      {error && (
        <div className="mx-4 mb-4 px-4 py-3 rounded-lg bg-yellow-900/40 text-yellow-300 text-sm">
          {error}
        </div>
      )}

      {pos && (
        <div className="mx-4 mb-4 px-4 py-3 rounded-lg bg-gray-900 text-sm flex gap-6">
          <span className="text-gray-400">Lat <span className="text-white font-mono">{pos.lat.toFixed(5)}</span></span>
          <span className="text-gray-400">Lng <span className="text-white font-mono">{pos.lng.toFixed(5)}</span></span>
          <span className="text-gray-400">±{Math.round(pos.accuracy)}m</span>
        </div>
      )}

      <div
        ref={mapRef}
        className="flex-1 mx-4 rounded-2xl overflow-hidden"
        style={{ minHeight: '420px', background: '#1f2937' }}
      />

      {!leafletReady && (
        <div className="mx-4 mt-4 text-center text-sm text-gray-500">Loading map…</div>
      )}

      <BottomNav />
    </div>
  )
}
