import { useRef } from 'react'
import { Upload, Trash2, FileText, FolderOpen, ShieldAlert, ArrowLeft } from 'lucide-react'
import { NavPasos } from '@/components/roadmap/NavPasos'
import { useRoadmap } from '@/context/RoadmapContext'
import { carpetasDeSkills } from '@/data/skills'
import { formatBytes, LABEL_CARPETA, cn } from '@/lib/utils'
import { useAuth } from '@/context/AuthContext'
import type { Documento } from '@/types'

const ACCEPT = '.docx,.pdf,.txt,.doc'

export function CargaModelos() {
  const { usuario } = useAuth()
  const { documentos, addDocumento, removeDocumento, configuracion, setPasoActivo, completarPaso } = useRoadmap()
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({})

  const carpetas = carpetasDeSkills(configuracion.skillIds)

  const docsPorCarpeta = (carpeta: string) =>
    documentos.filter(d => d.carpeta === carpeta)

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

  // Gating: todas las carpetas obligatorias tienen suficientes archivos
  const listo = carpetas
    .filter(c => c.obligatorio)
    .every(c => docsPorCarpeta(c.carpeta).length >= c.minArchivos)

  const handleSiguiente = () => {
    completarPaso(4)
    setPasoActivo(5)
  }

  // Sin skills seleccionadas
  if (carpetas.length === 0) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-teal/10 border border-teal/25 flex items-center justify-center">
            <FolderOpen className="w-5 h-5 text-teal" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-text">Carga de modelos</h1>
            <p className="text-sm text-text-dim">Subí las plantillas que el asistente usará como base.</p>
          </div>
        </div>

        <div className="bg-bg-card border border-border rounded-2xl p-10 text-center">
          <FolderOpen className="w-10 h-10 text-text-faint mx-auto mb-3" />
          <p className="text-sm font-medium text-text mb-1">No hay skills seleccionadas</p>
          <p className="text-xs text-text-dim mb-4">
            Las secciones de carga se generan a partir de las skills que elegiste en el paso anterior.
          </p>
          <button
            onClick={() => setPasoActivo(3)}
            className="flex items-center gap-2 text-xs text-teal hover:text-teal/80 transition-colors mx-auto"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Volver a seleccionar skills
          </button>
        </div>

        <NavPasos
          paso={4}
          onAnterior={() => setPasoActivo(3)}
          onSiguiente={handleSiguiente}
          labelSiguiente="Continuar igual"
        />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-teal/10 border border-teal/25 flex items-center justify-center">
          <FolderOpen className="w-5 h-5 text-teal" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-text">Carga de modelos</h1>
          <p className="text-sm text-text-dim">
            Subí las plantillas para cada carpeta. El asistente las usará como base para redactar.
          </p>
        </div>
      </div>

      {/* Aviso de privacidad */}
      <div className="flex items-start gap-3 bg-purple/5 border border-purple/20 rounded-xl p-4 mb-6">
        <ShieldAlert className="w-4 h-4 text-purple-light shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-purple-light">Solo plantillas, nunca expedientes</p>
          <p className="text-xs text-text-dim mt-0.5">
            Subí únicamente modelos e identidad del estudio.{' '}
            <strong className="text-text">Nunca datos personales de clientes finales ni expedientes reales.</strong>
          </p>
        </div>
      </div>

      {/* Secciones por carpeta */}
      <div className="space-y-4">
        {carpetas.map(modelo => {
          const docs = docsPorCarpeta(modelo.carpeta)
          const faltante = modelo.obligatorio && docs.length < modelo.minArchivos

          return (
            <div
              key={modelo.carpeta}
              className={cn(
                'bg-bg-card border rounded-2xl p-5 transition-colors',
                faltante ? 'border-border' : docs.length > 0 ? 'border-teal/20' : 'border-border'
              )}
            >
              {/* Header sección */}
              <div className="flex items-start justify-between mb-1">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-text">
                      {LABEL_CARPETA[modelo.carpeta] ?? modelo.carpeta}
                    </h3>
                    {modelo.obligatorio && (
                      <span className="text-xs text-teal font-medium">obligatorio</span>
                    )}
                  </div>
                  <p className="text-xs text-text-faint mt-0.5">
                    Carpeta en Drive: <code className="text-text-dim">modelos/{modelo.carpeta}/</code>
                  </p>
                </div>
                <button
                  onClick={() => inputRefs.current[modelo.carpeta]?.click()}
                  className="ml-3 flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium bg-bg-3 border border-border text-text-dim hover:text-teal hover:border-teal/40 transition-colors shrink-0"
                >
                  <Upload className="w-3.5 h-3.5" />
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

              {/* Ejemplo */}
              <p className="text-xs text-text-faint mb-4 leading-relaxed">
                <span className="text-text-dim">Ej:</span> {modelo.ejemplo}
              </p>

              {/* Archivos */}
              {docs.length === 0 ? (
                <button
                  onClick={() => inputRefs.current[modelo.carpeta]?.click()}
                  className="w-full border-2 border-dashed border-border rounded-xl p-5 text-center hover:border-teal/30 hover:bg-teal/3 transition-all group"
                >
                  <Upload className="w-5 h-5 text-text-faint group-hover:text-teal mx-auto mb-1.5 transition-colors" />
                  <p className="text-xs text-text-faint group-hover:text-text-dim transition-colors">
                    Hacé clic para seleccionar (.docx, .pdf, .txt)
                  </p>
                </button>
              ) : (
                <div className="space-y-2">
                  {docs.map(doc => (
                    <div key={doc.id} className="flex items-center gap-3 bg-bg-3 rounded-lg px-3 py-2.5 group">
                      <FileText className="w-4 h-4 text-teal/60 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-text truncate">{doc.nombre}</p>
                        <p className="text-xs text-text-faint">{formatBytes(doc.tamano)}</p>
                      </div>
                      <button
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
          )
        })}
      </div>

      {!listo && (
        <p className="text-xs text-text-faint text-center mt-4">
          Cargá al menos un modelo en cada sección obligatoria para continuar.
        </p>
      )}

      <NavPasos
        paso={4}
        onAnterior={() => setPasoActivo(3)}
        onSiguiente={handleSiguiente}
        deshabilitarSiguiente={!listo}
        labelSiguiente="Continuar"
      />
    </div>
  )
}
