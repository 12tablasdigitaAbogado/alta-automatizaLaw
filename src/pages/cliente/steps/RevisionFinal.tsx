import { CheckCircle2, AlertCircle, Building2, FolderOpen, Puzzle, ClipboardCheck, BookOpen } from 'lucide-react'
import { NavPasos } from '@/components/roadmap/NavPasos'
import { useRoadmap } from '@/context/RoadmapContext'
import { SKILL_MAP, carpetasDeSkills, camposContextoDeSkills } from '@/data/skills'
import { LABELS_CONECTOR, LABEL_CARPETA, cn } from '@/lib/utils'

export function RevisionFinal() {
  const { estudio, documentos, configuracion, contextoEstudio, checklist, progreso, setPasoActivo, completarPaso } = useRoadmap()

  const handleSiguiente = () => {
    completarPaso(6)
    setPasoActivo(7)
  }

  const skillIds = configuracion.skillIds
  const carpetas = carpetasDeSkills(skillIds)
  const camposContexto = camposContextoDeSkills(skillIds)

  // Gating items
  const { identidadCompleta, checklistCompleto, desbloqueado } = progreso ?? {}

  const modelosPorCarpeta = carpetas.map(c => ({
    ...c,
    docs: documentos.filter(d => d.carpeta === c.carpeta),
    ok: documentos.filter(d => d.carpeta === c.carpeta).length >= c.minArchivos,
  }))

  const modelosOk = modelosPorCarpeta.filter(c => c.obligatorio).every(c => c.ok)

  const contextoObligatorio = camposContexto.filter(c => c.obligatorio)
  const contextoOk = contextoObligatorio.every(c => !!(contextoEstudio[c.id]?.trim()))

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
        desbloqueado ? 'bg-teal/5 border-teal/25' : 'bg-bg-card border-border'
      )}>
        <p className={cn('text-sm font-semibold mb-3', desbloqueado ? 'text-teal' : 'text-text')}>
          {desbloqueado ? '¡Listo para agendar!' : 'Aún faltan requisitos obligatorios'}
        </p>
        <div className="space-y-2">
          {[
            { ok: identidadCompleta, label: 'Identidad del estudio completa' },
            { ok: modelosOk, label: 'Modelos obligatorios cargados' },
            { ok: contextoOk || camposContexto.filter(c => c.obligatorio).length === 0, label: 'Contexto laboral completo' },
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

      {/* Identidad */}
      <div className="bg-bg-card border border-border rounded-2xl p-5 mb-4">
        <div className="flex items-center gap-2 mb-4">
          <Building2 className="w-4 h-4 text-text-dim" />
          <h2 className="text-sm font-semibold text-text">Identidad del estudio</h2>
        </div>
        {estudio.denominacion ? (
          <div className="grid grid-cols-2 gap-3 text-sm">
            {([
              ['Denominación', estudio.denominacion],
              ['Abogado/a', estudio.abogadoResponsable],
              ['Matrícula', estudio.matricula],
              ['Domicilio', estudio.domicilio],
              ['Teléfono', estudio.telefono],
              ['Email', estudio.email],
            ] as [string, string | undefined][]).map(([k, v]) => (
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

      {/* Skills y modelos */}
      <div className="bg-bg-card border border-border rounded-2xl p-5 mb-4">
        <div className="flex items-center gap-2 mb-4">
          <Puzzle className="w-4 h-4 text-text-dim" />
          <h2 className="text-sm font-semibold text-text">Skills activadas</h2>
        </div>
        {skillIds.length === 0 ? (
          <EmptyState paso={3} label="Seleccioná las skills del estudio" onClick={() => setPasoActivo(3)} />
        ) : (
          <div className="flex flex-wrap gap-2">
            {skillIds.map(id => (
              <span key={id} className="text-xs px-2.5 py-1 bg-teal/8 text-teal rounded-full border border-teal/15">
                {SKILL_MAP[id]?.nombre ?? id}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Modelos cargados */}
      <div className="bg-bg-card border border-border rounded-2xl p-5 mb-4">
        <div className="flex items-center gap-2 mb-4">
          <FolderOpen className="w-4 h-4 text-text-dim" />
          <h2 className="text-sm font-semibold text-text">Modelos cargados</h2>
          <span className="ml-auto text-xs text-text-dim">{documentos.length} archivo{documentos.length !== 1 ? 's' : ''}</span>
        </div>
        {carpetas.length === 0 ? (
          <p className="text-xs text-text-faint">No hay skills seleccionadas.</p>
        ) : modelosPorCarpeta.some(c => c.docs.length > 0) ? (
          <div className="space-y-3">
            {modelosPorCarpeta.map(c => (
              <div key={c.carpeta}>
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-xs text-text-dim font-medium">
                    {LABEL_CARPETA[c.carpeta] ?? c.carpeta}
                  </p>
                  {c.obligatorio && !c.ok && (
                    <span className="text-xs text-coral">faltan archivos</span>
                  )}
                </div>
                {c.docs.length > 0 ? (
                  <div className="space-y-1 pl-2">
                    {c.docs.map(doc => (
                      <div key={doc.id} className="text-sm text-text-dim flex items-center gap-2">
                        <span className="text-teal/50">·</span> {doc.nombre}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-text-faint pl-2">Sin archivos</p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <EmptyState paso={4} label="Subí al menos un modelo obligatorio" onClick={() => setPasoActivo(4)} />
        )}
      </div>

      {/* Contexto laboral */}
      {camposContexto.length > 0 && (
        <div className="bg-bg-card border border-border rounded-2xl p-5 mb-4">
          <div className="flex items-center gap-2 mb-4">
            <BookOpen className="w-4 h-4 text-text-dim" />
            <h2 className="text-sm font-semibold text-text">Contexto laboral</h2>
          </div>
          <div className="space-y-2">
            {camposContexto.slice(0, 4).map(campo => (
              <div key={campo.id} className="flex items-start gap-2">
                <span className="text-xs text-text-faint min-w-0 w-36 shrink-0">{campo.label}</span>
                <span className="text-xs text-text truncate">
                  {contextoEstudio[campo.id] || <span className="text-text-faint italic">—</span>}
                </span>
              </div>
            ))}
            {camposContexto.length > 4 && (
              <p className="text-xs text-text-faint">+{camposContexto.length - 4} campos más</p>
            )}
          </div>
          {!contextoOk && (
            <button
              onClick={() => setPasoActivo(2)}
              className="flex items-center gap-1.5 text-xs text-coral hover:text-coral/80 mt-3 transition-colors"
            >
              <AlertCircle className="w-3.5 h-3.5" />
              Completar contexto obligatorio (ir al paso 2)
            </button>
          )}
        </div>
      )}

      {/* Checklist */}
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

      {/* Conectores */}
      {configuracion.conectores.length > 0 && (
        <div className="bg-bg-card border border-border rounded-2xl p-5 mb-2">
          <div className="flex items-center gap-2 mb-3">
            <Puzzle className="w-4 h-4 text-text-dim" />
            <h2 className="text-sm font-semibold text-text">Conectores</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {configuracion.conectores.map(c => (
              <span key={c} className="text-xs px-2.5 py-1 bg-purple/8 text-purple-light rounded-full border border-purple/15">
                {LABELS_CONECTOR[c]}
              </span>
            ))}
          </div>
        </div>
      )}

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
