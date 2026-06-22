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
    let cancelled = false
    let settled = false

    const finish = () => {
      if (cancelled || settled) return
      settled = true
      setLoading(false)
    }

    // Si getSession() se cuelga por un refresh token trabado o lock interno
    // de supabase-js (pasa tras horas/días de inactividad), forzamos salir
    // del estado de loading y mostramos el login en vez de un spinner eterno.
    const timeoutId = window.setTimeout(async () => {
      if (cancelled || settled) return
      try { await supabase.auth.signOut() } catch { /* noop */ }
      setUsuario(null)
      finish()
    }, 5000)

    const init = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        if (cancelled) return
        if (error || !session) {
          setUsuario(null)
          return
        }
        const perfil = await fetchPerfil(session.user.id)
        if (cancelled) return
        if (!perfil) {
          await supabase.auth.signOut()
          setUsuario(null)
          return
        }
        setUsuario(perfil)
      } catch {
        if (!cancelled) setUsuario(null)
      } finally {
        window.clearTimeout(timeoutId)
        finish()
      }
    }

    init()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'TOKEN_REFRESHED' && !session) {
        await supabase.auth.signOut()
        setUsuario(null)
        return
      }
      if (session) {
        const perfil = await fetchPerfil(session.user.id)
        setUsuario(perfil)
      } else {
        setUsuario(null)
      }
      if (event === 'INITIAL_SESSION') {
        window.clearTimeout(timeoutId)
        finish()
      }
    })

    return () => {
      cancelled = true
      window.clearTimeout(timeoutId)
      subscription.unsubscribe()
    }
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
