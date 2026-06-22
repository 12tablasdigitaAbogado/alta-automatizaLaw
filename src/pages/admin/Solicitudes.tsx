import { useState, useEffect } from 'react'
import { UserCheck, UserX, Clock, CheckCircle, XCircle, ChevronLeft, ChevronRight } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'

const PAGE_SIZE = 20

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
  const [pagina, setPagina] = useState(1)
  const [counts, setCounts] = useState<Record<Filtro, number>>({ pendiente: 0, activo: 0, rechazado: 0 })

  useEffect(() => { setPagina(1) }, [filtro])

  const cargarCounts = async () => {
    const estados: Filtro[] = ['pendiente', 'activo', 'rechazado']
    const results = await Promise.all(
      estados.map(e =>
        supabase.from('perfiles').select('id', { count: 'exact', head: true }).eq('rol', 'cliente').eq('estado', e)
      )
    )
    setCounts({
      pendiente: results[0].count ?? 0,
      activo: results[1].count ?? 0,
      rechazado: results[2].count ?? 0,
    })
  }

  useEffect(() => { cargarCounts() }, [])

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
    setCounts(prev => ({
      ...prev,
      [filtro]: Math.max(0, prev[filtro] - 1),
      [nuevoEstado]: prev[nuevoEstado] + 1,
    }))
    setProcesando(null)
  }

  const total = solicitudes.length
  const totalPaginas = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const paginaSegura = Math.min(pagina, totalPaginas)
  const desde = (paginaSegura - 1) * PAGE_SIZE
  const hasta = Math.min(desde + PAGE_SIZE, total)
  const visibles = solicitudes.slice(desde, hasta)

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
            <span className="text-warning">{counts.pendiente} pendientes</span>
            <span className="text-text-faint"> · </span>
            <span className="text-teal">{counts.activo} aprobados</span>
            <span className="text-text-faint"> · </span>
            <span className="text-coral">{counts.rechazado} rechazados</span>
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
              'flex items-center gap-2 px-4 py-1.5 text-sm font-medium rounded-lg transition-all',
              filtro === f.value
                ? 'bg-bg-card text-text border border-border shadow-sm'
                : 'text-text-dim hover:text-text'
            )}
          >
            {f.label}
            <span className={cn(
              'text-xs tabular-nums px-1.5 py-0.5 rounded-md',
              filtro === f.value ? 'bg-bg-3 text-text-dim' : 'bg-bg-card text-text-faint'
            )}>
              {counts[f.value]}
            </span>
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
          {visibles.map((s, i) => (
            <div
              key={s.id}
              className={cn(
                'grid grid-cols-[1.2fr_1.4fr_110px_200px] items-center px-5 py-4 gap-4',
                i < visibles.length - 1 && 'border-b border-border/50'
              )}
            >
              {/* Nombre */}
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-full bg-bg-3 border border-border flex items-center justify-center shrink-0">
                  <span className="text-sm font-semibold text-text-dim">
                    {s.nombre.charAt(0).toUpperCase()}
                  </span>
                </div>
                <p className="text-sm font-medium text-text truncate">{s.nombre}</p>
              </div>

              {/* Email */}
              <p className="text-sm text-text-dim truncate min-w-0">{s.email}</p>

              {/* Fecha */}
              <span className="text-xs text-text-dim tabular-nums hidden sm:block">
                {new Date(s.created_at).toLocaleDateString('es-AR', {
                  day: '2-digit', month: '2-digit', year: 'numeric'
                })}
              </span>

              {/* Badge estado (para no-pendientes) o Acciones */}
              {filtro === 'pendiente' ? (
                <div className="flex items-center gap-2 justify-end">
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
                  'inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border w-fit justify-self-end',
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

          {/* Paginación */}
          {total > 0 && (
            <div className="flex items-center justify-between gap-3 px-5 py-3 border-t border-border">
              <p className="text-xs text-text-faint">
                {desde + 1}–{hasta} de {total}
              </p>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setPagina(p => Math.max(1, p - 1))}
                  disabled={paginaSegura <= 1}
                  className="w-8 h-8 flex items-center justify-center rounded-lg border border-border text-text-dim hover:bg-bg-3 hover:text-text disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  aria-label="Página anterior"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-sm text-text-dim tabular-nums px-3">
                  {paginaSegura} / {totalPaginas}
                </span>
                <button
                  type="button"
                  onClick={() => setPagina(p => Math.min(totalPaginas, p + 1))}
                  disabled={paginaSegura >= totalPaginas}
                  className="w-8 h-8 flex items-center justify-center rounded-lg border border-border text-text-dim hover:bg-bg-3 hover:text-text disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  aria-label="Página siguiente"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
