import React from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const NAV = [
  { to: '/', label: 'Dashboard', icon: '◧' },
  { to: '/chargebacks', label: 'Chargebacks', icon: '⊞' },
  { to: '/new', label: 'Score a case', icon: '＋' },
  { to: '/analytics', label: 'Analytics', icon: '▤' },
  { to: '/audit', label: 'Audit log', icon: '≣' },
]

export default function Sidebar() {
  const { logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <aside className="w-60 shrink-0 h-full bg-surface border-r border-border flex flex-col">
      <div className="px-5 py-6 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-md bg-accent/15 border border-accent/30 flex items-center justify-center text-accent font-mono font-semibold">
            CB
          </div>
          <div>
            <div className="font-semibold leading-tight">Chargeback</div>
            <div className="text-xs text-muted leading-tight">Assistant</div>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                isActive
                  ? 'bg-accent/10 text-accent border border-accent/20'
                  : 'text-muted hover:text-ink hover:bg-raised border border-transparent'
              }`
            }
          >
            <span className="font-mono text-base w-4 text-center">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="px-3 py-4 border-t border-border">
        <button
          onClick={handleLogout}
          className="w-full text-left px-3 py-2 rounded-md text-sm text-muted hover:text-high hover:bg-raised transition-colors"
        >
          Sign out
        </button>
      </div>
    </aside>
  )
}
