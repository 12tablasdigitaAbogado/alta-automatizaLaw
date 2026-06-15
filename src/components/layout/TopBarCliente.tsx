import { LogOut, Zap } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useRoadmap } from '@/context/RoadmapContext'

export function TopBarCliente() {
  const { usuario, logout } = useAuth()
  const { progreso } = useRoadmap()
  const pct = progreso?.porcentaje ?? 0

  return (
    <header className="sticky top-0 z-40 bg-bg-2/80 backdrop-blur-md border-b border-border">
      <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-4">
        {/* Logo */}
        <div className="flex items-center gap-2 mr-auto">
          <div className="w-7 h-7 rounded-md bg-teal/10 border border-teal/30 flex items-center justify-center">
            <Zap className="w-3.5 h-3.5 text-teal" />
          </div>
          <span className="text-sm font-semibold text-text hidden sm:block">AutomatizaLaw</span>
        </div>

        {/* Progress pill */}
        <div className="flex items-center gap-2.5 bg-bg-3 border border-border px-3 py-1.5 rounded-full">
          <div className="relative w-24 h-1.5 bg-bg rounded-full overflow-hidden">
            <div
              className="absolute inset-y-0 left-0 bg-teal rounded-full transition-all duration-700"
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className="text-xs font-medium text-teal tabular-nums">{pct}%</span>
        </div>

        {/* User */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-text-dim hidden sm:block truncate max-w-32">{usuario?.nombre}</span>
          <button
            onClick={logout}
            className="p-1.5 rounded-md text-text-faint hover:text-coral hover:bg-coral/5 transition-colors"
            title="Cerrar sesión"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  )
}
