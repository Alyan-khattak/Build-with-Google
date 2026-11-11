import { useEffect, useState } from 'react'
import { api } from '../services/api'
import BottomNav from '../components/BottomNav'

interface Contact {
  id: string
  email: string
  label: string | null
}

interface Report {
  id: string
  report_type: string
  description: string
  is_public: boolean
  created_at: string
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<{ email: string; full_name: string | null; role: string } | null>(null)
  const [fullName, setFullName] = useState('')
  const [guardians, setGuardians] = useState<Contact[]>([])
  const [guardianEmail, setGuardianEmail] = useState('')
  const [myReports, setMyReports] = useState<Report[]>([])
  const [currentPw, setCurrentPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null)
  const [loading, setLoading] = useState(true)

  const role = localStorage.getItem('role') || 'woman'

  useEffect(() => {
    Promise.all([
      api.get<{ email: string; full_name: string | null; role: string }>('/api/v1/users/me'),
      role === 'woman'
        ? api.get<Contact[]>('/api/v1/users/me/guardian-contacts')
        : api.get<Contact[]>('/api/v1/users/me/proteges').then(list =>
            (list as any[]).map(g => ({ id: g.link_id || g.id, email: g.email, label: g.full_name || null }))
          ),
      role === 'woman' ? api.get<Report[]>('/api/v1/reports/mine') : Promise.resolve([] as Report[]),
    ]).then(([p, g, r]) => {
      setProfile(p)
      setFullName(p.full_name || '')
      setGuardians(g)
      setMyReports(r)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [role])

  const flash = (text: string, ok: boolean) => {
    setMsg({ text, ok })
    setTimeout(() => setMsg(null), 3000)
  }

  const saveName = async () => {
    try {
      const r = await api.patch<{ email: string; full_name: string | null; role: string }>('/api/v1/users/me', { full_name: fullName })
      setProfile(r)
      flash('Name updated', true)
    } catch {
      flash('Failed to update name', false)
    }
  }

  const changePw = async () => {
    if (newPw.length < 8) { flash('New password must be at least 8 characters', false); return }
    try {
      await api.post('/api/v1/users/me/password', { current_password: currentPw, new_password: newPw })
      setCurrentPw(''); setNewPw('')
      flash('Password changed', true)
    } catch (e: any) {
      flash(e?.detail || 'Password change failed', false)
    }
  }

  const addGuardian = async () => {
    if (!guardianEmail.trim()) return
    try {
      const contact = await api.post<Contact>('/api/v1/users/me/guardian-contacts', { guardian_email: guardianEmail.trim() })
      setGuardians(g => [...g, contact])
      setGuardianEmail('')
      flash('Guardian added', true)
    } catch (e: any) {
      flash(e?.detail || 'Could not add guardian', false)
    }
  }

  const removeGuardian = async (contactId: string) => {
    try {
      await api.delete(`/api/v1/users/me/guardian-contacts/${contactId}`)
      setGuardians(g => g.filter(x => x.id !== contactId))
      flash('Guardian removed', true)
    } catch {
      flash('Could not remove guardian', false)
    }
  }

  if (loading) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center text-gray-400">Loading...</div>
  )

  return (
    <div className="min-h-screen bg-gray-950 text-white pb-24">
      <div className="max-w-lg mx-auto px-4 pt-8">
        <h1 className="text-2xl font-bold mb-6">Profile & Settings</h1>

        {msg && (
          <div className={`mb-4 px-4 py-3 rounded-lg text-sm font-medium ${msg.ok ? 'bg-green-900/50 text-green-300' : 'bg-red-900/50 text-red-300'}`}>
            {msg.text}
          </div>
        )}

        {/* Identity */}
        <section className="bg-gray-900 rounded-2xl p-5 mb-4">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Account</h2>
          <p className="text-sm text-gray-500 mb-1">Email</p>
          <p className="text-white mb-4">{profile?.email}</p>
          <p className="text-sm text-gray-500 mb-1">Role</p>
          <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold mb-4 ${role === 'woman' ? 'bg-purple-900 text-purple-300' : 'bg-blue-900 text-blue-300'}`}>
            {role === 'woman' ? 'Safety User' : 'Guardian'}
          </span>
          <p className="text-sm text-gray-500 mb-1">Display name</p>
          <div className="flex gap-2">
            <input
              className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-500"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              placeholder="Your name"
            />
            <button onClick={saveName} className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-sm font-medium">
              Save
            </button>
          </div>
        </section>

        {/* Guardian management (women only) */}
        {role === 'woman' && (
          <section className="bg-gray-900 rounded-2xl p-5 mb-4">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">My Guardians</h2>
            {guardians.length === 0 && (
              <p className="text-sm text-gray-500 mb-4">No guardians linked yet.</p>
            )}
            {guardians.map(c => (
              <div key={c.id} className="flex items-center justify-between py-3 border-b border-gray-800 last:border-0">
                <div>
                  <p className="text-sm font-medium">{c.label || c.email}</p>
                  {c.label && <p className="text-xs text-gray-500">{c.email}</p>}
                </div>
                <button
                  onClick={() => removeGuardian(c.id)}
                  className="text-xs text-red-400 hover:text-red-300 px-3 py-1 rounded-lg hover:bg-red-900/30"
                >
                  Remove
                </button>
              </div>
            ))}
            <div className="flex gap-2 mt-4">
              <input
                className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-500"
                value={guardianEmail}
                onChange={e => setGuardianEmail(e.target.value)}
                placeholder="Guardian's email address"
                type="email"
              />
              <button onClick={addGuardian} className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-sm font-medium">
                Add
              </button>
            </div>
            <p className="text-xs text-gray-600 mt-2">We'll email them in an emergency. If they have an Amanah account, they'll also see alerts in the app.</p>
          </section>
        )}

        {/* Proteges (guardians only) */}
        {role === 'guardian' && (
          <section className="bg-gray-900 rounded-2xl p-5 mb-4">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">People I Protect</h2>
            {guardians.length === 0 && (
              <p className="text-sm text-gray-500">No one has linked you as their guardian yet.</p>
            )}
            {guardians.map(c => (
              <div key={c.id} className="py-3 border-b border-gray-800 last:border-0">
                <p className="text-sm font-medium">{c.label || c.email}</p>
                {c.label && <p className="text-xs text-gray-500">{c.email}</p>}
              </div>
            ))}
          </section>
        )}

        {/* My Reports — before settings so it's visible without scrolling */}
        {role === 'woman' && (
          <section className="bg-gray-900 rounded-2xl p-5 mb-4">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">My Reports</h2>
            {myReports.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">
                No reports yet.{' '}
                <a href="/reports" className="text-purple-400 underline">Submit one →</a>
              </p>
            ) : (
              <div className="space-y-3">
                {myReports.map(r => (
                  <div key={r.id} className="border border-gray-800 rounded-xl p-3 text-sm">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-medium text-purple-300 capitalize">{r.report_type.replace('_', ' ')}</span>
                      <span className="text-xs text-gray-500">{new Date(r.created_at).toLocaleDateString()}</span>
                    </div>
                    <p className="text-gray-400 text-xs line-clamp-2">{r.description}</p>
                    <span className="mt-1 inline-block text-xs px-2 py-0.5 rounded-full bg-gray-800 text-gray-500">
                      {r.is_public ? '🌐 Public' : '🔒 Private'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Password change */}
        <section className="bg-gray-900 rounded-2xl p-5 mb-4">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Change Password</h2>
          <input
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm mb-3 focus:outline-none focus:border-purple-500"
            type="password"
            placeholder="Current password"
            value={currentPw}
            onChange={e => setCurrentPw(e.target.value)}
          />
          <input
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm mb-3 focus:outline-none focus:border-purple-500"
            type="password"
            placeholder="New password (min 8 characters)"
            value={newPw}
            onChange={e => setNewPw(e.target.value)}
          />
          <button onClick={changePw} className="w-full py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm font-medium">
            Update Password
          </button>
        </section>

        {/* Sign out */}
        <section className="bg-gray-900 rounded-2xl p-5">
          <button
            onClick={() => { localStorage.clear(); window.location.href = '/login' }}
            className="w-full py-3 text-red-400 hover:text-red-300 font-medium text-sm"
          >
            Sign out
          </button>
        </section>
      </div>

      <BottomNav />
    </div>
  )
}
