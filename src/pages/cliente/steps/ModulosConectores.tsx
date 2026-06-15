import { useState, useEffect } from 'react'
import { Puzzle, AlertCircle } from 'lucide-react'
import { NavPasos } from '@/components/roadmap/NavPasos'
import { useRoadmap } from '@/context/RoadmapContext'
import type { ModuloId, ConectorId } from '@/types'
import { LABELS_MODULO, LABELS_CONECTOR, cn } from '@/lib/utils'

// TODO: reemplazar con la lista real de módulos disponibles cuando esté definida con el equipo
const MODULOS_DISPONIBLES: { id: ModuloId; desc: string }[] = [
  { id: 'redaccion-escritos', desc: 'Generá escritos judiciales desde cero o basándote en tus modelos.' },
  { id: 'cartas-documento', desc: 'Redactá cartas documento e intimaciones con los datos del caso.' },
  { id: 'respuesta-telegramas', desc: 'Respondé telegramas laborales con la respuesta adecuada.' },
  { id: 'analisis-contratos', desc: 'Analizá contratos, identificá cláusulas problemáticas y riesgos.' },
  { id: 'consulta-jurisprudencia', desc: 'Consultá fallos y doctrina relevante por tema.' },
  { id: 'liquidacion-honorarios', desc: 'Calculá y generá liquidaciones de honorarios profesionales.' },
]

const CONECTORES_DISPONIBLES: { id: ConectorId; desc: string; icono: string }[] = [
  { id: 'google-drive', desc: 'Leé y guardá documentos directamente en tu Drive.', icono: '📁' },
  { id: 'google-calendar', desc: 'Agendá vencimientos y audiencias automáticamente.', icono: '📅' },
  { id: 'gmail', desc: 'Accedé y respondé emails desde el asistente.', icono: '✉️' },
]

export function ModulosConectores() {
  const { configuracion, saveConfiguracion, setPasoActivo, completarPaso } = useRoadmap()
  const [modulos, setModulos] = useState<ModuloId[]>([])
  const [conectores, setConectores] = useState<ConectorId[]>([])

  useEffect(() => {
    setModulos(configuracion.modulos)
    setConectores(configuracion.conectores)
  }, [configuracion])

  const toggleModulo = (id: ModuloId) =>
    setModulos(prev => prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id])

  const toggleConector = (id: ConectorId) =>
    setConectores(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id])

  const handleSiguiente = async () => {
    await saveConfiguracion({ modulos, conectores })
    completarPaso(4)
    setPasoActivo(5)
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-teal/10 border border-teal/25 flex items-center justify-center">
          <Puzzle className="w-5 h-5 text-teal" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-text">Módulos y conectores</h1>
          <p className="text-sm text-text-dim">Seleccioná qué capacidades querés activar. Podés cambiar esto después.</p>
        </div>
      </div>

      {/* Aviso TODO */}
      <div className="flex items-start gap-2.5 bg-warning/5 border border-warning/15 rounded-xl px-4 py-3 mb-6">
        <AlertCircle className="w-4 h-4 text-warning shrink-0 mt-0.5" />
        <p className="text-xs text-warning/80">
          Esta lista es preliminar. Los módulos disponibles se definirán con el equipo antes del lanzamiento.
        </p>
      </div>

      {/* Módulos */}
      <div className="mb-6">
        <h2 className="text-sm font-semibold text-text mb-3">Skills jurídicas</h2>
        <div className="space-y-2">
          {MODULOS_DISPONIBLES.map(({ id, desc }) => {
            const seleccionado = modulos.includes(id)
            return (
              <button
                key={id}
                onClick={() => toggleModulo(id)}
                className={cn(
                  'w-full flex items-start gap-3 p-4 rounded-xl border text-left transition-all',
                  seleccionado
                    ? 'bg-teal/6 border-teal/30'
                    : 'bg-bg-card border-border hover:border-border-soft hover:bg-bg-3'
                )}
              >
                <div className={cn(
                  'w-4 h-4 rounded border-2 mt-0.5 shrink-0 flex items-center justify-center transition-all',
                  seleccionado ? 'bg-teal border-teal' : 'border-text-faint'
                )}>
                  {seleccionado && <span className="text-bg text-xs font-bold leading-none">✓</span>}
                </div>
                <div>
                  <p className={cn('text-sm font-medium', seleccionado ? 'text-teal' : 'text-text')}>
                    {LABELS_MODULO[id]}
                  </p>
                  <p className="text-xs text-text-dim mt-0.5">{desc}</p>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Conectores */}
      <div className="mb-2">
        <h2 className="text-sm font-semibold text-text mb-1">Conectores</h2>
        <p className="text-xs text-text-faint mb-3">Integraciones que el asistente podrá usar durante las sesiones.</p>
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
                    <p className="text-xs text-text-dim mt-0.5">{desc}</p>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      <NavPasos
        paso={4}
        onAnterior={() => setPasoActivo(3)}
        onSiguiente={handleSiguiente}
        labelSiguiente="Continuar"
      />
    </div>
  )
}
