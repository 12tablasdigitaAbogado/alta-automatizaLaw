import { Outlet, Navigate } from 'react-router-dom'
import { SidebarAdmin } from '@/components/layout/SidebarAdmin'
import { useAuth } from '@/context/AuthContext'

export default function AdminLayout() {
  const { isAuthenticated, rol, estado } = useAuth()
  if (!isAuthenticated || rol !== 'operador' || estado !== 'activo') return <Navigate to="/" replace />

  return (
    <div className="flex h-screen bg-bg overflow-hidden">
      <SidebarAdmin />
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  )
}
