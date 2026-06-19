import { useState, useEffect } from 'react'
import { ClipboardCheck } from 'lucide-react'
import { NavPasos } from '@/components/roadmap/NavPasos'
import { useRoadmap } from '@/context/RoadmapContext'
import type { ChecklistTecnico as ChecklistType } from '@/types'
import { cn } from '@/lib/utils'

interface Item {
  key: keyof ChecklistType
  label: string
  ayuda: string
}

const ITEMS: Item[] = [
  {
    key: 'claudeDesktopInstalado',
    label: 'Tengo Claude Desktop instalado (o lo voy a instalar antes de la reunión)',
    ayuda: 'Descargalo en claude.ai/download — es gratuito.',
  },
  {
    key: 'planClaudeActivo',
    label: 'Tengo un plan activo de Claude (Pro o Team)',
    ayuda: 'El plan gratuito no permite usar proyectos/Cowork. Requiere Pro ($20/mes) o Team.',
  },
  {
    key: 'tieneGoogleWorkspace',
    label: 'Tengo acceso a Google Workspace o Gmail',
    ayuda: 'Necesario para usar Drive y Calendar junto al asistente.',
  },
  {
    key: 'accesoInternetEstable',
    label: 'Cuento con acceso a internet estable para la reunión',
    ayuda: 'La reunión es por Google Meet, necesitás al menos 5 Mbps.',
  },
  {
    key: 'disponibleParaReunion',
    label: 'Estoy disponible para una reunión de 60 minutos con el operador',
    ayuda: 'La reunión de alta dura aproximadamente 1 hora.',
  },
]

export function ChecklistTecnico() {
  const { checklist, saveChecklist, setPasoActivo, completarPaso } = useRoadmap()
  const [form, setForm] = useState<ChecklistType>({ ...checklist })

  useEffect(() => {
    setForm({ ...checklist })
  }, [checklist])

  const completo = Object.values(form).every(Boolean)
  const completados = Object.values(form).filter(Boolean).length

  const toggle = (key: keyof ChecklistType) => {
    setForm(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const handleSiguiente = async () => {
    await saveChecklist(form)
    completarPaso(4)
    setPasoActivo(5)
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-teal/10 border border-teal/25 flex items-center justify-center">
          <ClipboardCheck className="w-5 h-5 text-teal" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-text">Checklist técnico</h1>
          <p className="text-sm text-text-dim">Verificá que tenés todo listo para el día del alta.</p>
        </div>
      </div>

      {/* Progress bar del checklist */}
      <div className="bg-bg-card border border-border rounded-2xl p-5 mb-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-text-dim">{completados} de {ITEMS.length} confirmados</span>
          <span className={cn('text-sm font-semibold', completo ? 'text-success' : 'text-text-dim')}>
            {completo ? '¡Todo listo!' : `${ITEMS.length - completados} restantes`}
          </span>
        </div>
        <div className="h-1.5 bg-bg rounded-full overflow-hidden">
          <div
            className="h-full bg-success rounded-full transition-all duration-500"
            style={{ width: `${(completados / ITEMS.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Items */}
      <div className="space-y-3">
        {ITEMS.map(({ key, label, ayuda }) => {
          const tildado = form[key]
          return (
            <button
              key={key}
              onClick={() => toggle(key)}
              className={cn(
                'w-full flex items-start gap-3.5 p-4 rounded-xl border text-left transition-all',
                tildado
                  ? 'bg-success/6 border-success/25'
                  : 'bg-bg-card border-border hover:border-border-soft hover:bg-bg-3'
              )}
            >
              <div className={cn(
                'w-5 h-5 rounded border-2 mt-0.5 shrink-0 flex items-center justify-center transition-all',
                tildado ? 'bg-success border-success' : 'border-text-faint'
              )}>
                {tildado && <span className="text-bg text-xs font-bold">✓</span>}
              </div>
              <div>
                <p className={cn('text-sm font-medium leading-snug', tildado ? 'text-success' : 'text-text')}>
                  {label}
                </p>
                <p className="text-sm text-text-dim mt-1 leading-relaxed">{ayuda}</p>
              </div>
            </button>
          )
        })}
      </div>

      {!completo && (
        <p className="text-sm text-text-dim text-center mt-4">
          Confirmá todos los ítems para habilitar el agendamiento.
        </p>
      )}

      {completo && (
        <div className="mt-4 bg-success/5 border border-success/20 rounded-xl p-4 text-center">
          <p className="text-sm text-success font-medium">¡Perfecto! Estás listo para la reunión de alta.</p>
        </div>
      )}

      <NavPasos
        paso={5}
        onAnterior={() => setPasoActivo(3)}
        onSiguiente={handleSiguiente}
        deshabilitarSiguiente={!completo}
        labelSiguiente="Ver resumen"
      />
    </div>
  )
}
