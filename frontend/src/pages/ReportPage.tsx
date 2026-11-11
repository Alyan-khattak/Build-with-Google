import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../services/api'
import BottomNav from '../components/BottomNav'

const REPORT_TYPES = [
  { value: 'harassment', label: 'Harassment' },
  { value: 'theft', label: 'Theft / Robbery' },
  { value: 'unsafe_area', label: 'Unsafe area' },
  { value: 'assault', label: 'Physical assault' },
  { value: 'stalking', label: 'Stalking / Following' },
  { value: 'other', label: 'Other' },
]

export default function ReportPage() {
  const navigate = useNavigate()
  const [reportType, setReportType] = useState('')
  const [description, setDescription] = useState('')
  const [isPublic, setIsPublic] = useState(false)
  const [lat, setLat] = useState<number | null>(null)
  const [lng, setLng] = useState<number | null>(null)
  const [locating, setLocating] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [draftLoading, setDraftLoading] = useState(false)
  const [draftSuggestion, setDraftSuggestion] = useState('')
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  function captureLocation() {
    if (!navigator.geolocation) { setError('Geolocation not supported'); return }
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      pos => { setLat(pos.coords.latitude); setLng(pos.coords.longitude); setLocating(false) },
      () => { setError('Could not get location — you can still submit without it'); setLocating(false) },
      { timeout: 10000 }
    )
  }

  async function getAIDraft() {
    if (!description.trim()) { setError('Write something first so AI can help structure it'); return }
    setDraftLoading(true); setError(''); setDraftSuggestion('')
    try {
      const r = await api.post<{ suggestion: string }>('/reports/draft', { description, report_type: reportType || 'other' })
      setDraftSuggestion(r.suggestion)
    } catch (e: any) {
      setError(e?.detail || 'AI not available — submit your original text')
    } finally {
      setDraftLoading(false)
    }
  }

  function acceptDraft() {
    setDescription(draftSuggestion)
    setDraftSuggestion('')
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!reportType) { setError('Please select an incident type'); return }
    if (!description.trim()) { setError('Please describe what happened'); return }
    setError('')
    setSubmitting(true)
    try {
      await api.post('/reports', {
        report_type: reportType,
        description: description.trim(),
        latitude: lat,
        longitude: lng,
        is_public: isPublic,
      })
      setDone(true)
    } catch (err: any) {
      setError(err.message ?? 'Failed to submit report')
    } finally {
      setSubmitting(false)
    }
  }

  if (done) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center p-4">
        <div className="max-w-sm w-full text-center">
          <div className="text-5xl mb-4">✅</div>
          <h2 className="text-xl font-bold mb-2">Report submitted</h2>
          <p className="text-gray-400 text-sm mb-6">
            Thank you for helping keep the community safe.
          </p>
          <button
            onClick={() => navigate('/dashboard')}
            className="w-full bg-rose-600 hover:bg-rose-700 text-white font-semibold py-3 rounded-xl transition-colors"
          >
            Back to dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white p-4 pb-24">
      <div className="max-w-md mx-auto">
        <div className="flex items-center gap-3 mb-6 mt-4">
          <button onClick={() => navigate('/dashboard')} className="text-gray-400 hover:text-white">←</button>
          <h1 className="text-xl font-bold">Report Incident</h1>
        </div>

        <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-3 mb-6 text-xs text-gray-400">
          Your personal identity is never shared publicly. Only anonymous location and incident type
          appear on the community map when you opt in.
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm text-gray-400 mb-2">Incident type</label>
            <div className="grid grid-cols-2 gap-2">
              {REPORT_TYPES.map(t => (
                <button
                  key={t.value} type="button"
                  onClick={() => setReportType(t.value)}
                  className={`py-2.5 px-3 rounded-xl text-sm text-left transition-colors ${
                    reportType === t.value
                      ? 'bg-rose-900/40 border-2 border-rose-500 text-rose-300'
                      : 'bg-gray-800 border-2 border-transparent text-gray-400 hover:border-gray-600'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">What happened?</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={5}
              required
              className="w-full bg-gray-800 text-white rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-rose-500 resize-none text-sm"
              placeholder="Describe what happened in your own words…"
            />
            <button
              type="button" onClick={getAIDraft} disabled={draftLoading || !description.trim()}
              className="mt-2 w-full bg-indigo-900/50 hover:bg-indigo-800/60 border border-indigo-700 text-indigo-300 py-2 rounded-xl text-sm disabled:opacity-40 transition-colors"
            >
              {draftLoading ? '✨ Structuring…' : '✨ Get AI suggestion'}
            </button>

            {draftSuggestion && (
              <div className="mt-3 bg-indigo-950/60 border border-indigo-800 rounded-xl p-4">
                <p className="text-xs text-indigo-400 font-semibold uppercase tracking-wider mb-2">AI suggestion — review before accepting</p>
                <p className="text-sm text-gray-200 whitespace-pre-wrap">{draftSuggestion}</p>
                <div className="flex gap-2 mt-3">
                  <button type="button" onClick={acceptDraft}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg text-sm font-medium">
                    Use this draft
                  </button>
                  <button type="button" onClick={() => setDraftSuggestion('')}
                    className="px-4 bg-gray-700 hover:bg-gray-600 text-gray-300 py-2 rounded-lg text-sm">
                    Dismiss
                  </button>
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">Location (optional)</label>
            {lat !== null && lng !== null ? (
              <div className="bg-green-900/30 border border-green-800 rounded-xl px-4 py-3 text-sm text-green-400">
                📍 {lat.toFixed(5)}, {lng.toFixed(5)}
                <button
                  type="button" onClick={() => { setLat(null); setLng(null) }}
                  className="ml-3 text-gray-500 text-xs hover:text-white"
                >remove</button>
              </div>
            ) : (
              <button
                type="button" onClick={captureLocation} disabled={locating}
                className="w-full bg-gray-800 hover:bg-gray-700 text-gray-300 py-3 rounded-xl text-sm disabled:opacity-50 transition-colors"
              >
                {locating ? 'Getting location…' : '📍 Add my current location'}
              </button>
            )}
          </div>

          <div className="flex items-start gap-3 bg-gray-900 rounded-xl p-4">
            <input
              type="checkbox" id="public" checked={isPublic}
              onChange={e => setIsPublic(e.target.checked)}
              className="mt-0.5 accent-rose-500"
            />
            <label htmlFor="public" className="text-sm text-gray-300 cursor-pointer">
              Share anonymously on community map
              <span className="block text-xs text-gray-500 mt-0.5">
                Only incident type and approximate location shown — never your identity
              </span>
            </label>
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button
            type="submit" disabled={submitting}
            className="w-full bg-rose-600 hover:bg-rose-700 text-white font-semibold py-3 rounded-xl disabled:opacity-50 transition-colors"
          >
            {submitting ? 'Submitting…' : 'Submit report'}
          </button>
        </form>
      </div>
      <BottomNav />
    </div>
  )
}
