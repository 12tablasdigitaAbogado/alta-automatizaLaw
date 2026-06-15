import { useRef, useEffect } from 'react'
import { TopBarCliente } from '@/components/layout/TopBarCliente'
import { RoadmapProvider, useRoadmap } from '@/context/RoadmapContext'
import { useAuth } from '@/context/AuthContext'
import { PasoIndicador } from '@/components/roadmap/PasoIndicador'
import { Bienvenida } from './steps/Bienvenida'
import { DatosEstudio } from './steps/DatosEstudio'
import { ModulosConectores } from './steps/ModulosConectores'
import { CargaModelos } from './steps/CargaModelos'
import { ChecklistTecnico } from './steps/ChecklistTecnico'
import { RevisionFinal } from './steps/RevisionFinal'
import { AgendarAlta } from './steps/AgendarAlta'
import { Clock, LogOut, Zap } from 'lucide-react'

const PASOS = [
  { num: 1, label: 'Bienvenida' },
  { num: 2, label: 'Identidad' },
  { num: 3, label: 'Módulos' },
  { num: 4, label: 'Modelos' },
  { num: 5, label: 'Técnico' },
  { num: 6, label: 'Revisión' },
  { num: 7, label: 'Agendar' },
]

function RoadmapInner() {
  const { pasoActivo, setPasoActivo, progreso, loading } = useRoadmap()
  const mainRef = useRef<HTMLElement>(null)

  useEffect(() => {
    mainRef.current?.scrollTo(0, 0)
    window.scrollTo(0, 0)
  }, [pasoActivo])

  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-teal/30 border-t-teal rounded-full animate-spin" />
      </div>
    )
  }

  const renderPaso = () => {
    switch (pasoActivo) {
      case 1: return <Bienvenida />
      case 2: return <DatosEstudio />
      case 3: return <ModulosConectores />
      case 4: return <CargaModelos />
      case 5: return <ChecklistTecnico />
      case 6: return <RevisionFinal />
      case 7: return <AgendarAlta />
      default: return <Bienvenida />
    }
  }

  return (
    <div className="min-h-screen bg-bg">
      <TopBarCliente />

      <div className="sticky top-[57px] z-30 bg-bg-2/80 backdrop-blur-md border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center gap-1 overflow-x-auto">
            {PASOS.map((paso, i) => {
              const estado = progreso?.pasos[paso.num] ?? 'pendiente'
              const esActivo = pasoActivo === paso.num
              const desbloqueado = paso.num !== 7 || progreso?.desbloqueado
              return (
                <div key={paso.num} className="flex items-center">
                  <PasoIndicador
                    numero={paso.num}
                    label={paso.label}
                    estado={estado}
                    activo={esActivo}
                    bloqueado={!desbloqueado}
                    onClick={() => { if (desbloqueado) setPasoActivo(paso.num) }}
                  />
                  {i < PASOS.length - 1 && (
                    <div className={`w-6 h-px mx-0.5 shrink-0 ${estado === 'completo' ? 'bg-teal/40' : 'bg-border'}`} />
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <main ref={mainRef} className="max-w-4xl mx-auto px-4 py-8">
        <div className="animate-fade-in-up" key={pasoActivo}>
          {renderPaso()}
        </div>
      </main>
    </div>
  )
}

function PendingScreen() {
  const { logout, usuario } = useAuth()
  return (
    <div className="min-h-screen bg-bg flex flex-col">
      <header className="bg-bg-2/80 border-b border-border px-4 py-3 flex items-center gap-2">
        <div className="w-7 h-7 rounded-md bg-teal/10 border border-teal/30 flex items-center justify-center">
          <Zap className="w-3.5 h-3.5 text-teal" />
        </div>
        <span className="text-sm font-semibold text-text">Cerebro del Estudio</span>
      </header>
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="bg-bg-card border border-border rounded-2xl p-8 max-w-sm w-full text-center space-y-5 animate-fade-in-up">
          <div className="w-14 h-14 rounded-2xl bg-teal/10 border border-teal/30 flex items-center justify-center mx-auto glow-teal">
            <Clock className="w-7 h-7 text-teal" />
          </div>
          <div className="space-y-2">
            <h2 className="text-lg font-bold text-text">Cuenta pendiente de aprobación</h2>
            <p className="text-text-dim text-sm leading-relaxed">
              Hola <span className="text-text font-medium">{usuario?.nombre}</span>, tu solicitud fue recibida.
              Un operador revisará tu cuenta y te avisará por email cuando esté activa.
            </p>
          </div>
          <div className="pt-1 border-t border-border">
            <button
              onClick={logout}
              className="flex items-center gap-2 text-sm text-text-faint hover:text-coral transition-colors mx-auto"
            >
              <LogOut className="w-4 h-4" />
              Cerrar sesión
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function RoadmapLayout() {
  const { estado } = useAuth()

  if (estado === 'pendiente' || estado === 'rechazado') {
    return <PendingScreen />
  }

  return (
    <RoadmapProvider>
      <RoadmapInner />
    </RoadmapProvider>
  )
}
