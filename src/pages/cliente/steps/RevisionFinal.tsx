import { useEffect } from 'react'
import { CheckCircle2, AlertCircle, Building2, FolderOpen, Puzzle, ClipboardCheck } from 'lucide-react'
import { NavPasos } from '@/components/roadmap/NavPasos'
import { useRoadmap } from '@/context/RoadmapContext'
import { SKILL_MAP, carpetasDeSkills } from '@/data/skills'
import { LABEL_CARPETA, cn } from '@/lib/utils'

export function RevisionFinal() {
  const { estudio, documentos, configuracion, contextoEstudio, checklist, progreso, setPasoActivo, completarPaso, refrescarEstudio } = useRoadmap()

  // El wizard de 9 instancias escribe en `estudios` directo vía altaEstudioService,
  // sin pasar por RoadmapContext.saveEstudio, así que el `estudio` local puede estar
  // stale. Refrescamos al entrar acá para reflejar los datos actuales.
  useEffect(() => { refrescarEstudio() }, [refrescarEstudio])

  const handleSiguiente = () => {
    completarPaso(5)
    setPasoActivo(6)
  }

  const skillIds = configuracion.skillIds
  const carpetas = carpetasDeSkills(skillIds)

  const { identidadCompleta, checklistCompleto, desbloqueado } = progreso ?? {}

  const modelosPorCarpeta = carpetas.map(c => ({
    ...c,
    docs: documentos.filter(d => d.carpeta === c.carpeta),
    ok: documentos.filter(d => d.carpeta === c.carpeta).length >= c.minArchivos,
  }))

  const modelosOk = modelosPorCarpeta.filter(c => c.obligatorio).every(c => c.ok)

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

      {/* Alertas primero */}
      <div className="space-y-3 mb-6">
        {!identidadCompleta && (
          <div className="flex items-center gap-3 bg-coral/5 border border-coral/20 rounded-xl px-4 py-3">
            <AlertCircle className="w-4 h-4 text-coral shrink-0" />
            <p className="text-sm text-coral font-medium">Falta completar la identidad del estudio</p>
            <button onClick={() => setPasoActivo(2)} className="ml-auto text-sm text-coral hover:underline shrink-0">Ir al paso 2</button>
          </div>
        )}
        {!checklistCompleto && (
          <div className="flex items-center gap-3 bg-coral/5 border border-coral/20 rounded-xl px-4 py-3">
            <AlertCircle className="w-4 h-4 text-coral shrink-0" />
            <p className="text-sm text-coral font-medium">Falta completar el checklist técnico</p>
            <button onClick={() => setPasoActivo(4)} className="ml-auto text-sm text-coral hover:underline shrink-0">Ir al paso 4</button>
          </div>
        )}
      </div>

      {/* Identidad */}
      <div className="bg-bg-card border border-border rounded-2xl p-5 mb-4">
        <div className="flex items-center gap-2 mb-4">
          <Building2 className="w-4 h-4 text-text-dim" />
          <h2 className="text-sm font-semibold text-text">Identidad del estudio</h2>
        </div>
        {identidadCompleta ? (
          <div className="grid grid-cols-2 gap-3 text-sm">
            {([
              ['Nombre del estudio', estudio.denominacion],
              ['Domicilio real', estudio.domicilio],
              ['Domicilio constituido', estudio.domicilioConstituido],
              ['Teléfono celular', estudio.telefono],
              ['Teléfono fijo', estudio.telefonoFijo],
              ['Email', estudio.email],
            ] as [string, string | undefined][])
              .filter(([, v]) => v)
              .map(([k, v]) => (
                <div key={k}>
                  <p className="text-sm text-text-faint mb-0.5">{k}</p>
                  <p className="text-text truncate">{v}</p>
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
          <EmptyState paso={3} label="Completá las skills del estudio" onClick={() => setPasoActivo(3)} />
        ) : (
          <div className="flex flex-wrap gap-2">
            {skillIds.map(id => (
              <span key={id} className="text-sm px-2.5 py-1 bg-teal/8 text-teal rounded-full border border-teal/15">
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
          <span className="ml-auto text-sm text-text-dim">{documentos.length} archivo{documentos.length !== 1 ? 's' : ''}</span>
        </div>
        {carpetas.length === 0 ? (
          <p className="text-sm text-text-faint">No hay skills seleccionadas.</p>
        ) : modelosPorCarpeta.some(c => c.docs.length > 0) ? (
          <div className="space-y-3">
            {modelosPorCarpeta.map(c => (
              <div key={c.carpeta}>
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm text-text-dim font-medium">
                    {LABEL_CARPETA[c.carpeta] ?? c.carpeta}
                  </p>
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
                  <p className="text-sm text-text-faint pl-2">Sin archivos</p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <EmptyState paso={3} label="Subí al menos un modelo en el paso de skills" onClick={() => setPasoActivo(3)} />
        )}
      </div>


      {/* Checklist */}
      <div className="bg-bg-card border border-border rounded-2xl p-5 mb-2">
        <div className="flex items-center gap-2 mb-4">
          <ClipboardCheck className="w-4 h-4 text-text-dim" />
          <h2 className="text-sm font-semibold text-text">Checklist técnico</h2>
        </div>
        {checklistCompleto ? (
          <p className="text-sm text-teal">Todo confirmado ✓</p>
        ) : (
          <EmptyState paso={4} label="Completá el checklist técnico" onClick={() => setPasoActivo(4)} />
        )}
      </div>

      <NavPasos
        paso={6}
        onAnterior={() => setPasoActivo(4)}
        onSiguiente={handleSiguiente}
        labelSiguiente={desbloqueado ? '¡Agendar mi alta!' : 'Ver paso 6 (bloqueado)'}
      />
    </div>
  )
}

function EmptyState({ paso, label, onClick }: { paso: number; label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="text-sm text-coral hover:text-coral/80 flex items-center gap-1.5 transition-colors">
      <AlertCircle className="w-3.5 h-3.5" />
      {label} (ir al paso {paso})
    </button>
  )
}
