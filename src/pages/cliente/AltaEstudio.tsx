import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, Check, Download, RotateCcw, FileText, Loader2, AlertTriangle } from 'lucide-react'
import { AltaEstudioProvider, useAltaEstudio, instanciaCompleta } from '@/context/AltaEstudioContext'
import { Field } from '@/components/altaEstudio/Field'
import { generarPerfilEstudio, generarManifiestoCarpetas, manifiestoToText } from '@/lib/altaEstudio/generator'
import { cn } from '@/lib/utils'

// Página standalone (/alta-estudio)
export default function AltaEstudio() {
  return (
    <AltaEstudioProvider>
      <div className="min-h-screen bg-bg">
        <div className="sticky top-0 z-30 bg-bg-2/80 backdrop-blur-md border-b border-border">
          <div className="max-w-3xl mx-auto px-4 py-3">
            <ShellHeader />
            <ProgressBar />
            <Stepper />
          </div>
        </div>
        <main className="max-w-2xl mx-auto px-4 py-8">
          <WizardBody />
        </main>
      </div>
    </AltaEstudioProvider>
  )
}

// Variante embebida: sin sticky/topbar (asume que el roadmap ya lo trae).
// Toma un callback opcional que se dispara cuando el usuario quiere pasar al
// siguiente paso del roadmap tras terminar la última instancia.
export function AltaEstudioEmbedded({ onFinalizar }: { onFinalizar?: () => void }) {
  return (
    <AltaEstudioProvider>
      <div className="space-y-5">
        <ShellHeader />
        <ProgressBar />
        <Stepper />
        <WizardBody onFinalizar={onFinalizar} />
      </div>
    </AltaEstudioProvider>
  )
}

function ShellHeader() {
  const { reset, saving, saveError } = useAltaEstudio()
  return (
    <div className="flex items-center justify-between mb-3">
      <div>
        <h1 className="text-base font-semibold text-text">Alta del estudio</h1>
        <p className="text-xs text-text-faint flex items-center gap-1">
          {saving
            ? <><Loader2 className="w-3 h-3 animate-spin" /> Guardando…</>
            : saveError
              ? <span className="text-coral flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> {saveError}</span>
              : 'Se guarda automáticamente al pasar de instancia.'}
        </p>
      </div>
      <button
        onClick={() => { if (confirm('¿Reiniciar el alta? Se limpian las respuestas locales; lo guardado en el servidor no se toca.')) reset() }}
        className="flex items-center gap-1 text-xs text-text-faint hover:text-coral transition-colors"
      >
        <RotateCcw className="w-3 h-3" /> Reiniciar
      </button>
    </div>
  )
}

function ProgressBar() {
  const { progreso } = useAltaEstudio()
  return (
    <div className="h-1 rounded-full bg-border overflow-hidden">
      <div className="h-full bg-success transition-all duration-300" style={{ width: `${progreso.porcentaje}%` }} />
    </div>
  )
}

function Stepper() {
  const { instancias, instanciaActiva, setInstanciaActiva, progreso } = useAltaEstudio()
  return (
    <div className="flex items-center gap-0.5 overflow-x-auto mt-3">
      {instancias.map((inst, i) => {
        const activa = inst.numero === instanciaActiva
        const completa = progreso.completadas.has(inst.id)
        return (
          <div key={inst.id} className="flex items-center">
            <button
              type="button"
              onClick={() => setInstanciaActiva(inst.numero)}
              className={cn(
                'w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 transition-colors',
                activa   && 'bg-teal text-bg',
                !activa && completa  && 'bg-success/20 text-success border border-success/40',
                !activa && !completa && 'bg-bg-3 text-text-dim border border-border hover:border-border-soft',
              )}
              title={inst.titulo}
            >
              {completa && !activa ? <Check className="w-3.5 h-3.5" /> : inst.numero}
            </button>
            {i < instancias.length - 1 && (
              <div className={cn('w-4 h-px shrink-0', completa ? 'bg-success/40' : 'bg-border')} />
            )}
          </div>
        )
      })}
    </div>
  )
}

