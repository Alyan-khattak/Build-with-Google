import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../services/api'
import { usePolling } from '../hooks/usePolling'
import BottomNav from '../components/BottomNav'

type Session = { id: string; status: string; started_at: string; ended_at: string | null }

function getLocation(): Promise<{ latitude: number; longitude: number } | null> {
  return new Promise(resolve => {
    if (!navigator.geolocation) { resolve(null); return }
    navigator.geolocation.getCurrentPosition(
      pos => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
      () => resolve(null),
      { timeout: 8000 }
    )
  })
}

export default function WomanDashboardPage() {
  const navigate = useNavigate()
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function fetchActive() {
    try {
      const s = await api.get<Session>('/sessions/active')
      setSession(s)
      if (s.status === 'emergency') navigate('/session/emergency')
    } catch {
      setSession(null)
    }
  }

  usePolling(fetchActive, 2000)

  async function startSession() {
    setError('')
    setLoading(true)
    try {
      const loc = await getLocation()
      await api.post('/sessions', loc ?? {})
      navigate('/session')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white p-4 pb-24">
      <div className="max-w-md mx-auto">
        <div className="flex items-center justify-between mb-8 mt-4">
          <h1 className="text-2xl font-bold text-rose-500">AMANAH AI</h1>
          <button onClick={() => navigate('/profile')} className="text-gray-400 text-sm hover:text-white">👤 Profile</button>
        </div>

        {session ? (
          <div className="bg-green-900/40 border border-green-700 rounded-2xl p-6 mb-6">
            <p className="text-green-400 font-semibold mb-2">Safety session active</p>
            <p className="text-gray-300 text-sm mb-4">
              Started {new Date(session.started_at).toLocaleTimeString()}
            </p>
            <button
              onClick={() => navigate('/session')}
              className="w-full bg-green-700 hover:bg-green-600 text-white font-semibold py-3 rounded-xl transition-colors"
            >
              View session
            </button>
          </div>
        ) : (
          <div className="bg-gray-900 rounded-2xl p-6 mb-6">
            <h2 className="text-lg font-semibold mb-2">Start safety monitoring</h2>
            <p className="text-gray-400 text-sm mb-6">
              You will receive periodic check-ins. Respond YES to confirm you're safe,
              NO or SOS if you need help.
            </p>
            {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
            <button
              onClick={startSession} disabled={loading}
              className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold py-4 rounded-xl text-lg disabled:opacity-50 transition-colors"
            >
              {loading ? 'Starting…' : 'Start session'}
            </button>
          </div>
        )}

        <button
          onClick={() => navigate('/reports')}
          className="w-full bg-gray-800 hover:bg-gray-700 text-gray-300 font-medium py-3 rounded-xl text-sm transition-colors mb-4"
        >
          📋 Report an incident
        </button>

        <div className="bg-gray-900 rounded-xl p-4 text-sm text-gray-400">
          <p className="font-semibold text-gray-300 mb-1">How it works</p>
          <ol className="list-decimal list-inside space-y-1">
            <li>Start a safety session before going out</li>
            <li>You'll be checked on periodically</li>
            <li>Respond YES to confirm you're safe</li>
            <li>Respond NO or press SOS if you need help</li>
            <li>Your guardian is alerted if you don't respond</li>
          </ol>
        </div>
      </div>
      <BottomNav />
    </div>
  )
}
