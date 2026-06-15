import { useRef } from 'react'
import { Upload, Trash2, FileText, FolderOpen, ShieldAlert } from 'lucide-react'
import { NavPasos } from '@/components/roadmap/NavPasos'
import { useRoadmap } from '@/context/RoadmapContext'
import type { CategoriaDocumento, Documento } from '@/types'
import { LABELS_CATEGORIA, formatBytes, cn } from '@/lib/utils'
import { useAuth } from '@/context/AuthContext'

const CATEGORIAS: CategoriaDocumento[] = [
  'cartas-documento',
  'demandas',
  'contratos',
  'escritos-varios',
]

const ACCEPT = '.docx,.pdf,.txt,.doc'

export function CargaModelos() {
  const { usuario } = useAuth()
  const { documentos, addDocumento, removeDocumento, setPasoActivo, completarPaso } = useRoadmap()
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({})

  const docsPorCategoria = (cat: CategoriaDocumento) =>
    documentos.filter(d => d.categoria === cat)

  const handleUpload = async (cat: CategoriaDocumento, files: FileList | null) => {
    if (!files) return
    for (const file of Array.from(files)) {
      const doc: Documento = {
        id: `doc-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        estudioId: usuario?.estudioId ?? '',
        categoria: cat,
        nombre: file.name,
        tamano: file.size,
        fecha: new Date().toISOString().slice(0, 10),
        archivoLocal: file,
      }
      await addDocumento(doc)
    }
  }

  const tieneAlMenosUno = documentos.length > 0

  const handleSiguiente = () => {
    completarPaso(3)
    setPasoActivo(4)
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-teal/10 border border-teal/25 flex items-center justify-center">
          <FolderOpen className="w-5 h-5 text-teal" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-text">Carga de modelos</h1>
          <p className="text-sm text-text-dim">Subí tus plantillas organizadas por tipo. El asistente las usará como base.</p>
        </div>
      </div>

      {/* Aviso de privacidad */}
      <div className="flex items-start gap-3 bg-purple/5 border border-purple/20 rounded-xl p-4 mb-6">
        <ShieldAlert className="w-4 h-4 text-purple-light shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-purple-light">Solo plantillas, nunca expedientes</p>
          <p className="text-xs text-text-dim mt-0.5">
            Subí únicamente modelos e identidad del estudio. <strong className="text-text">Nunca datos personales de clientes finales ni expedientes reales.</strong>
          </p>
        </div>
      </div>

      {/* Categorías */}
      <div className="space-y-4">
        {CATEGORIAS.map(cat => {
          const docs = docsPorCategoria(cat)
          return (
            <div key={cat} className="bg-bg-card border border-border rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-semibold text-text">{LABELS_CATEGORIA[cat]}</h3>
                  <p className="text-xs text-text-faint mt-0.5">
                    {docs.length === 0 ? 'Sin archivos cargados' : `${docs.length} archivo${docs.length !== 1 ? 's' : ''}`}
                  </p>
                </div>
                <button
                  onClick={() => inputRefs.current[cat]?.click()}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium bg-bg-3 border border-border text-text-dim hover:text-teal hover:border-teal/40 transition-colors"
                >
                  <Upload className="w-3.5 h-3.5" />
                  Agregar
                </button>
                <input
                  ref={el => { inputRefs.current[cat] = el }}
                  type="file"
                  accept={ACCEPT}
                  multiple
                  className="hidden"
                  onChange={e => handleUpload(cat, e.target.files)}
                />
              </div>

              {/* Zona de drop / lista */}
              {docs.length === 0 ? (
                <button
                  onClick={() => inputRefs.current[cat]?.click()}
                  className={cn(
                    'w-full border-2 border-dashed border-border rounded-xl p-6 text-center hover:border-teal/30 hover:bg-teal/3 transition-all group'
                  )}
                >
                  <Upload className="w-6 h-6 text-text-faint group-hover:text-teal mx-auto mb-2 transition-colors" />
                  <p className="text-xs text-text-faint group-hover:text-text-dim transition-colors">
                    Hacé clic para seleccionar archivos (.docx, .pdf, .txt)
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
                  {/* Agregar más en la misma categoría */}
                  <button
                    onClick={() => inputRefs.current[cat]?.click()}
                    className="w-full text-xs text-text-faint hover:text-teal transition-colors py-1.5 border border-dashed border-border/50 rounded-lg hover:border-teal/30"
                  >
                    + Agregar más a esta categoría
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {!tieneAlMenosUno && (
        <p className="text-xs text-text-faint text-center mt-4">
          Cargá al menos un modelo en cualquier categoría para continuar.
        </p>
      )}

      <NavPasos
        paso={3}
        onAnterior={() => setPasoActivo(2)}
        onSiguiente={handleSiguiente}
        deshabilitarSiguiente={!tieneAlMenosUno}
        labelSiguiente="Continuar"
      />
    </div>
  )
}
