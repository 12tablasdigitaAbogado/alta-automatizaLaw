import { CheckCircle2, AlertCircle, Building2, FolderOpen, Puzzle, ClipboardCheck } from 'lucide-react'
import { NavPasos } from '@/components/roadmap/NavPasos'
import { useRoadmap } from '@/context/RoadmapContext'
import { LABELS_CATEGORIA, LABELS_MODULO, LABELS_CONECTOR, cn } from '@/lib/utils'
import type { CategoriaDocumento } from '@/types'

const CATEGORIAS: CategoriaDocumento[] = ['cartas-documento', 'demandas', 'contratos', 'escritos-varios']

export function RevisionFinal() {
  const { estudio, documentos, configuracion, checklist, progreso, setPasoActivo, completarPaso } = useRoadmap()

  const handleSiguiente = () => {
    completarPaso(6)
    setPasoActivo(7)
  }

  const { identidadCompleta, tieneDocumentos, checklistCompleto, desbloqueado } = progreso ?? {}

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-teal/10 border border-teal/25 flex items-center justify-center">
          <CheckCircle2 className="w-5 h-5 text-teal" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-text">Revisión final</h1>
          <p className="text-sm text-text-dim">Verificá que todo esté completo antes de agendar tu alta.</p>
        </div>
      </div>

      {/* Estado del gating */}
      <div className={cn(
        'rounded-2xl p-5 mb-6 border',
        desbloqueado
          ? 'bg-teal/5 border-teal/25'
          : 'bg-bg-card border-border'
      )}>
        <p className={cn('text-sm font-semibold mb-3', desbloqueado ? 'text-teal' : 'text-text')}>
          {desbloqueado ? '¡Listo para agendar!' : 'Aún faltan requisitos obligatorios'}
        </p>
        <div className="space-y-2">
          {[
            { ok: identidadCompleta, label: 'Identidad del estudio completa' },
            { ok: tieneDocumentos, label: 'Al menos un modelo cargado' },
            { ok: checklistCompleto, label: 'Checklist técnico completado' },
          ].map(({ ok, label }) => (
            <div key={label} className="flex items-center gap-2.5">
              {ok ? (
                <CheckCircle2 className="w-4 h-4 text-teal shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-coral shrink-0" />
              )}
              <span className={cn('text-sm', ok ? 'text-text' : 'text-text-dim')}>{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Resumen: Identidad */}
      <div className="bg-bg-card border border-border rounded-2xl p-5 mb-4">
        <div className="flex items-center gap-2 mb-4">
          <Building2 className="w-4 h-4 text-text-dim" />
          <h2 className="text-sm font-semibold text-text">Identidad del estudio</h2>
        </div>
        {estudio.denominacion ? (
          <div className="grid grid-cols-2 gap-3 text-sm">
            {[
              ['Denominación', estudio.denominacion],
              ['Abogado/a', estudio.abogadoResponsable],
              ['Matrícula', estudio.matricula],
              ['Domicilio', estudio.domicilio],
              ['Teléfono', estudio.telefono],
              ['Email', estudio.email],
              ['Jurisdicción', estudio.jurisdiccion],
              ['Fuero', estudio.fueroPrincipal],
            ].map(([k, v]) => (
              <div key={k}>
                <p className="text-xs text-text-faint mb-0.5">{k}</p>
                <p className="text-text truncate">{v || '—'}</p>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState paso={2} label="Completá los datos del estudio" onClick={() => setPasoActivo(2)} />
        )}
      </div>

      {/* Resumen: Modelos */}
      <div className="bg-bg-card border border-border rounded-2xl p-5 mb-4">
        <div className="flex items-center gap-2 mb-4">
          <FolderOpen className="w-4 h-4 text-text-dim" />
          <h2 className="text-sm font-semibold text-text">Modelos cargados</h2>
          <span className="ml-auto text-xs text-text-dim">{documentos.length} archivo{documentos.length !== 1 ? 's' : ''}</span>
        </div>
        {documentos.length > 0 ? (
          <div className="space-y-2">
            {CATEGORIAS.filter(c => documentos.some(d => d.categoria === c)).map(cat => (
              <div key={cat}>
                <p className="text-xs text-text-faint mb-1">{LABELS_CATEGORIA[cat]}</p>
                <div className="space-y-1">
                  {documentos.filter(d => d.categoria === cat).map(doc => (
                    <div key={doc.id} className="text-sm text-text-dim flex items-center gap-2">
                      <span className="text-teal/50">·</span> {doc.nombre}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState paso={3} label="Subí al menos un modelo" onClick={() => setPasoActivo(3)} />
        )}
      </div>

      {/* Resumen: Módulos */}
      <div className="bg-bg-card border border-border rounded-2xl p-5 mb-4">
        <div className="flex items-center gap-2 mb-4">
          <Puzzle className="w-4 h-4 text-text-dim" />
          <h2 className="text-sm font-semibold text-text">Módulos y conectores</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          {configuracion.modulos.length === 0 && configuracion.conectores.length === 0 ? (
            <p className="text-xs text-text-faint">Ninguno seleccionado (opcional)</p>
          ) : (
            <>
              {configuracion.modulos.map(m => (
                <span key={m} className="text-xs px-2.5 py-1 bg-teal/8 text-teal rounded-full border border-teal/15">
                  {LABELS_MODULO[m]}
                </span>
              ))}
              {configuracion.conectores.map(c => (
                <span key={c} className="text-xs px-2.5 py-1 bg-purple/8 text-purple-light rounded-full border border-purple/15">
                  {LABELS_CONECTOR[c]}
                </span>
              ))}
            </>
          )}
        </div>
      </div>

      {/* Resumen: Checklist */}
      <div className="bg-bg-card border border-border rounded-2xl p-5 mb-2">
        <div className="flex items-center gap-2 mb-4">
          <ClipboardCheck className="w-4 h-4 text-text-dim" />
          <h2 className="text-sm font-semibold text-text">Checklist técnico</h2>
        </div>
        {checklistCompleto ? (
          <p className="text-sm text-teal">Todo confirmado ✓</p>
        ) : (
          <EmptyState paso={5} label="Completá el checklist técnico" onClick={() => setPasoActivo(5)} />
        )}
      </div>

      <NavPasos
        paso={6}
        onAnterior={() => setPasoActivo(5)}
        onSiguiente={handleSiguiente}
        labelSiguiente={desbloqueado ? '¡Agendar mi alta!' : 'Ver paso 7 (bloqueado)'}
      />
    </div>
  )
}

function EmptyState({ paso, label, onClick }: { paso: number; label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="text-xs text-coral hover:text-coral/80 flex items-center gap-1.5 transition-colors">
      <AlertCircle className="w-3.5 h-3.5" />
      {label} (ir al paso {paso})
    </button>
  )
}
