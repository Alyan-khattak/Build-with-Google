import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { api, saveToken } from '../services/api'

export default function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await api.post<{ access_token: string; role: string }>('/auth/login', { email, password })
      saveToken(res.access_token, res.role)
      navigate(res.role === 'guardian' ? '/guardian' : '/dashboard')
    } catch (err: any) {
      setError(err.message ?? 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-rose-500 mb-1">AMANAH AI</h1>
          <p className="text-gray-400 text-sm">Your Safety. Your Circle. Your City.</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-gray-900 rounded-2xl p-6 space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Email</label>
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)}
              required
              className="w-full bg-gray-800 text-white rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-rose-500"
              placeholder="woman@demo.local"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Password</label>
            <input
              type="password" value={password} onChange={e => setPassword(e.target.value)}
              required
              className="w-full bg-gray-800 text-white rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-rose-500"
              placeholder="••••••••"
            />
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button
            type="submit" disabled={loading}
            className="w-full bg-rose-600 hover:bg-rose-700 text-white font-semibold py-2.5 rounded-lg disabled:opacity-50 transition-colors"
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="text-center text-gray-500 text-sm mt-4">
          New here?{' '}
          <a href="/register" className="text-rose-400 hover:text-rose-300">Create an account</a>
        </p>

        <div className="mt-4 bg-gray-900 rounded-xl p-4 text-xs text-gray-500 space-y-1">
          <p className="font-semibold text-gray-400">Demo accounts</p>
          <p>woman@demo.local / Demo1234! — safety monitoring</p>
          <p>guardian@demo.local / Demo1234! — guardian view</p>
        </div>
      </div>
    </div>
  )
}
