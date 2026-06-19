import { useState, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Puzzle, ChevronDown, ChevronUp, Upload, Trash2, FileText, CheckCircle2, Clock, Download, ShieldAlert, AlertTriangle } from 'lucide-react'
import { NavPasos } from '@/components/roadmap/NavPasos'
import { useRoadmap } from '@/context/RoadmapContext'
import { useAuth } from '@/context/AuthContext'
import type { Documento } from '@/types'
import { SKILLS } from '@/data/skills'
import { formatBytes, cn } from '@/lib/utils'

const ACCEPT = '.docx,.pdf,.txt,.doc'

export function ModulosConectores() {
  const { usuario } = useAuth()
  const {
    configuracion, documentos,
    saveConfiguracion,
    addDocumento, removeDocumento,
    setPasoActivo, completarPaso,
  } = useRoadmap()

  const [expandidos, setExpandidos] = useState<Set<string>>(new Set())
  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false)

  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({})

  const toggleExpanded = (id: string) =>
    setExpandidos(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })

  const handleUpload = async (carpeta: string, files: FileList | null) => {
    if (!files) return
    for (const file of Array.from(files)) {
      const doc: Documento = {
        id: crypto.randomUUID(),
        estudioId: usuario?.estudioId ?? '',
        carpeta,
        nombre: file.name,
        tamano: file.size,
        fecha: new Date().toISOString().slice(0, 10),
        archivoLocal: file,
      }
      await addDocumento(doc)
    }
  }

  const skillsSinModelo = SKILLS.filter(skill => {
    const modelo = skill.modelos[0] ?? null
    if (!modelo) return false
    return documentos.filter(d => d.carpeta === modelo.carpeta).length === 0
  })

  const confirmarYContinuar = async () => {
    setMostrarConfirmacion(false)
    await saveConfiguracion({ skillIds: SKILLS.map(s => s.id) })
    completarPaso(3)
    setPasoActivo(4)
  }

  const handleSiguiente = () => {
    if (skillsSinModelo.length > 0) {
      setMostrarConfirmacion(true)
    } else {
      confirmarYContinuar()
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-teal/10 border border-teal/25 flex items-center justify-center">
          <Puzzle className="w-5 h-5 text-teal" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-text">Skills y modelos</h1>
          <p className="text-sm text-text-dim">
            Subí el modelo de documento que el asistente usará como base para cada skill.
          </p>
        </div>
      </div>

      {/* Aviso de privacidad */}
      <div className="flex items-start gap-3 bg-purple/5 border border-purple/20 rounded-xl p-4 mb-6">
        <ShieldAlert className="w-4 h-4 text-purple-light shrink-0 mt-0.5" />
        <p className="text-sm text-text-dim">
          Subí únicamente modelos e identidad del estudio.{' '}
          <strong className="text-text">Nunca datos personales de clientes finales ni expedientes reales.</strong>
        </p>
      </div>

      {/* Skills */}
      <div className="mb-6">
        <div className="space-y-3">
          {SKILLS.map((skill, index) => {
            const modelo = skill.modelos[0] ?? null
            const docs = modelo ? documentos.filter(d => d.carpeta === modelo.carpeta) : []
            const tieneArchivo = !modelo || docs.length > 0
            const abierta = expandidos.has(skill.id)

            return (
              <div
                key={skill.id}
                className={cn(
                  'rounded-xl border transition-all',
                  abierta ? 'bg-bg-card border-border-soft' : 'bg-bg-card border-border'
                )}
              >
                {/* Header */}
                <button
                  type="button"
                  onClick={() => toggleExpanded(skill.id)}
                  className="w-full flex items-center gap-3 p-4 text-left"
                >
                  <span className="w-8 h-8 rounded-full bg-teal/10 border border-teal/30 flex items-center justify-center text-sm font-semibold text-teal shrink-0">
                    {index + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-text">{skill.nombre}</p>
                      {tieneArchivo ? (
                        <CheckCircle2 className="w-5 h-5 text-success shrink-0" />
                      ) : (
                        <Clock className="w-5 h-5 text-amber-400 shrink-0" />
                      )}
                    </div>
                    <p className="text-sm text-text-dim mt-0.5">{skill.descripcion}</p>
                  </div>
                  {abierta
                    ? <ChevronUp className="w-4 h-4 text-text-faint shrink-0" />
                    : <ChevronDown className="w-4 h-4 text-text-faint shrink-0" />
                  }
                </button>

                {/* Contenido expandido */}
                {abierta && (
                  <div className="border-t border-border px-4 pb-4 pt-4">
                    {modelo ? (
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-xs font-semibold text-text-faint uppercase tracking-widest">Modelo de documento</p>
                          <button
                            type="button"
                            onClick={() => inputRefs.current[modelo.carpeta]?.click()}
                            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-bg-3 border border-border text-text-dim hover:text-teal hover:border-teal/40 transition-colors"
                          >
                            <Upload className="w-3 h-3" />
                            Agregar
                          </button>
                          <input
                            ref={el => { inputRefs.current[modelo.carpeta] = el }}
                            type="file"
                            accept={ACCEPT}
                            multiple
                            className="hidden"
                            onChange={e => handleUpload(modelo.carpeta, e.target.files)}
                          />
                        </div>

                        <p className="text-sm text-text-dim mb-3 leading-relaxed">
                          <span className="font-medium text-text-dim">Ej:</span> {modelo.ejemplo}
                        </p>

                        {docs.length === 0 ? (
                          <div className="space-y-2">
                            <button
                              type="button"
                              onClick={() => inputRefs.current[modelo.carpeta]?.click()}
                              className="w-full border-2 border-dashed border-border rounded-xl p-4 text-center hover:border-teal/30 hover:bg-teal/3 transition-all group"
                            >
                              <Upload className="w-4 h-4 text-text-faint group-hover:text-teal mx-auto mb-1 transition-colors" />
                              <p className="text-sm text-text-dim group-hover:text-text transition-colors">
                                Hacé clic para seleccionar (.docx, .pdf, .txt)
                              </p>
                            </button>
                            {/* TODO: reemplazar undefined por URL real en skills.ts cuando estén los modelos por defecto */}
                            {modelo.modeloDefault && (
                              <a
                                href={modelo.modeloDefault}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-center gap-2 w-full py-2 text-sm text-text-dim hover:text-teal border border-border hover:border-teal/30 rounded-xl transition-colors"
                              >
                                <Download className="w-3.5 h-3.5" />
                                Descargar modelo de ejemplo
                              </a>
                            )}
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {docs.map(doc => (
                              <div key={doc.id} className="flex items-center gap-3 bg-bg-3 rounded-lg px-3 py-2.5 group">
                                <FileText className="w-4 h-4 text-teal/60 shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm text-text truncate">{doc.nombre}</p>
                                  <p className="text-sm text-text-faint">{formatBytes(doc.tamano)}</p>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => removeDocumento(doc.id)}
                                  className="p-1.5 rounded-md text-text-faint hover:text-coral hover:bg-coral/8 opacity-0 group-hover:opacity-100 transition-all"
                                  title="Eliminar"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-text-faint">Esta skill no requiere modelo de documento.</p>
                    )}
                  </div>
                )}
              </div>
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

      {/* Popup: skills sin modelo */}
      {mostrarConfirmacion && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-bg-card border border-border rounded-2xl p-6 max-w-sm w-full shadow-xl animate-fade-in-up">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-9 h-9 rounded-xl bg-amber-400/10 border border-amber-400/25 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-text">Skills sin modelo cargado</p>
                <p className="text-sm text-text-dim mt-1">
                  Las siguientes skills no tienen un modelo propio. El asistente usará un modelo genérico hasta que los subas:
                </p>
              </div>
            </div>

            <ul className="space-y-1 mb-5 pl-1">
              {skillsSinModelo.map(s => (
                <li key={s.id} className="flex items-center gap-2 text-sm text-text-dim">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400/70 shrink-0" />
                  {s.nombre}
                </li>
              ))}
            </ul>

            <div className="flex gap-2">
              <button
                onClick={() => setMostrarConfirmacion(false)}
                className="flex-1 px-4 py-2 rounded-xl text-sm font-medium border border-border text-text-dim hover:border-border-soft hover:text-text transition-colors"
              >
                Volver a cargar
              </button>
              <button
                onClick={confirmarYContinuar}
                className="flex-1 px-4 py-2 rounded-xl text-sm font-medium bg-teal text-bg hover:bg-teal/90 transition-colors"
              >
                Continuar igual
              </button>
            </div>
          </div>
        </div>
      , document.body)}
    </div>
  )
}
