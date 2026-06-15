import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  ArrowLeft, Download, ExternalLink, CheckSquare, Square,
  Users, Puzzle, CalendarDays, FolderOpen
} from 'lucide-react'
import { BloqueInstrucciones } from '@/components/admin/BloqueInstrucciones'
import type { ClienteResumen, RunbookItem } from '@/types'
import { usuarioService, documentoService } from '@/services'
import { RUNBOOK_PASOS } from '@/mocks/altas'
import { LABELS_MODULO, LABELS_CONECTOR, LABELS_ESTADO_ALTA, formatFecha, cn } from '@/lib/utils'
import { MOCK_CONFIGURACION } from '@/mocks/progreso'

export default function FichaCliente() {
  const { id } = useParams<{ id: string }>()
  const [data, setData] = useState<ClienteResumen | null>(null)
  const [loading, setLoading] = useState(true)
  const [runbook, setRunbook] = useState<RunbookItem[]>(
    RUNBOOK_PASOS.map(p => ({ ...p, completado: false }))
  )
  const [zipDescargado, setZipDescargado] = useState(false)

  useEffect(() => {
    if (!id) return
    usuarioService.listClientes().then(clientes => {
      const cliente = clientes.find(c => c.usuario.id === id)
      setData(cliente ?? null)
      setLoading(false)
    })
  }, [id])

  const toggleRunbook = (itemId: string) => {
    setRunbook(prev => prev.map(r => r.id === itemId ? { ...r, completado: !r.completado } : r))
  }

  const handleZip = () => {
    // TODO Fase 2: generar y descargar el ZIP real con los modelos del estudio.
    // Por ahora muestra un mensaje.
    setZipDescargado(true)
    setTimeout(() => setZipDescargado(false), 3000)
    alert('TODO Fase 2: acá se descargará el ZIP con los modelos organizados por categoría.')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-2 border-teal/30 border-t-teal rounded-full animate-spin" />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="p-8 text-center text-text-dim">
        <p>Cliente no encontrado.</p>
        <Link to="/admin/clientes" className="text-teal text-sm mt-2 inline-block hover:underline">
          Volver a la lista
        </Link>
      </div>
    )
  }

  const { usuario, estudio, progreso, alta } = data
  const config = MOCK_CONFIGURACION[estudio.id] ?? { modulos: [], conectores: [] }
  const runoookCompletados = runbook.filter(r => r.completado).length

  return (
    <div className="p-8 max-w-4xl">
      {/* Back */}
      <Link to="/admin/clientes" className="flex items-center gap-1.5 text-sm text-text-dim hover:text-text mb-6 transition-colors w-fit">
        <ArrowLeft className="w-4 h-4" />
        Volver a clientes
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-text">{estudio.denominacion}</h1>
          <p className="text-text-dim mt-1">{estudio.abogadoResponsable} · {usuario.email}</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Estado */}
          <span className={cn(
            'text-xs px-3 py-1.5 rounded-full border font-medium',
            alta.estado === 'agendada' ? 'text-teal bg-teal/8 border-teal/20' :
            alta.estado === 'realizada' ? 'text-text-dim bg-bg-3 border-border' :
            'text-text-faint bg-bg-3 border-border'
          )}>
            {LABELS_ESTADO_ALTA[alta.estado]}
          </span>
          {/* Progreso */}
          <div className="flex items-center gap-2 bg-bg-card border border-border px-3 py-1.5 rounded-full">
            <div className="w-16 h-1.5 bg-bg rounded-full overflow-hidden">
              <div className="h-full bg-teal rounded-full" style={{ width: `${progreso.porcentaje}%` }} />
            </div>
            <span className="text-xs text-teal font-medium">{progreso.porcentaje}%</span>
          </div>
        </div>
      </div>

      {/* Reunión info */}
      {alta.estado === 'agendada' && (
        <div className="flex items-center gap-3 bg-teal/5 border border-teal/20 rounded-2xl p-4 mb-6">
          <CalendarDays className="w-5 h-5 text-teal shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-teal">Alta agendada</p>
            <p className="text-xs text-text-dim mt-0.5">
              {alta.fecha && formatFecha(alta.fecha)} · {alta.horaInicio}–{alta.horaFin}
            </p>
          </div>
          {alta.linkMeet && (
            <a
              href={alta.linkMeet}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs text-teal border border-teal/30 px-3 py-1.5 rounded-lg hover:bg-teal/8 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Abrir Meet
            </a>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Col izquierda */}
        <div className="space-y-5">
          {/* Instrucciones globales */}
          <BloqueInstrucciones estudio={estudio} />

          {/* Modelos / ZIP */}
          <div className="bg-bg-card border border-border rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <FolderOpen className="w-4 h-4 text-text-dim" />
              <h3 className="text-sm font-semibold text-text">Modelos del estudio</h3>
            </div>
            <p className="text-xs text-text-dim mb-4">
              Descargá el ZIP con todos los modelos organizados por categoría, listo para copiar a la PC del cliente.
            </p>
            <button
              onClick={handleZip}
              className={cn(
                'flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all w-full justify-center',
                zipDescargado
                  ? 'bg-teal/10 text-teal border border-teal/25'
                  : 'bg-bg-3 border border-border text-text-dim hover:border-teal/30 hover:text-teal'
              )}
            >
              <Download className="w-4 h-4" />
              {zipDescargado ? 'Procesando... (TODO Fase 2)' : 'Descargar ZIP de modelos'}
            </button>
            {/* TODO Fase 2: generar ZIP con JSZip o desde Supabase Storage */}
          </div>

          {/* Conectores */}
          <div className="bg-bg-card border border-border rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Puzzle className="w-4 h-4 text-text-dim" />
              <h3 className="text-sm font-semibold text-text">Conectores a habilitar</h3>
            </div>
            {config.conectores.length === 0 ? (
              <p className="text-xs text-text-faint">El cliente no seleccionó conectores.</p>
            ) : (
              <div className="space-y-2">
                {config.conectores.map(c => (
                  <div key={c} className="flex items-center gap-2.5 text-sm">
                    <div className="w-4 h-4 rounded-full bg-purple/10 border border-purple/20 flex items-center justify-center shrink-0">
                      <span className="text-purple-light text-xs">·</span>
                    </div>
                    <span className="text-text">{LABELS_CONECTOR[c]}</span>
                  </div>
                ))}
              </div>
            )}
            {config.modulos.length > 0 && (
              <>
                <div className="border-t border-border my-4" />
                <p className="text-xs text-text-faint mb-2">Skills seleccionadas</p>
                <div className="flex flex-wrap gap-2">
                  {config.modulos.map(m => (
                    <span key={m} className="text-xs px-2.5 py-1 bg-teal/6 text-teal rounded-full border border-teal/15">
                      {LABELS_MODULO[m]}
                    </span>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Col derecha: Runbook */}
        <div>
          <div className="bg-bg-card border border-border rounded-2xl p-5 sticky top-8">
            <div className="flex items-center gap-2 mb-1">
              <Users className="w-4 h-4 text-text-dim" />
              <h3 className="text-sm font-semibold text-text">Runbook del setup-day</h3>
            </div>
            <p className="text-xs text-text-dim mb-4">
              Tildá cada paso mientras lo completás en la reunión.
            </p>

            {/* Progress del runbook */}
            <div className="flex items-center gap-2 mb-4">
              <div className="flex-1 h-1.5 bg-bg rounded-full overflow-hidden">
                <div
                  className="h-full bg-teal rounded-full transition-all duration-300"
                  style={{ width: `${(runoookCompletados / runbook.length) * 100}%` }}
                />
              </div>
              <span className="text-xs text-text-dim tabular-nums">{runoookCompletados}/{runbook.length}</span>
            </div>

            <div className="space-y-2">
              {runbook.map(item => (
                <button
                  key={item.id}
                  onClick={() => toggleRunbook(item.id)}
                  className={cn(
                    'w-full flex items-start gap-3 p-3 rounded-xl text-left transition-all',
                    item.completado ? 'bg-teal/5' : 'hover:bg-bg-3'
                  )}
                >
                  {item.completado ? (
                    <CheckSquare className="w-4 h-4 text-teal shrink-0 mt-0.5" />
                  ) : (
                    <Square className="w-4 h-4 text-text-faint shrink-0 mt-0.5" />
                  )}
                  <span className={cn(
                    'text-xs leading-relaxed',
                    item.completado ? 'text-text-dim line-through' : 'text-text'
                  )}>
                    {item.label}
                  </span>
                </button>
              ))}
            </div>

            {runoookCompletados === runbook.length && (
              <div className="mt-4 bg-teal/8 border border-teal/20 rounded-xl p-3 text-center">
                <p className="text-xs text-teal font-medium">¡Alta completada!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
