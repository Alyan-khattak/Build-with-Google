import { NavLink } from 'react-router-dom'

const womanNav = [
  { to: '/dashboard', label: 'Home', icon: '🏠' },
  { to: '/map/live', label: 'My Map', icon: '📍' },
  { to: '/map/community', label: 'Community', icon: '🗺️' },
  { to: '/reports', label: 'Report', icon: '📋' },
  { to: '/profile', label: 'Profile', icon: '👤' },
]

const guardianNav = [
  { to: '/guardian', label: 'Alerts', icon: '🔔' },
  { to: '/map/community', label: 'Community', icon: '🗺️' },
  { to: '/profile', label: 'Profile', icon: '👤' },
]

export default function BottomNav() {
  const role = localStorage.getItem('role') || 'woman'
  const items = role === 'guardian' ? guardianNav : womanNav

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-gray-900/95 backdrop-blur border-t border-gray-800 z-50">
      <div className="flex justify-around items-center h-16 max-w-lg mx-auto px-2">
        {items.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition-colors min-w-0 ${
                isActive ? 'text-purple-400' : 'text-gray-500 hover:text-gray-300'
              }`
            }
          >
            <span className="text-xl leading-none">{item.icon}</span>
            <span className="text-xs font-medium truncate">{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
