import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Search, ChevronRight, Users } from 'lucide-react'
import type { ClienteResumen } from '@/types'
import { usuarioService } from '@/services'
import { LABELS_ESTADO_ALTA, formatFecha, cn } from '@/lib/utils'

const ESTADO_COLORES = {
  pendiente: 'text-text-faint bg-bg-3 border-border',
  agendada: 'text-teal bg-teal/8 border-teal/20',
  realizada: 'text-text-dim bg-bg-3 border-border',
} as const

export default function ListaClientes() {
  const [clientes, setClientes] = useState<ClienteResumen[]>([])
  const [busqueda, setBusqueda] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    usuarioService.listClientes().then(data => {
      setClientes(data)
      setLoading(false)
    })
  }, [])

  const filtrados = clientes.filter(c =>
    c.estudio.denominacion.toLowerCase().includes(busqueda.toLowerCase()) ||
    c.usuario.email.toLowerCase().includes(busqueda.toLowerCase())
  )

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
            <p className="text-sm text-text-dim">{clientes.length} estudios registrados</p>
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
            <div className="min-w-[560px]">
              <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_auto] gap-0 text-xs text-text-faint uppercase tracking-widest px-5 py-3 border-b border-border">
                <span>Estudio</span>
                <span>Avance</span>
                <span>Estado</span>
                <span>Fecha alta</span>
                <span>Contacto</span>
                <span />
              </div>
              {filtrados.map(({ usuario, estudio, progreso, alta }) => (
                <Link
                  key={usuario.id}
                  to={`/admin/clientes/${usuario.id}`}
                  className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_auto] gap-0 px-5 py-4 items-center border-b border-border/50 hover:bg-bg-3 transition-colors group last:border-0"
                >
                  {/* Estudio */}
                  <div>
                    <p className="text-sm font-medium text-text">{estudio.denominacion}</p>
                    <p className="text-sm text-text-faint mt-0.5">{estudio.abogadoResponsable}</p>
                  </div>

                  {/* Avance */}
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-1.5 bg-bg rounded-full overflow-hidden">
                      <div
                        className="h-full bg-teal rounded-full transition-all"
                        style={{ width: `${progreso.porcentaje}%` }}
                      />
                    </div>
                    <span className={cn('text-sm font-medium tabular-nums', progreso.porcentaje === 100 ? 'text-teal' : 'text-text-dim')}>
                      {progreso.porcentaje}%
                    </span>
                  </div>

                  {/* Estado alta */}
                  <div>
                    <span className={cn(
                      'text-xs px-2.5 py-1 rounded-full border font-medium',
                      ESTADO_COLORES[alta.estado]
                    )}>
                      {LABELS_ESTADO_ALTA[alta.estado]}
                    </span>
                  </div>

                  {/* Fecha */}
                  <span className="text-sm text-text-dim">{alta.fecha ? formatFecha(alta.fecha) : '—'}</span>

                  {/* Email */}
                  <span className="text-sm text-text-faint truncate max-w-32">{usuario.email}</span>

                  {/* Arrow */}
                  <ChevronRight className="w-4 h-4 text-text-faint group-hover:text-teal transition-colors" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
