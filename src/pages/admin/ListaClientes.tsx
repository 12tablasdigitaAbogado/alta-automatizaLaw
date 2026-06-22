import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Search, ChevronRight, ChevronLeft, Users } from 'lucide-react'
import type { ClienteResumen } from '@/types'
import { usuarioService, progresoService } from '@/services'
import { LABELS_ESTADO_ALTA, cn } from '@/lib/utils'

const PAGE_SIZE = 20

const ESTADO_COLORES = {
  pendiente: 'text-text-faint bg-bg-3 border-border',
  agendada: 'text-teal bg-teal/8 border-teal/20',
  realizada: 'text-text-dim bg-bg-3 border-border',
} as const

export default function ListaClientes() {
  const [clientes, setClientes] = useState<ClienteResumen[]>([])
  const [busqueda, setBusqueda] = useState('')
  const [loading, setLoading] = useState(true)
  const [pagina, setPagina] = useState(1)

  useEffect(() => { setPagina(1) }, [busqueda])

  useEffect(() => {
    usuarioService.listClientes().then(async data => {
      setClientes(data)
      setLoading(false)
      // Recalcula progreso en background para mantener cache actualizado
      const actualizados = await Promise.all(
        data.map(async c => {
          if (!c.estudio.id) return c
          const progreso = await progresoService.recalcularProgreso(c.estudio.id)
          return { ...c, progreso }
        })
      )
      setClientes(actualizados)
    })
  }, [])

  const filtrados = useMemo(() => clientes.filter(c =>
    c.usuario.estado === 'activo' &&
    (c.estudio.denominacion.toLowerCase().includes(busqueda.toLowerCase()) ||
    c.usuario.email.toLowerCase().includes(busqueda.toLowerCase()))
  ), [clientes, busqueda])

  const totalActivos = useMemo(() => clientes.filter(c => c.usuario.estado === 'activo').length, [clientes])
  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / PAGE_SIZE))
  const paginaSegura = Math.min(pagina, totalPaginas)
  const desde = (paginaSegura - 1) * PAGE_SIZE
  const hasta = Math.min(desde + PAGE_SIZE, filtrados.length)
  const visibles = filtrados.slice(desde, hasta)

  return (
    <div className="p-4 sm:p-6 md:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 md:mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal/10 border border-teal/25 flex items-center justify-center">
            <Users className="w-5 h-5 text-teal" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-text">Clientes</h1>
            <p className="text-sm text-text-dim">
              {totalActivos} {totalActivos === 1 ? 'cliente activo' : 'clientes activos'}
              {busqueda && filtrados.length !== totalActivos && (
                <span className="text-text-faint"> · {filtrados.length} en la búsqueda</span>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Buscador */}
      <div className="relative mb-6">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-faint" />
        <input
          type="text"
          placeholder="Buscar por estudio o email..."
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          className="w-full max-w-sm bg-bg-card border border-border rounded-xl pl-10 pr-4 py-2.5 text-sm text-text placeholder:text-text-faint outline-none focus:border-teal/40 focus:ring-1 focus:ring-teal/15 transition-colors"
        />
      </div>

      {/* Tabla */}
      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-8 h-8 border-2 border-teal/30 border-t-teal rounded-full animate-spin" />
        </div>
      ) : filtrados.length === 0 ? (
        <div className="text-center py-16 text-text-faint text-sm">
          {busqueda ? 'Sin resultados para la búsqueda.' : 'No hay clientes registrados.'}
        </div>
      ) : (
        <div className="bg-bg-card border border-border rounded-2xl overflow-hidden">
          {/* Tabla — scrollable en mobile */}
          <div className="overflow-x-auto">
            <div className="min-w-[680px]">
              <div className="grid grid-cols-[2fr_140px_140px_1.5fr_32px] gap-4 text-xs text-text-faint uppercase tracking-widest px-5 py-3 border-b border-border">
                <span>Cliente</span>
                <span>Avance</span>
                <span>Estado</span>
                <span>Contacto</span>
                <span />
              </div>
              {visibles.map(({ usuario, estudio, progreso, alta }) => (
                <Link
                  key={usuario.id}
                  to={`/admin/clientes/${usuario.id}`}
                  className="grid grid-cols-[2fr_140px_140px_1.5fr_32px] gap-4 px-5 py-4 items-center border-b border-border/50 hover:bg-bg-3 transition-colors group last:border-0"
                >
                  {/* Cliente */}
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-text truncate">{usuario.nombre}</p>
                    <p className="text-sm text-text-faint mt-0.5 truncate">{estudio.denominacion}</p>
                  </div>

                  {/* Avance */}
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-bg rounded-full overflow-hidden">
                      <div
                        className="h-full bg-success rounded-full transition-all"
                        style={{ width: `${progreso.porcentaje}%` }}
                      />
                    </div>
                    <span className={cn('text-sm font-medium tabular-nums shrink-0 w-10 text-right', progreso.porcentaje === 100 ? 'text-success' : 'text-text-dim')}>
                      {progreso.porcentaje}%
                    </span>
                  </div>

                  {/* Estado alta */}
                  <div>
                    <span className={cn(
                      'inline-block text-xs px-2.5 py-1 rounded-full border font-medium',
                      ESTADO_COLORES[alta.estado]
                    )}>
                      {LABELS_ESTADO_ALTA[alta.estado]}
                    </span>
                  </div>

                  {/* Email */}
                  <span className="text-sm text-text-faint truncate min-w-0">{usuario.email}</span>

                  {/* Arrow */}
                  <ChevronRight className="w-4 h-4 text-text-faint group-hover:text-teal transition-colors justify-self-end" />
                </Link>
              ))}
            </div>
          </div>

          {/* Paginación */}
          {filtrados.length > 0 && (
            <div className="flex items-center justify-between gap-3 px-5 py-3 border-t border-border bg-bg-card">
              <p className="text-xs text-text-faint">
                {desde + 1}–{hasta} de {filtrados.length}
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
