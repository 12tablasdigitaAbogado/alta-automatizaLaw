import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Zap, Mail, Lock, User, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'

type Mode = 'login' | 'register'

export default function Login() {
  const { signIn, signUp, isAuthenticated, rol, loading } = useAuth()
  const navigate = useNavigate()

  const [mode, setMode] = useState<Mode>('login')
  const [nombre, setNombre] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirmationSent, setConfirmationSent] = useState(false)

  useEffect(() => {
    if (!isAuthenticated) return
    navigate(rol === 'operador' ? '/admin/clientes' : '/cliente/onboarding', { replace: true })
  }, [isAuthenticated, rol, navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      if (mode === 'login') {
        await signIn(email, password)
      } else {
        const { needsConfirmation } = await signUp(email, password, nombre)
        if (needsConfirmation) setConfirmationSent(true)
      }
    } catch (err) {
      setError(err instanceof Error ? translateError(err.message) : 'Ocurrió un error')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return null

  if (confirmationSent) {
    return (
      <Screen>
        <div className="text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-teal/10 border border-teal/30 flex items-center justify-center mx-auto glow-teal">
            <Mail className="w-7 h-7 text-teal" />
          </div>
          <h2 className="text-xl font-bold text-text">Revisá tu email</h2>
          <p className="text-text-dim text-sm leading-relaxed">
            Te enviamos un link de confirmación a <span className="text-text font-medium">{email}</span>.
            Hacé click en el link y después iniciá sesión.
          </p>
          <button
            onClick={() => { setConfirmationSent(false); setMode('login') }}
            className="btn-primary w-full mt-2"
          >
            Ir al login
          </button>
        </div>
      </Screen>
    )
  }

  return (
    <Screen>
      <div className="text-center mb-8">
        <div className="w-14 h-14 rounded-2xl bg-teal/10 border border-teal/30 flex items-center justify-center mx-auto mb-4 glow-teal">
          <Zap className="w-7 h-7 text-teal" />
        </div>
        <h1 className="text-2xl font-bold text-text tracking-tight">AutomatizaLaw</h1>
        <p className="text-text-dim text-sm mt-1">Automatizá tu estudio jurídico con IA</p>
      </div>

      <div className="flex bg-bg-3 rounded-xl p-1 mb-5 border border-border">
        {(['login', 'register'] as Mode[]).map(m => (
          <button
            key={m}
            onClick={() => { setMode(m); setError(null) }}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
              mode === m ? 'bg-teal text-bg shadow-sm' : 'text-text-dim hover:text-text'
            }`}
          >
            {m === 'login' ? 'Iniciar sesión' : 'Registrarse'}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        {mode === 'register' && (
          <Field icon={<User className="w-4 h-4" />} label="Nombre">
            <input
              type="text"
              value={nombre}
              onChange={e => setNombre(e.target.value)}
              placeholder="Tu nombre"
              required
              className="input-field"
            />
          </Field>
        )}

        <Field icon={<Mail className="w-4 h-4" />} label="Email">
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="tu@email.com"
            required
            className="input-field"
          />
        </Field>

        <Field
          icon={<Lock className="w-4 h-4" />}
          label="Contraseña"
          action={
            <button type="button" onClick={() => setShowPassword(v => !v)} className="text-text-faint hover:text-text-dim transition-colors">
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          }
        >
          <input
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            minLength={6}
            className="input-field"
          />
        </Field>

        {error && <p className="text-coral text-xs px-1">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="btn-primary w-full mt-1 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? 'Cargando...' : mode === 'login' ? 'Entrar' : 'Crear cuenta'}
        </button>
      </form>
    </Screen>
  )
}

function Screen({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-teal/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-purple/5 rounded-full blur-3xl" />
      </div>
      <div className="relative w-full max-w-sm animate-fade-in-up">
        <div className="bg-bg-card border border-border rounded-2xl p-6">
          {children}
        </div>
      </div>
    </div>
  )
}

function Field({
  icon, label, action, children,
}: {
  icon: React.ReactNode
  label: string
  action?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs text-text-dim font-medium px-1">{label}</label>
      <div className="relative flex items-center bg-bg-3 border border-border rounded-xl px-3 gap-2 focus-within:border-teal/50 transition-colors">
        <span className="text-text-faint shrink-0">{icon}</span>
        <div className="flex-1">{children}</div>
        {action && <span className="shrink-0">{action}</span>}
      </div>
    </div>
  )
}

function translateError(msg: string): string {
  if (msg.includes('Invalid login credentials')) return 'Email o contraseña incorrectos'
  if (msg.includes('Email not confirmed')) return 'Confirmá tu email antes de iniciar sesión'
  if (msg.includes('User already registered')) return 'Ya existe una cuenta con ese email'
  if (msg.includes('Password should be')) return 'La contraseña debe tener al menos 6 caracteres'
  if (msg.includes('email_address_invalid')) return 'Usá un email real (Gmail, Outlook, etc.)'
  return msg
}
