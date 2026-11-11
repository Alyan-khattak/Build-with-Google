import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { api, clearToken } from '../services/api'
import { usePolling } from '../hooks/usePolling'
import BottomNav from '../components/BottomNav'
import 'leaflet/dist/leaflet.css'

type Alert = {
  id: string
  session_id: string
  status: string
  trigger_reason: string
  triggered_at: string
  last_updated_at: string
  user_email: string
  latitude: number | null
  longitude: number | null
}

const TRIGGER_LABEL: Record<string, string> = {
  NO: 'User responded NO',
  SOS: 'SOS activated',
  missed: 'Missed check-in',
}

function EmergencyMap({ alerts }: { alerts: Alert[] }) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)

  useEffect(() => {
    const L = (window as any).L
    if (!L || !mapRef.current) return

    const located = alerts.filter(a => a.latitude !== null && a.longitude !== null)
    if (located.length === 0) return

    if (!mapInstanceRef.current) {
      // Fix default icon URLs for Vite/bundlers
      delete (L.Icon.Default.prototype as any)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      })

      mapInstanceRef.current = L.map(mapRef.current).setView(
        [located[0].latitude, located[0].longitude], 15
      )
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(mapInstanceRef.current)
    }

    const map = mapInstanceRef.current
    // Clear and re-add markers each render
    map.eachLayer((layer: any) => { if (layer._latlng) map.removeLayer(layer) })

    const redIcon = L.divIcon({
      html: '<div style="background:#ef4444;width:14px;height:14px;border-radius:50%;border:2px solid white;box-shadow:0 0 6px rgba(239,68,68,0.8)"></div>',
      className: '',
      iconSize: [14, 14],
    })

    located.forEach(alert => {
      L.marker([alert.latitude, alert.longitude], { icon: redIcon })
        .addTo(map)
        .bindPopup(
          `<strong>${alert.user_email}</strong><br>${TRIGGER_LABEL[alert.trigger_reason] ?? alert.trigger_reason}<br><small>${new Date(alert.triggered_at).toLocaleTimeString()}</small>`
        )
    })

    if (located.length === 1) {
      map.setView([located[0].latitude, located[0].longitude], 15)
    } else {
      const bounds = L.latLngBounds(located.map((a: Alert) => [a.latitude, a.longitude]))
      map.fitBounds(bounds, { padding: [30, 30] })
    }
  }, [alerts])

  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [])

  return <div ref={mapRef} style={{ height: '260px', borderRadius: '12px' }} />
}

export default function GuardianDashboardPage() {
  const navigate = useNavigate()
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [acking, setAcking] = useState<string | null>(null)
  const [leafletReady, setLeafletReady] = useState(false)

  // Load Leaflet JS lazily (it needs window, so we use a script tag)
  useEffect(() => {
    if ((window as any).L) { setLeafletReady(true); return }
    const script = document.createElement('script')
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
    script.onload = () => setLeafletReady(true)
    document.head.appendChild(script)
  }, [])

  async function fetchAlerts() {
    try {
      const data = await api.get<Alert[]>('/guardian/alerts')
      setAlerts(data)
    } catch {
      // token expired or network error — stay on page
    }
  }

  usePolling(fetchAlerts, 2000)

  async function acknowledge(emergencyId: string) {
    setAcking(emergencyId)
    try {
      await api.post(`/guardian/alerts/${emergencyId}/acknowledge`)
    } finally {
      setAcking(null)
    }
  }

  function logout() { clearToken(); navigate('/login') }

  const locatedAlerts = alerts.filter(a => a.latitude !== null && a.longitude !== null)

  return (
    <div className="min-h-screen bg-gray-950 text-white p-4">
      <div className="max-w-md mx-auto">
        <div className="flex items-center justify-between mb-6 mt-4">
          <div>
            <h1 className="text-2xl font-bold text-rose-500">Guardian View</h1>
            <p className="text-gray-500 text-xs">Polling every 2s</p>
          </div>
          <button onClick={logout} className="text-gray-400 text-sm hover:text-white">Sign out</button>
        </div>

        {/* Map — shown when any alert has location */}
        {leafletReady && locatedAlerts.length > 0 && (
          <div className="mb-6 bg-gray-900 rounded-2xl overflow-hidden">
            <p className="text-xs text-gray-500 px-4 pt-3 pb-2">📍 Last known location</p>
            <div className="px-3 pb-3">
              <EmergencyMap alerts={locatedAlerts} />
            </div>
          </div>
        )}

        {alerts.length === 0 ? (
          <div className="bg-gray-900 rounded-2xl p-8 text-center">
            <div className="text-4xl mb-3">🛡️</div>
            <p className="text-gray-400">No active alerts</p>
            <p className="text-gray-600 text-sm mt-1">Your person is safe</p>
          </div>
        ) : (
          <div className="space-y-4">
            {alerts.map(alert => (
              <div key={alert.id} className="bg-red-950 border-2 border-red-700 rounded-2xl p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <span className="text-red-400 font-bold text-lg">🚨 EMERGENCY</span>
                    <p className="text-red-300 text-sm mt-0.5">
                      {TRIGGER_LABEL[alert.trigger_reason] ?? alert.trigger_reason}
                    </p>
                  </div>
                </div>
                <p className="text-gray-300 text-sm font-medium mb-1">👤 {alert.user_email}</p>
                <p className="text-gray-400 text-xs mb-2">
                  Triggered: {new Date(alert.triggered_at).toLocaleTimeString()}<br />
                  Last updated: {new Date(alert.last_updated_at).toLocaleTimeString()}
                </p>
                {alert.latitude !== null && alert.longitude !== null && (
                  <a
                    href={`https://www.openstreetmap.org/?mlat=${alert.latitude}&mlon=${alert.longitude}&zoom=16`}
                    target="_blank" rel="noreferrer"
                    className="block text-xs text-blue-400 hover:text-blue-300 mb-3"
                  >
                    📍 {alert.latitude.toFixed(5)}, {alert.longitude.toFixed(5)} — Open in map
                  </a>
                )}
                <div className="bg-red-900/40 rounded-lg p-3 mb-4 text-xs text-red-400">
                  ⚠ Demo only — in a real emergency, contact emergency services immediately.
                </div>
                <button
                  onClick={() => acknowledge(alert.id)}
                  disabled={acking === alert.id}
                  className="w-full bg-gray-800 hover:bg-gray-700 text-gray-300 py-2.5 rounded-xl text-sm disabled:opacity-50 transition-colors"
                >
                  {acking === alert.id ? 'Acknowledging…' : 'Acknowledge alert'}
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="mt-6 bg-gray-900 rounded-xl p-4 text-xs text-gray-500">
          <p className="font-semibold text-gray-400 mb-1">As a guardian you will see:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Any emergency triggered by the person you guard</li>
            <li>Their last known location on the map (if location was shared)</li>
            <li>The trigger reason (NO, SOS, or missed check-in)</li>
            <li>Automatic updates every 2 seconds</li>
          </ul>
        </div>
      </div>
      <BottomNav />
    </div>
  )
}
