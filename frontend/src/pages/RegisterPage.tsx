import { useState, type FormEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { api, saveToken } from '../services/api'

export default function RegisterPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [fullName, setFullName] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<'woman' | 'guardian'>('woman')
  const [guardianEmail, setGuardianEmail] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const body: Record<string, string> = { email, password, role }
      if (fullName.trim()) body.full_name = fullName.trim()
      if (role === 'woman' && guardianEmail.trim()) body.guardian_email = guardianEmail.trim()
      const res = await api.post<{ access_token: string; role: string }>('/auth/register', body)
      saveToken(res.access_token, res.role)
      navigate(res.role === 'guardian' ? '/guardian' : '/dashboard')
    } catch (err: any) {
      setError(err.message ?? 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-rose-500 mb-1">AMANAH AI</h1>
          <p className="text-gray-400 text-sm">Create your account</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-gray-900 rounded-2xl p-6 space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Full name</label>
            <input
              type="text" value={fullName} onChange={e => setFullName(e.target.value)}
              className="w-full bg-gray-800 text-white rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-rose-500"
              placeholder="Your name (optional)"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Email</label>
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)}
              required
              className="w-full bg-gray-800 text-white rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-rose-500"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Password</label>
            <input
              type="password" value={password} onChange={e => setPassword(e.target.value)}
              required minLength={8}
              className="w-full bg-gray-800 text-white rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-rose-500"
              placeholder="At least 8 characters"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">Account type</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setRole('woman')}
                className={`py-3 rounded-xl text-sm font-semibold border-2 transition-colors ${
                  role === 'woman'
                    ? 'border-rose-500 bg-rose-900/30 text-rose-400'
                    : 'border-gray-700 bg-gray-800 text-gray-400 hover:border-gray-500'
                }`}
              >
                👩 Safety user
              </button>
              <button
                type="button"
                onClick={() => setRole('guardian')}
                className={`py-3 rounded-xl text-sm font-semibold border-2 transition-colors ${
                  role === 'guardian'
                    ? 'border-blue-500 bg-blue-900/30 text-blue-400'
                    : 'border-gray-700 bg-gray-800 text-gray-400 hover:border-gray-500'
                }`}
              >
                🛡️ Guardian
              </button>
            </div>
            <p className="text-gray-600 text-xs mt-2">
              {role === 'woman'
                ? 'You will receive check-ins and can trigger SOS'
                : 'You will be notified when someone you guard needs help'}
            </p>
          </div>

          {role === 'woman' && (
            <div>
              <label className="block text-sm text-gray-400 mb-1">Guardian's email <span className="text-gray-600">(optional)</span></label>
              <input
                type="email" value={guardianEmail} onChange={e => setGuardianEmail(e.target.value)}
                className="w-full bg-gray-800 text-white rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-rose-500"
                placeholder="guardian@example.com"
              />
              <p className="text-gray-600 text-xs mt-1">Guardian must already have an account. They will be linked automatically.</p>
            </div>
          )}

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button
            type="submit" disabled={loading}
            className="w-full bg-rose-600 hover:bg-rose-700 text-white font-semibold py-2.5 rounded-lg disabled:opacity-50 transition-colors"
          >
            {loading ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <p className="text-center text-gray-500 text-sm mt-4">
          Already have an account?{' '}
          <Link to="/login" className="text-rose-400 hover:text-rose-300">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
