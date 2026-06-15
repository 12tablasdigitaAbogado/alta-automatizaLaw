import { NavLink } from 'react-router-dom'
import { Users, CalendarDays, LogOut, Zap, Clock } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { cn } from '@/lib/utils'

const NAV = [
  { to: '/admin/solicitudes', icon: Clock, label: 'Solicitudes' },
  { to: '/admin/clientes', icon: Users, label: 'Clientes' },
  { to: '/admin/agenda', icon: CalendarDays, label: 'Agenda' },
]

export function SidebarAdmin() {
  const { logout } = useAuth()

  return (
    <aside className="w-60 shrink-0 bg-bg-2 border-r border-border flex flex-col h-screen sticky top-0">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-border">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-teal/10 border border-teal/30 flex items-center justify-center glow-teal">
            <Zap className="w-4 h-4 text-teal" />
          </div>
          <div>
            <p className="text-sm font-semibold text-text">Cerebro del Estudio</p>
            <p className="text-xs text-text-faint">Panel operador</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
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
