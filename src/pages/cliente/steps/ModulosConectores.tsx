import { useState, useEffect } from 'react'
import { Puzzle } from 'lucide-react'
import { NavPasos } from '@/components/roadmap/NavPasos'
import { useRoadmap } from '@/context/RoadmapContext'
import type { ConectorId, SkillId } from '@/types'
import type { CampoContexto } from '@/data/skills'
import { SKILLS } from '@/data/skills'
import { LABELS_CONECTOR, cn } from '@/lib/utils'

const CONECTORES_DISPONIBLES: { id: ConectorId; desc: string; icono: string }[] = [
  { id: 'google-drive', desc: 'Leé y guardá documentos directamente en tu Drive.', icono: '📁' },
  { id: 'google-calendar', desc: 'Agendá vencimientos y audiencias automáticamente.', icono: '📅' },
]

export function ModulosConectores() {
  const { configuracion, contextoEstudio, saveConfiguracion, saveContextoEstudio, setPasoActivo, completarPaso } = useRoadmap()
  const [skillIds, setSkillIds] = useState<SkillId[]>([])
  const [conectores, setConectores] = useState<ConectorId[]>([])
  const [contexto, setContexto] = useState<Record<string, string>>({})

  useEffect(() => {
    setSkillIds(configuracion.skillIds)
    setConectores(configuracion.conectores)
    setContexto(contextoEstudio)
  }, [configuracion, contextoEstudio])

  const toggleSkill = (id: SkillId) =>
    setSkillIds(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id])

  const toggleConector = (id: ConectorId) =>
    setConectores(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id])

  const handleContexto = (id: string, value: string) =>
    setContexto(prev => ({ ...prev, [id]: value }))

  const handleSiguiente = async () => {
    await Promise.all([
      saveConfiguracion({ skillIds, conectores }),
      saveContextoEstudio(contexto),
    ])
    completarPaso(3)
    setPasoActivo(4)
  }

  // Track which context field IDs have already been rendered (dedup across skills)
  const camposRendered = new Set<string>()

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-teal/10 border border-teal/25 flex items-center justify-center">
          <Puzzle className="w-5 h-5 text-teal" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-text">Skills y conectores</h1>
          <p className="text-sm text-text-dim">
            Seleccioná las skills que querés activar. Al tildar cada una, aparecen sus campos de contexto.
          </p>
        </div>
      </div>

      {/* Skills */}
      <div className="mb-6">
        <h2 className="text-sm font-semibold text-text mb-3">Skills jurídicas laborales</h2>
        <div className="space-y-3">
          {SKILLS.map(skill => {
            const seleccionado = skillIds.includes(skill.id)

            // Campos de esta skill que aún no se mostraron en una skill anterior
            const camposNuevos: CampoContexto[] = []
            if (seleccionado) {
              for (const campo of skill.contexto) {
                if (!camposRendered.has(campo.id)) {
                  camposRendered.add(campo.id)
                  camposNuevos.push(campo)
                }
              }
            }

            return (
              <div
                key={skill.id}
                className={cn(
                  'rounded-xl border transition-all',
                  seleccionado ? 'bg-teal/6 border-teal/30' : 'bg-bg-card border-border'
                )}
              >
                {/* Header — clickeable */}
                <button
                  type="button"
                  onClick={() => toggleSkill(skill.id)}
                  className="w-full flex items-start gap-3 p-4 text-left"
                >
                  <div className={cn(
                    'w-4 h-4 rounded border-2 mt-0.5 shrink-0 flex items-center justify-center transition-all',
                    seleccionado ? 'bg-teal border-teal' : 'border-text-faint'
                  )}>
                    {seleccionado && <span className="text-bg text-xs font-bold leading-none">✓</span>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={cn('text-sm font-medium', seleccionado ? 'text-teal' : 'text-text')}>
                      {skill.nombre}
                    </p>
                    <p className="text-sm text-text-dim mt-0.5">{skill.descripcion}</p>
                    {seleccionado && (
                      <p className="text-sm text-teal/80 mt-1">
                        Requiere: {skill.modelos.map(m => m.carpeta).join(', ')}
                      </p>
                    )}
                  </div>
                </button>

                {/* Campos de contexto — solo cuando está seleccionada y tiene campos nuevos */}
                {seleccionado && camposNuevos.length > 0 && (
                  <div className="px-4 pb-4 pt-0 border-t border-teal/15 space-y-3">
                    <p className="text-sm text-teal font-medium pt-3">Contexto para esta skill</p>
                    {camposNuevos.map(campo => (
                      <div key={campo.id}>
                        <label className="block text-sm font-medium text-text mb-1">
                          {campo.label}
                          {campo.obligatorio && <span className="text-teal ml-1">*</span>}
                        </label>
                        {campo.ayuda && (
                          <p className="text-sm text-text-dim mb-1.5">{campo.ayuda}</p>
                        )}
                        {campo.tipo === 'textarea' ? (
                          <textarea
                            value={contexto[campo.id] ?? ''}
                            onChange={e => handleContexto(campo.id, e.target.value)}
                            rows={2}
                            className="w-full bg-bg border border-border rounded-lg px-3 py-2 text-sm text-text placeholder:text-text-faint resize-none outline-none focus:border-teal/50 focus:ring-1 focus:ring-teal/20 transition-colors"
                          />
                        ) : campo.tipo === 'select' && campo.opciones ? (
                          <select
                            value={contexto[campo.id] ?? ''}
                            onChange={e => handleContexto(campo.id, e.target.value)}
                            className="w-full bg-bg border border-border rounded-lg px-3 py-2 text-sm text-text outline-none focus:border-teal/50 focus:ring-1 focus:ring-teal/20 transition-colors"
                          >
                            <option value="">Seleccioná una opción</option>
                            {campo.opciones.map(op => (
                              <option key={op} value={op}>{op}</option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type="text"
                            value={contexto[campo.id] ?? ''}
                            onChange={e => handleContexto(campo.id, e.target.value)}
                            className="w-full bg-bg border border-border rounded-lg px-3 py-2 text-sm text-text placeholder:text-text-faint outline-none focus:border-teal/50 focus:ring-1 focus:ring-teal/20 transition-colors"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Conectores */}
      <div className="mb-2">
        <h2 className="text-sm font-semibold text-text mb-1">Conectores</h2>
        <p className="text-sm text-text-dim mb-3">Integraciones que el asistente podrá usar durante las sesiones.</p>
        <div className="space-y-2">
          {CONECTORES_DISPONIBLES.map(({ id, desc, icono }) => {
            const seleccionado = conectores.includes(id)
            return (
              <button
                key={id}
                onClick={() => toggleConector(id)}
                className={cn(
                  'w-full flex items-start gap-3 p-4 rounded-xl border text-left transition-all',
                  seleccionado
                    ? 'bg-purple/5 border-purple/25'
                    : 'bg-bg-card border-border hover:border-border-soft hover:bg-bg-3'
                )}
              >
                <div className={cn(
                  'w-4 h-4 rounded border-2 mt-0.5 shrink-0 flex items-center justify-center transition-all',
                  seleccionado ? 'bg-purple border-purple' : 'border-text-faint'
                )}>
                  {seleccionado && <span className="text-white text-xs font-bold leading-none">✓</span>}
                </div>
                <div className="flex items-center gap-2 flex-1">
                  <span className="text-base">{icono}</span>
                  <div>
                    <p className={cn('text-sm font-medium', seleccionado ? 'text-purple-light' : 'text-text')}>
                      {LABELS_CONECTOR[id]}
                    </p>
                    <p className="text-sm text-text-dim mt-0.5">{desc}</p>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      <NavPasos
        paso={3}
        onAnterior={() => setPasoActivo(2)}
        onSiguiente={handleSiguiente}
        labelSiguiente="Continuar"
      />
    </div>
  )
}
