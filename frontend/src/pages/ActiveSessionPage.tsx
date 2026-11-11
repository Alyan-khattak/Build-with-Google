import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api, clearToken } from '../services/api'
import { usePolling } from '../hooks/usePolling'

type Session = { id: string; status: string; started_at: string }
type Check  = { id: string; sequence_number: number; due_at: string; response_deadline: string; status: string; response: string | null }

type ConfirmEndState = 'idle' | 'confirm1' | 'confirm2'

export default function ActiveSessionPage() {
  const navigate = useNavigate()
  const [session, setSession] = useState<Session | null>(null)
  const [check, setCheck]     = useState<Check | null>(null)
  const [responding, setResponding] = useState(false)
  const [ending, setEnding]   = useState(false)
  const [confirmEnd, setConfirmEnd] = useState<ConfirmEndState>('idle')
  const [error, setError]     = useState('')
  const [countdown, setCountdown] = useState<number | null>(null)

  async function refresh() {
    try {
      const s = await api.get<Session>('/sessions/active')
      setSession(s)
      if (s.status === 'emergency') { navigate('/session/emergency'); return }
      if (s.status === 'ended')     { navigate('/dashboard'); return }

      try {
        const c = await api.get<Check>(`/sessions/${s.id}/checks/current`)
        setCheck(c)
        const deadline = new Date(c.response_deadline).getTime()
        const secs = Math.max(0, Math.round((deadline - Date.now()) / 1000))
        setCountdown(secs)
      } catch {
        setCheck(null)
        setCountdown(null)
      }
    } catch {
      navigate('/dashboard')
    }
  }

  usePolling(refresh, 2000)

  async function respond(response: 'YES' | 'NO' | 'SOS') {
    if (!session) return
    setError('')
    setResponding(true)
    try {
      await api.post(`/sessions/${session.id}/respond`, { response })
      if (response === 'YES') {
        setCheck(null)
      } else {
        navigate('/session/emergency')
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setResponding(false)
    }
  }

  async function endSessionConfirmed() {
    if (!session) return
    setEnding(true)
    try {
      await api.post(`/sessions/${session.id}/end`)
      navigate('/dashboard')
    } catch (err: any) {
      setError(err.message)
      setEnding(false)
    }
  }

  function logout() { clearToken(); navigate('/login') }

  const countdownCritical = countdown !== null && countdown <= 10

  return (
    <div className="min-h-screen bg-gray-950 text-white p-4">
      <div className="max-w-md mx-auto">
        <div className="flex items-center justify-between mb-6 mt-4">
          <h1 className="text-xl font-bold text-rose-500">Safety Session</h1>
          <button onClick={logout} className="text-gray-500 text-sm hover:text-white">Sign out</button>
        </div>

        {session && (
          <div className="bg-green-900/30 border border-green-800 rounded-xl px-4 py-3 mb-6 flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-green-400 text-sm font-medium">Monitoring active</span>
            <span className="text-gray-500 text-xs ml-auto">
              since {new Date(session.started_at).toLocaleTimeString()}
            </span>
          </div>
        )}

        {check ? (
          <div className="bg-gray-900 rounded-2xl p-6 mb-6">
            <p className="text-gray-300 text-sm mb-1">Check-in #{check.sequence_number}</p>
            <p className="text-xl font-semibold mb-6">Are you safe?</p>

            {countdown !== null && (
              <div className={`text-center mb-4 text-sm font-mono ${countdownCritical ? 'text-red-400 animate-pulse' : 'text-gray-400'}`}>
                {countdown}s remaining
              </div>
            )}

            {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

            <div className="space-y-3">
              <button
                onClick={() => respond('YES')} disabled={responding}
                className="w-full bg-green-700 hover:bg-green-600 text-white font-bold py-4 rounded-xl text-lg disabled:opacity-50 transition-colors"
              >
                YES — I'm safe
              </button>
              <button
                onClick={() => respond('NO')} disabled={responding}
                className="w-full bg-orange-700 hover:bg-orange-600 text-white font-semibold py-3 rounded-xl disabled:opacity-50 transition-colors"
              >
                NO — I need help
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-gray-900 rounded-2xl p-6 mb-6 text-center">
            <div className="w-12 h-12 rounded-full bg-green-900/50 flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">✓</span>
            </div>
            <p className="text-gray-300">Next check-in coming up</p>
            <p className="text-gray-500 text-sm mt-1">Stay alert — you'll be notified when it's time</p>
          </div>
        )}

        {/* SOS — always visible and prominent */}
        <button
          onClick={() => respond('SOS')} disabled={responding}
          className="w-full bg-red-700 hover:bg-red-600 text-white font-black py-5 rounded-2xl text-2xl tracking-widest shadow-lg disabled:opacity-50 transition-colors mb-6"
          aria-label="SOS Emergency"
        >
          🆘 SOS
        </button>

        {/* End session — deliberate multi-step confirmation */}
        <div className="bg-gray-900 rounded-xl p-4">
          {confirmEnd === 'idle' && (
            <button
              onClick={() => setConfirmEnd('confirm1')}
              className="w-full text-gray-400 hover:text-white text-sm py-2 transition-colors"
            >
              End session safely
            </button>
          )}
          {confirmEnd === 'confirm1' && (
            <div className="text-center">
              <p className="text-gray-300 mb-3 text-sm">Are you sure? Your guardian will no longer monitor you.</p>
              <div className="flex gap-3">
                <button onClick={() => setConfirmEnd('idle')} className="flex-1 bg-gray-800 py-2 rounded-lg text-sm">Cancel</button>
                <button onClick={() => setConfirmEnd('confirm2')} className="flex-1 bg-gray-700 hover:bg-gray-600 py-2 rounded-lg text-sm">Yes, end it</button>
              </div>
            </div>
          )}
          {confirmEnd === 'confirm2' && (
            <div className="text-center">
              <p className="text-gray-300 mb-3 text-sm font-semibold">Confirm you're safely home</p>
              <div className="flex gap-3">
                <button onClick={() => setConfirmEnd('idle')} className="flex-1 bg-gray-800 py-2 rounded-lg text-sm">Cancel</button>
                <button
                  onClick={endSessionConfirmed} disabled={ending}
                  className="flex-1 bg-gray-600 hover:bg-gray-500 py-2 rounded-lg text-sm disabled:opacity-50"
                >
                  {ending ? 'Ending…' : 'Confirm end'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
