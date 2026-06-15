import { useState, useRef, useEffect } from 'react'
import { Outlet, Navigate, useLocation } from 'react-router-dom'
import { Menu, Zap } from 'lucide-react'
import { SidebarAdmin } from '@/components/layout/SidebarAdmin'
import { useAuth } from '@/context/AuthContext'

export default function AdminLayout() {
  const { isAuthenticated, rol, estado } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const mainRef = useRef<HTMLElement>(null)
  const location = useLocation()

  useEffect(() => {
    mainRef.current?.scrollTo(0, 0)
  }, [location.pathname])

  if (!isAuthenticated || rol !== 'operador' || estado !== 'activo') return <Navigate to="/" replace />

  return (
    <div className="flex h-screen bg-bg overflow-hidden">
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar — fixed overlay on mobile, sticky column on desktop */}
      <div className={`fixed inset-y-0 left-0 z-50 md:relative md:z-auto md:translate-x-0 transition-transform duration-200 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <SidebarAdmin onClose={() => setSidebarOpen(false)} />
      </div>

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Mobile top bar */}
        <header className="flex items-center gap-3 px-4 py-3 bg-bg-2 border-b border-border md:hidden shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-1.5 rounded-lg text-text-dim hover:text-text hover:bg-bg-3 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-teal/10 border border-teal/30 flex items-center justify-center">
              <Zap className="w-3.5 h-3.5 text-teal" />
            </div>
            <span className="text-sm font-semibold text-text">AutomatizaLaw</span>
          </div>
        </header>

        <main ref={mainRef} className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