function WizardBody({ onFinalizar }: { onFinalizar?: () => void }) {
  const { instancias, instanciaActiva, respuestas, setRespuesta, archivos, setArchivos, loading } = useAltaEstudio()
  const inst = instancias[instanciaActiva - 1]
  const local = respuestas[inst.id] ?? {}
  const esUltima = instanciaActiva === instancias.length

  if (loading) {
    return (
      <div className="py-12 flex items-center justify-center">
        <Loader2 className="w-5 h-5 animate-spin text-teal" />
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-teal mb-1">
          Instancia {inst.numero} de {instancias.length}
        </p>
        <h2 className="text-xl font-bold text-text">{inst.titulo}</h2>
        <p className="text-sm text-text-dim mt-1">{inst.descripcion}</p>
      </div>

      <div className="space-y-5">
        {inst.campos.map(field => (
          <Field
            key={field.id}
            field={field}
            value={local[field.id]}
            onChange={v => setRespuesta(inst.id, field.id, v)}
            respuestasInstancia={local}
            respuestasGlobales={respuestas}
            files={archivos[field.id]}
            onFilesChange={fs => setArchivos(field.id, fs)}
          />
        ))}
      </div>

      {esUltima && <FinalizarPanel onFinalizar={onFinalizar} />}

      <Nav onFinalizar={onFinalizar} />
    </div>
  )
}

function Nav({ onFinalizar }: { onFinalizar?: () => void }) {
  const { instancias, instanciaActiva, setInstanciaActiva, guardarInstanciaActual } = useAltaEstudio()
  const esUltima = instanciaActiva === instancias.length
  const esPrimera = instanciaActiva === 1

  const irSiguiente = () => setInstanciaActiva(instanciaActiva + 1)
  const finalizar = async () => {
    try { await guardarInstanciaActual() } catch { /* saveError ya mostrado */ }
    onFinalizar?.()
  }

  return (
    <div className="flex items-center justify-between gap-2 mt-10 pt-6 border-t border-border">
      <button
        type="button"
        disabled={esPrimera}
        onClick={() => setInstanciaActiva(instanciaActiva - 1)}
        className={cn(
          'flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium border transition-colors',
          esPrimera ? 'border-border text-text-faint cursor-not-allowed' : 'border-border text-text-dim hover:border-border-soft hover:text-text'
        )}
      >
        <ChevronLeft className="w-4 h-4" />
        Anterior
      </button>
      {esUltima ? (
        onFinalizar && (
          <button
            type="button"
            onClick={finalizar}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium bg-teal text-bg hover:bg-teal-hover transition-colors"
          >
            Continuar al siguiente paso
            <ChevronRight className="w-4 h-4" />
          </button>
        )
      ) : (
        <button
          type="button"
          onClick={irSiguiente}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium bg-teal text-bg hover:bg-teal-hover transition-colors"
        >
          Continuar
          <ChevronRight className="w-4 h-4" />
        </button>
      )}
    </div>
  )
}

function FinalizarPanel({ onFinalizar }: { onFinalizar?: () => void }) {
  const { respuestas, instancias } = useAltaEstudio()
  const [previewOpen, setPreviewOpen] = useState(false)

  const md = useMemo(() => generarPerfilEstudio(respuestas), [respuestas])
  const manifiesto = useMemo(() => generarManifiestoCarpetas(respuestas), [respuestas])
  const denominacion = String(respuestas['datos-estudio']?.denominacion ?? 'Estudio')

  const faltantes = instancias.filter(i => !instanciaCompleta(i, respuestas))

  const descargar = (contenido: string, nombre: string, mime = 'text/markdown') => {
    const blob = new Blob([contenido], { type: mime })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = nombre; a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="mt-8 space-y-4">
      <div className="rounded-xl border border-teal/30 bg-teal/5 p-5">
        <p className="text-sm font-semibold text-text mb-1">
          {onFinalizar ? 'Perfil casi listo' : 'Casi listo'}
        </p>
        <p className="text-sm text-text-dim">
          Ya podés generar el <code className="text-teal">perfil_estudio.md</code> y la estructura de carpetas del estudio.
          {onFinalizar && ' Cuando pases al siguiente paso, seguimos con las skills.'}
        </p>
        {faltantes.length > 0 && (
          <p className="text-xs text-amber-400 mt-2">
            Instancias sin completar: {faltantes.map(f => `${f.numero}. ${f.titulo}`).join(' · ')}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button
          onClick={() => descargar(md, `${denominacion}-perfil_estudio.md`)}
          className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-teal text-bg font-medium hover:bg-teal-hover transition-colors"
        >
          <Download className="w-4 h-4" /> Descargar perfil_estudio.md
        </button>
        <button
          onClick={() => descargar(manifiestoToText(denominacion, manifiesto), `${denominacion}-carpetas.txt`, 'text/plain')}
          className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-border text-text hover:border-teal/40 hover:text-teal transition-colors"
        >
          <FileText className="w-4 h-4" /> Descargar manifiesto de carpetas
        </button>
      </div>

      <button
        onClick={() => setPreviewOpen(v => !v)}
        className="text-xs text-text-faint hover:text-teal transition-colors"
      >
        {previewOpen ? 'Ocultar' : 'Ver'} preview del markdown
      </button>
      {previewOpen && (
        <pre className="text-xs bg-bg-3 border border-border rounded-xl p-4 overflow-auto max-h-96 whitespace-pre-wrap text-text-dim">{md}</pre>
      )}
    </div>
  )
}
