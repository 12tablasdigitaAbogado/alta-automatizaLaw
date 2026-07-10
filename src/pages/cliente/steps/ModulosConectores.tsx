import { NavPasos } from '@/components/roadmap/NavPasos'
import { useRoadmap } from '@/context/RoadmapContext'
import { SKILLS, ETAPAS, skillsPorEtapa } from '@/data/skills'

// Paso 3: informativo. Los modelos ya se piden en el wizard de alta (Instancia 9),
// acá el cliente ve qué skills tiene.
export function ModulosConectores() {
  const { documentos, saveConfiguracion, setPasoActivo, completarPaso } = useRoadmap()

  const continuar = async () => {
    await saveConfiguracion({ skillIds: SKILLS.map(s => s.id) })
    completarPaso(3)
    setPasoActivo(4)
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-text">Skills incluidas</h1>
        <p className="text-sm text-text-dim">
          Todo lo que tu asistente va a saber hacer, agrupado por etapa del proceso.
        </p>
      </div>

      <div className="mb-6 space-y-6">
        {ETAPAS.map(etapa => {
          const skillsEtapa = skillsPorEtapa(etapa.id)
          if (skillsEtapa.length === 0) return null
          return (
            <section key={etapa.id}>
              <div className="mb-2">
                <h2 className="text-xs font-semibold uppercase tracking-widest text-teal">{etapa.nombre}</h2>
                <p className="text-sm text-text-faint">{etapa.descripcion}</p>
              </div>
              <div className="space-y-2">
                {skillsEtapa.map(skill => {
                  const modelo = skill.modelos[0] ?? null
                  const docs = modelo ? documentos.filter(d => d.carpeta === modelo.carpeta) : []
                  return (
                    <div key={skill.id} className="rounded-xl border border-border bg-bg-card p-4">
                      <p className="text-sm font-medium text-text">{skill.nombre}</p>
                      <p className="text-sm text-text-dim mt-0.5">{skill.descripcion}</p>
                      {modelo && (
                        <p className="text-xs text-text-faint mt-1.5">
                          {docs.length > 0
                            ? `${docs.length} ${docs.length === 1 ? 'modelo cargado' : 'modelos cargados'}`
                            : modelo.obligatorio
                              ? 'Sin modelo del estudio · usa modelo genérico'
                              : 'Modelo opcional'}
                        </p>
                      )}
                    </div>
                  )
                })}
              </div>
            </section>
          )
        })}
      </div>

      <NavPasos
        paso={3}
        onAnterior={() => setPasoActivo(2)}
        onSiguiente={continuar}
        labelSiguiente="Continuar"
      />
    </div>
  )
}
