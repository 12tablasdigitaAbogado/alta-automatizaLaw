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
    // Importante: bajar loading PRIMERO y disparar signOut fire-and-forget —
    // si esperáramos signOut, queda colgado sobre el mismo lock que getSession
    // y el loader queda infinito igual. También limpiamos las keys sb-* de
    // localStorage para romper el lock cuando el token está corrupto.
    const timeoutId = window.setTimeout(() => {
      if (cancelled || settled) return
      setUsuario(null)
      finish()
      try {
        for (const key of Object.keys(window.localStorage)) {
          if (key.startsWith('sb-')) window.localStorage.removeItem(key)
        }
      } catch { /* noop */ }
      supabase.auth.signOut().catch(() => { /* noop */ })
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

    // IMPORTANTE: el callback de onAuthStateChange NO puede ser async ni
    // llamar directamente a otras funciones de supabase-js. supabase-js
    // mantiene un lock interno mientras corre el callback; si adentro
    // hacemos await de otro método (fetchPerfil hace un query a perfiles),
    // el lock queda trabado y las llamadas posteriores nunca resuelven.
    // Síntoma: signIn se completa pero setUsuario nunca ocurre y el
    // botón queda "Cargando..." hasta que refrescás la página.
    // Fix: deferimos el trabajo con setTimeout para salir del lock.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      window.setTimeout(async () => {
        if (cancelled) return
        if (event === 'TOKEN_REFRESHED' && !session) {
          await supabase.auth.signOut()
          if (!cancelled) setUsuario(null)
          return
        }
        if (session) {
          const perfil = await fetchPerfil(session.user.id)
          if (!cancelled) setUsuario(perfil)
        } else {
          if (!cancelled) setUsuario(null)
        }
        if (event === 'INITIAL_SESSION') {
          window.clearTimeout(timeoutId)
          finish()
        }
      }, 0)
    })

    return () => {
      cancelled = true
      window.clearTimeout(timeoutId)
      subscription.unsubscribe()
    }
  }, [])

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw new Error(error.message)
    // No confiamos solo en onAuthStateChange: si el listener quedara
    // trabado o lento, el submit termina y el usuario ve el form sin
    // navegar. Actualizamos el estado acá directamente y dejamos al
    // listener como red de seguridad (idempotente).
    if (data.user) {
      const perfil = await fetchPerfil(data.user.id)
      setUsuario(perfil)
    }
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
