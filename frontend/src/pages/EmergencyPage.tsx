import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api, clearToken } from '../services/api'
import { usePolling } from '../hooks/usePolling'

type Session   = { id: string; status: string; started_at: string }
type Emergency = { id: string; status: string; trigger_reason: string; triggered_at: string; last_updated_at: string }

export default function EmergencyPage() {
  const navigate = useNavigate()
  const [session, setSession]     = useState<Session | null>(null)
  const [emergency, setEmergency] = useState<Emergency | null>(null)
  const [confirmResolve, setConfirmResolve] = useState(false)
  const [resolving, setResolving] = useState(false)
  const [error, setError]         = useState('')

  async function refresh() {
    try {
      const s = await api.get<Session>('/sessions/active')
      setSession(s)
      if (s.status === 'ended') { navigate('/dashboard'); return }
      try {
        const e = await api.get<Emergency>(`/sessions/${s.id}/emergency`)
        setEmergency(e)
      } catch {
        setEmergency(null)
      }
    } catch {
      navigate('/dashboard')
    }
  }

  usePolling(refresh, 2000)

  async function resolveEmergency() {
    if (!session || !emergency) return
    setResolving(true)
    setError('')
    try {
      await api.post(`/sessions/${session.id}/end`)
      navigate('/dashboard')
    } catch (err: any) {
      setError(err.message)
      setResolving(false)
    }
  }

  function logout() { clearToken(); navigate('/login') }

  const triggerLabel: Record<string, string> = {
    NO: 'You responded NO',
    SOS: 'SOS triggered',
    missed: 'Missed check-in',
  }

  return (
    <div className="min-h-screen bg-red-950 text-white p-4">
      <div className="max-w-md mx-auto">
        <div className="flex items-center justify-between mb-6 mt-4">
          <h1 className="text-xl font-bold text-red-400">EMERGENCY ACTIVE</h1>
          <button onClick={logout} className="text-red-800 text-sm hover:text-white">Sign out</button>
        </div>

        <div className="bg-red-900/60 border-2 border-red-600 rounded-2xl p-6 mb-6 text-center">
          <div className="text-5xl mb-4">🚨</div>
          <p className="text-2xl font-black text-red-300 mb-2">Your guardian has been alerted</p>
          {emergency && (
            <p className="text-red-400 text-sm mt-2">
              Reason: {triggerLabel[emergency.trigger_reason] ?? emergency.trigger_reason}
            </p>
          )}
          <p className="text-red-500 text-xs mt-1">
            Triggered {emergency ? new Date(emergency.triggered_at).toLocaleTimeString() : '—'}
          </p>
        </div>

        {/* This is a demo app — no real emergency services integration */}
        <div className="bg-red-900/30 border border-red-800 rounded-xl p-4 mb-6 text-sm text-red-400">
          ⚠ This is a demonstration application. In a real emergency, call your local emergency services.
        </div>

        {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

        {/* Resolve — deliberate multi-step confirmation */}
        {!confirmResolve ? (
          <button
            onClick={() => setConfirmResolve(true)}
            className="w-full bg-gray-800 hover:bg-gray-700 text-gray-300 py-3 rounded-xl text-sm transition-colors"
          >
            I'm safe — resolve emergency
          </button>
        ) : (
          <div className="bg-gray-900 rounded-xl p-4">
            <p className="text-gray-300 text-sm font-semibold mb-3">
              Confirm you are physically safe and no help is needed
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmResolve(false)}
                className="flex-1 bg-gray-800 py-3 rounded-lg text-sm"
              >
                Cancel
              </button>
              <button
                onClick={resolveEmergency} disabled={resolving}
                className="flex-1 bg-gray-700 hover:bg-gray-600 py-3 rounded-lg text-sm disabled:opacity-50"
              >
                {resolving ? 'Resolving…' : 'Confirm safe'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
