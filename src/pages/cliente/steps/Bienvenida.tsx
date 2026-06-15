import { Zap, FileText, Calendar, CheckCircle2, Lock } from 'lucide-react'
import { NavPasos } from '@/components/roadmap/NavPasos'
import { useRoadmap } from '@/context/RoadmapContext'

const BENEFICIOS = [
  { icon: FileText, titulo: 'Tus modelos, listos', desc: 'Cargás tus plantillas una vez y el asistente las usa en cada escrito.' },
  { icon: Zap, titulo: 'Alta express', desc: 'En la reunión de alta todo está preparado, sin perder tiempo buscando archivos.' },
  { icon: CheckCircle2, titulo: 'Setup profesional', desc: 'Un operador te configura todo en vivo, de principio a fin.' },
  { icon: Calendar, titulo: 'Horario a tu medida', desc: 'Elegís el día y hora para la reunión una vez que completás el setup.' },
]

export function Bienvenida() {
  const { setPasoActivo, completarPaso } = useRoadmap()

  const handleSiguiente = () => {
    completarPaso(1)
    setPasoActivo(2)
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="text-center mb-10">
        <div className="w-16 h-16 rounded-2xl bg-teal/10 border border-teal/30 flex items-center justify-center mx-auto mb-5 glow-teal">
          <Zap className="w-8 h-8 text-teal" />
        </div>
        <h1 className="text-3xl font-bold text-text mb-3 tracking-tight">
          Bienvenido al setup de tu asistente
        </h1>
        <p className="text-text-dim text-base leading-relaxed">
          En los próximos minutos vas a cargar la información de tu estudio y tus modelos de documentos.
          Al terminar, vas a poder agendar la reunión de alta con nuestro equipo.
        </p>
      </div>

      {/* Cómo funciona */}
      <div className="bg-bg-card border border-border rounded-2xl p-6 mb-6">
        <h2 className="text-sm font-semibold text-text-dim uppercase tracking-widest mb-5">Cómo funciona</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {BENEFICIOS.map(({ icon: Icon, titulo, desc }) => (
            <div key={titulo} className="flex gap-3">
              <div className="w-9 h-9 rounded-lg bg-teal/8 border border-teal/15 flex items-center justify-center shrink-0 mt-0.5">
                <Icon className="w-4 h-4 text-teal" />
              </div>
              <div>
                <p className="text-sm font-medium text-text">{titulo}</p>
                <p className="text-xs text-text-dim mt-0.5 leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Roadmap preview */}
      <div className="bg-bg-card border border-border rounded-2xl p-6 mb-6">
        <h2 className="text-sm font-semibold text-text-dim uppercase tracking-widest mb-4">Qué vas a completar</h2>
        <div className="space-y-2.5">
          {[
            'Datos del estudio (identidad legal)',
            'Carga de modelos y plantillas',
            'Selección de módulos y conectores',
            'Checklist técnico rápido',
            'Revisión final y agendamiento',
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-full bg-teal/10 border border-teal/25 flex items-center justify-center text-xs font-medium text-teal shrink-0">
                {i + 1}
              </div>
              <span className="text-sm text-text-dim">{item}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Alerta candado */}
      <div className="flex items-start gap-3 bg-warning/5 border border-warning/20 rounded-xl p-4 mb-2">
        <Lock className="w-4 h-4 text-warning shrink-0 mt-0.5" />
        <p className="text-sm text-warning/80">
          El agendamiento de tu alta se desbloquea automáticamente cuando completés todos los pasos obligatorios.
        </p>
      </div>

      <NavPasos
        paso={1}
        onSiguiente={handleSiguiente}
        labelSiguiente="Empezar setup"
      />
    </div>
  )
}
