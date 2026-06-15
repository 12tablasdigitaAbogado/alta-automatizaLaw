import { useState, useEffect } from 'react'
import { UserCheck, UserX, Clock, CheckCircle, XCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'

interface Solicitud {
  id: string
  email: string
  nombre: string
  estado: 'pendiente' | 'activo' | 'rechazado'
  created_at: string
}

type Filtro = 'pendiente' | 'activo' | 'rechazado'

const FILTROS: { value: Filtro; label: string }[] = [
  { value: 'pendiente', label: 'Pendientes' },
  { value: 'activo', label: 'Aprobados' },
  { value: 'rechazado', label: 'Rechazados' },
]

export default function Solicitudes() {
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([])
  const [filtro, setFiltro] = useState<Filtro>('pendiente')
  const [loading, setLoading] = useState(true)
  const [procesando, setProcesando] = useState<string | null>(null)

  const cargar = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('perfiles')
      .select('id, email, nombre, estado, created_at')
      .eq('rol', 'cliente')
      .eq('estado', filtro)
      .order('created_at', { ascending: false })
    setSolicitudes((data ?? []) as Solicitud[])
    setLoading(false)
  }

  useEffect(() => { cargar() }, [filtro])

  const cambiarEstado = async (id: string, nuevoEstado: 'activo' | 'rechazado') => {
    setProcesando(id)
    await supabase.from('perfiles').update({ estado: nuevoEstado }).eq('id', id)
    setSolicitudes(prev => prev.filter(s => s.id !== id))
    setProcesando(null)
  }

  const pendientesCount = solicitudes.length

  return (
    <div className="p-4 sm:p-6 md:p-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6 md:mb-8">
        <div className="w-10 h-10 rounded-xl bg-purple/10 border border-purple/25 flex items-center justify-center">
          <Clock className="w-5 h-5 text-purple-light" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-text">Solicitudes</h1>
          <p className="text-sm text-text-dim">
            {filtro === 'pendiente'
              ? `${pendientesCount} solicitud${pendientesCount !== 1 ? 'es' : ''} pendiente${pendientesCount !== 1 ? 's' : ''}`
              : `${pendientesCount} cliente${pendientesCount !== 1 ? 's' : ''} ${filtro === 'activo' ? 'aprobados' : 'rechazados'}`}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-bg-3 rounded-xl p-1 border border-border w-fit mb-6">
        {FILTROS.map(f => (
          <button
            key={f.value}
            onClick={() => setFiltro(f.value)}
            className={cn(
              'px-4 py-1.5 text-sm font-medium rounded-lg transition-all',
              filtro === f.value
                ? 'bg-bg-card text-text border border-border shadow-sm'
                : 'text-text-dim hover:text-text'
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Lista */}
      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-8 h-8 border-2 border-teal/30 border-t-teal rounded-full animate-spin" />
        </div>
      ) : solicitudes.length === 0 ? (
        <div className="text-center py-16 text-text-faint text-sm">
          {filtro === 'pendiente' ? 'No hay solicitudes pendientes.' :
           filtro === 'activo' ? 'No hay clientes aprobados aún.' :
           'No hay solicitudes rechazadas.'}
        </div>
      ) : (
        <div className="bg-bg-card border border-border rounded-2xl overflow-hidden">
          {solicitudes.map((s, i) => (
            <div
              key={s.id}
              className={cn(
                'flex items-center justify-between px-5 py-4 gap-4',
                i < solicitudes.length - 1 && 'border-b border-border/50'
              )}
            >
              {/* Info */}
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-full bg-bg-3 border border-border flex items-center justify-center shrink-0">
                  <span className="text-sm font-semibold text-text-dim">
                    {s.nombre.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-text truncate">{s.nombre}</p>
                  <p className="text-xs text-text-faint truncate">{s.email}</p>
                </div>
              </div>

              {/* Fecha */}
              <span className="text-xs text-text-faint shrink-0 hidden sm:block">
                {new Date(s.created_at).toLocaleDateString('es-AR', {
                  day: '2-digit', month: 'short', year: 'numeric'
                })}
              </span>

              {/* Badge estado (para no-pendientes) o Acciones */}
              {filtro === 'pendiente' ? (
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => cambiarEstado(s.id, 'rechazado')}
                    disabled={procesando === s.id}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-coral border border-coral/20 bg-coral/5 hover:bg-coral/10 transition-colors disabled:opacity-40"
                  >
                    <UserX className="w-3.5 h-3.5" />
                    Rechazar
                  </button>
                  <button
                    onClick={() => cambiarEstado(s.id, 'activo')}
                    disabled={procesando === s.id}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-teal border border-teal/20 bg-teal/5 hover:bg-teal/10 transition-colors disabled:opacity-40"
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    Aprobar
                  </button>
                </div>
              ) : (
                <span className={cn(
                  'flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border shrink-0',
                  filtro === 'activo'
                    ? 'text-teal bg-teal/8 border-teal/20'
                    : 'text-coral bg-coral/8 border-coral/20'
                )}>
                  {filtro === 'activo'
                    ? <><CheckCircle className="w-3 h-3" /> Aprobado</>
                    : <><XCircle className="w-3 h-3" /> Rechazado</>}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
