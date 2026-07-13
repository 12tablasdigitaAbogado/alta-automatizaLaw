import { NavLink } from 'react-router-dom'
import { Users, LogOut, Zap, X } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { cn } from '@/lib/utils'

const NAV = [
  { to: '/admin/clientes', icon: Users, label: 'Clientes' },
]

export function SidebarAdmin({ onClose }: { onClose?: () => void }) {
  const { logout } = useAuth()

  return (
    <aside className="w-60 shrink-0 bg-bg-2 border-r border-border flex flex-col h-screen md:sticky md:top-0">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-border">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-teal/10 border border-teal/30 flex items-center justify-center glow-teal">
            <Zap className="w-4 h-4 text-teal" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-text">AutomatizaLaw</p>
            <p className="text-xs text-text-faint">Panel operador</p>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="md:hidden p-1 rounded-lg text-text-faint hover:text-text hover:bg-bg-3 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onClose}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-teal/10 text-teal border border-teal/20'
                  : 'text-text-dim hover:text-text hover:bg-bg-3'
              )
            }
          >
            <Icon className="w-4 h-4" />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 border-t border-border">
        <button
          onClick={logout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-text-dim hover:text-coral hover:bg-coral/5 transition-colors w-full"
        >
          <LogOut className="w-4 h-4" />
          Cerrar sesión
        </button>
      </div>
    </aside>
  )
}
