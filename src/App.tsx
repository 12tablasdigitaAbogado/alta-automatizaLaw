import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from '@/context/AuthContext'
import Login from '@/pages/Login'
import RoadmapLayout from '@/pages/cliente/RoadmapLayout'
import AdminLayout from '@/pages/admin/AdminLayout'
import ListaClientes from '@/pages/admin/ListaClientes'
import FichaCliente from '@/pages/admin/FichaCliente'
import Agenda from '@/pages/admin/Agenda'
import Solicitudes from '@/pages/admin/Solicitudes'
import { useAuth } from '@/context/AuthContext'
import { Zap } from 'lucide-react'

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-bg flex items-center justify-center">
      <div className="w-10 h-10 rounded-xl bg-teal/10 border border-teal/30 flex items-center justify-center animate-pulse">
        <Zap className="w-5 h-5 text-teal" />
      </div>
    </div>
  )
}

function ProtectedClienteRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, rol, loading } = useAuth()
  if (loading) return <LoadingScreen />
  if (!isAuthenticated) return <Navigate to="/" replace />
  if (rol !== 'cliente') return <Navigate to="/admin/clientes" replace />
  return <>{children}</>
}

function AppRoutes() {
  const { loading } = useAuth()
  if (loading) return <LoadingScreen />

  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route
        path="/cliente/onboarding"
        element={
          <ProtectedClienteRoute>
            <RoadmapLayout />
          </ProtectedClienteRoute>
        }
      />
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<Navigate to="clientes" replace />} />
        <Route path="solicitudes" element={<Solicitudes />} />
        <Route path="clientes" element={<ListaClientes />} />
        <Route path="clientes/:id" element={<FichaCliente />} />
        <Route path="agenda" element={<Agenda />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}
