import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { supabase } from '@/lib/supabase'
import type { Usuario, Rol, EstadoCliente } from '@/types'

interface AuthContextValue {
  usuario: Usuario | null
  rol: Rol | null
  estado: EstadoCliente | null
  isAuthenticated: boolean
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, nombre: string) => Promise<{ needsConfirmation: boolean }>
  logout: () => void
  refreshPerfil: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

async function fetchPerfil(userId: string): Promise<Usuario | null> {
  const { data, error } = await supabase
    .from('perfiles')
    .select('id, email, nombre, rol, estado, estudio_id')
    .eq('id', userId)
    .single()

  if (error || !data) return null

  return {
    id: data.id,
    email: data.email,
    nombre: data.nombre,
    rol: data.rol as Rol,
    estado: data.estado as EstadoCliente,
    estudioId: data.estudio_id ?? undefined,
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session) {
        const perfil = await fetchPerfil(session.user.id)
        setUsuario(perfil)
      }
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session) {
        const perfil = await fetchPerfil(session.user.id)
        setUsuario(perfil)
      } else {
        setUsuario(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw new Error(error.message)
  }

  const signUp = async (email: string, password: string, nombre: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { nombre } },
    })
    if (error) throw new Error(error.message)
    return { needsConfirmation: !data.session }
  }

  const logout = () => {
    supabase.auth.signOut()
  }

  const refreshPerfil = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const perfil = await fetchPerfil(user.id)
    setUsuario(perfil)
  }

  return (
    <AuthContext.Provider value={{
      usuario,
      rol: usuario?.rol ?? null,
      estado: usuario?.estado ?? null,
      isAuthenticated: !!usuario,
      loading,
      signIn,
      signUp,
      logout,
      refreshPerfil,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return ctx
}
