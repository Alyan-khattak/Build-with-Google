import { useEffect, useRef, useState } from 'react'
import BottomNav from '../components/BottomNav'

interface Report {
  id: string
  report_type: string
  description: string
  latitude: number | null
  longitude: number | null
  created_at: string
}

const TYPE_COLORS: Record<string, string> = {
  harassment: '#f97316',
  theft: '#ef4444',
  unsafe_area: '#eab308',
  assault: '#dc2626',
  stalking: '#a855f7',
  other: '#6b7280',
}

const TYPE_ICONS: Record<string, string> = {
  harassment: '😡',
  theft: '🧳',
  unsafe_area: '⚠️',
  assault: '🚨',
  stalking: '👁️',
  other: '📍',
}

export default function CommunityMapPage() {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const layerGroupRef = useRef<any>(null)
  const [reports, setReports] = useState<Report[]>([])
  const [leafletReady, setLeafletReady] = useState(false)
  const [activeFilters, setActiveFilters] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetch('/api/v1/reports')
      .then(r => r.json())
      .then((data: Report[]) => setReports(data))
      .catch(() => {})
  }, [])

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

  useEffect(() => {
    if (!leafletReady || !mapRef.current || mapInstanceRef.current) return
    const L = (window as any).L
    const map = L.map(mapRef.current).setView([24.8607, 67.0011], 13)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
    }).addTo(map)
    layerGroupRef.current = L.layerGroup().addTo(map)
    mapInstanceRef.current = map
  }, [leafletReady])

  // Re-render markers whenever reports or filters change
  useEffect(() => {
    if (!leafletReady || !layerGroupRef.current) return
    const L = (window as any).L
    layerGroupRef.current.clearLayers()

    const visible = activeFilters.size === 0
      ? reports.filter(r => r.latitude != null && r.longitude != null)
      : reports.filter(r => r.latitude != null && r.longitude != null && activeFilters.has(r.report_type))

    visible.forEach(r => {
      const color = TYPE_COLORS[r.report_type] || '#6b7280'
      const icon = TYPE_ICONS[r.report_type] || '📍'
      const marker = L.divIcon({
        className: '',
        html: `<div style="background:${color};border-radius:50%;width:28px;height:28px;display:flex;align-items:center;justify-content:center;font-size:14px;border:2px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.5)">${icon}</div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      })
      const time = new Date(r.created_at).toLocaleDateString()
      L.marker([r.latitude!, r.longitude!], { icon: marker })
        .addTo(layerGroupRef.current)
        .bindPopup(`<b>${r.report_type.replace('_', ' ')}</b><br/><small>${time}</small><br/>${r.description.slice(0, 100)}${r.description.length > 100 ? '…' : ''}`)
    })

    // Fit map to markers if any
    if (visible.length > 0 && mapInstanceRef.current) {
      const bounds = visible.map(r => [r.latitude!, r.longitude!] as [number, number])
      if (bounds.length === 1) {
        mapInstanceRef.current.setView(bounds[0], 15)
      } else {
        try { mapInstanceRef.current.fitBounds(bounds, { padding: [30, 30] }) } catch {}
      }
    }
  }, [leafletReady, reports, activeFilters])

  const toggleFilter = (type: string) => {
    setActiveFilters(prev => {
      const next = new Set(prev)
      if (next.has(type)) next.delete(type); else next.add(type)
      return next
    })
  }

  const types = Array.from(new Set(reports.map(r => r.report_type)))
  const withLocation = reports.filter(r => r.latitude != null)

  return (
    <div className="min-h-screen bg-gray-950 text-white pb-24 flex flex-col">
      <div className="px-4 pt-8 pb-3">
        <h1 className="text-2xl font-bold">Community Safety Map</h1>
        <p className="text-sm text-gray-400 mt-1">
          {withLocation.length} public report{withLocation.length !== 1 ? 's' : ''} — tap a type to filter
        </p>
      </div>

      {/* Filter chips — clickable */}
      {types.length > 0 && (
        <div className="mx-4 mb-3 flex gap-2 flex-wrap">
          {types.map(type => {
            const count = reports.filter(r => r.report_type === type).length
            const active = activeFilters.has(type)
            return (
              <button
                key={type}
                onClick={() => toggleFilter(type)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  active
                    ? 'ring-2 ring-white bg-gray-700 text-white scale-105'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                {TYPE_ICONS[type]} {type.replace('_', ' ')} ({count})
              </button>
            )
          })}
          {activeFilters.size > 0 && (
            <button
              onClick={() => setActiveFilters(new Set())}
              className="px-3 py-1.5 rounded-full text-xs font-medium bg-purple-800 text-purple-200 hover:bg-purple-700"
            >
              ✕ Clear filter
            </button>
          )}
        </div>
      )}

      {withLocation.length === 0 && leafletReady && (
        <div className="mx-4 mb-4 px-4 py-3 rounded-lg bg-gray-900 text-sm text-gray-400 text-center">
          No public reports with location yet. Submit a report to add the first pin.
        </div>
      )}

      <div
        ref={mapRef}
        className="flex-1 mx-4 rounded-2xl overflow-hidden"
        style={{ minHeight: '440px', background: '#1f2937' }}
      />

      <div className="mx-4 mt-3 mb-2">
        <p className="text-xs text-gray-600 text-center">
          Reports are anonymized — no personal identity or exact real-time location shown.
        </p>
      </div>

      <BottomNav />
    </div>
  )
}
