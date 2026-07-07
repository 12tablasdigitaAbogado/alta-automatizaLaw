import { useState } from 'react'
import { Plus, Trash2, Sparkles, Check, X, Upload, FileText, Loader2 } from 'lucide-react'
import type { FieldDef, EvalCtx } from '@/data/altaEstudio'
import { campoVisible } from '@/context/AltaEstudioContext'
import type { Documento } from '@/types'
import { cn, formatBytes } from '@/lib/utils'

interface Props {
  field: FieldDef
  value: unknown
  onChange: (v: unknown) => void
  respuestasInstancia: Record<string, unknown>
  respuestasGlobales: Record<string, Record<string, unknown>>
  // Solo para file
  files?: File[]
  onFilesChange?: (files: File[]) => void
  documentosGuardados?: Documento[]
  onEliminarDocumento?: (docId: string) => Promise<void>
}

export function Field({ field, value, onChange, respuestasInstancia, respuestasGlobales, files, onFilesChange, documentosGuardados, onEliminarDocumento }: Props) {
  const ctx: EvalCtx = { answers: respuestasGlobales, localAnswers: respuestasInstancia }
  if (!campoVisible(field, respuestasInstancia, respuestasGlobales)) return null

  const sugerencia = field.sugerencia ? field.sugerencia(ctx) : null
  // Mostrar la sugerencia solo si el campo aún no fue tocado por el usuario.
  const noRespondido = value === undefined || value === '' || value === null

  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-text">
        {field.label}
        {field.obligatorio && <span className="text-coral ml-1">*</span>}
      </label>
      {field.ayuda && <p className="text-xs text-text-faint">{field.ayuda}</p>}

      {sugerencia && noRespondido && (
        <SugerenciaBox
          sugerencia={sugerencia}
          onAceptar={() => onChange(sugerencia.texto)}
        />
      )}

      {renderInput({ field, value, onChange, files, onFilesChange, documentosGuardados, onEliminarDocumento, respuestasInstancia, respuestasGlobales })}
    </div>
  )
}

function SugerenciaBox({ sugerencia, onAceptar }: { sugerencia: { texto: string; motivo: string }; onAceptar: () => void }) {
  return (
    <div className="flex items-start gap-2 bg-teal/8 border border-teal/25 rounded-lg p-2.5 text-sm">
      <Sparkles className="w-4 h-4 text-teal shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="text-text">
          Sugerencia: <span className="font-semibold text-teal">{sugerencia.texto}</span>
        </p>
        <p className="text-xs text-text-dim mt-0.5">{sugerencia.motivo}</p>
      </div>
      <button
        type="button"
        onClick={onAceptar}
        className="text-xs font-medium text-teal hover:text-teal-hover px-2 py-1 rounded-md hover:bg-teal/10 transition-colors shrink-0"
      >
        Usar
      </button>
    </div>
  )
}

function renderInput({ field, value, onChange, files, onFilesChange, documentosGuardados, onEliminarDocumento, respuestasInstancia, respuestasGlobales }: Props) {
  switch (field.tipo) {
    case 'text':
      return (
        <input
          type="text"
          value={(value as string) ?? ''}
          placeholder={field.placeholder}
          onChange={e => onChange(e.target.value)}
          className={inputCls}
        />
      )
    case 'textarea':
      return (
        <textarea
          value={(value as string) ?? ''}
          placeholder={field.placeholder}
          onChange={e => onChange(e.target.value)}
          rows={4}
          className={cn(inputCls, 'font-normal leading-relaxed resize-y')}
        />
      )
    case 'number':
      return (
        <input
          type="number"
          value={(value as number | string) ?? ''}
          placeholder={field.placeholder}
          onChange={e => onChange(e.target.value === '' ? '' : Number(e.target.value))}
          className={inputCls}
        />
      )
    case 'boolean':
      return (
        <div className="flex gap-2">
          {[
            { v: true,  label: 'Sí',  icon: Check },
            { v: false, label: 'No',  icon: X },
          ].map(o => (
            <button
              key={String(o.v)}
              type="button"
              onClick={() => onChange(o.v)}
              className={cn(
                'flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border text-sm font-medium transition-colors',
                value === o.v
                  ? 'border-teal bg-teal/10 text-teal'
                  : 'border-border text-text-dim hover:border-border-soft hover:text-text'
              )}
            >
              <o.icon className="w-4 h-4" />
              {o.label}
            </button>
          ))}
        </div>
      )
    case 'radio':
      return (
        <div className="space-y-1.5">
          {(field.opciones ?? []).map(o => (
            <button
              key={o.value}
              type="button"
              onClick={() => onChange(o.value)}
              className={cn(
                'w-full text-left px-3 py-2.5 rounded-lg border text-sm transition-colors',
                value === o.value
                  ? 'border-teal bg-teal/10 text-text'
                  : 'border-border text-text-dim hover:border-border-soft hover:text-text'
              )}
            >
              {o.label}
            </button>
          ))}
        </div>
      )
    case 'multi': {
      const arr = Array.isArray(value) ? (value as string[]) : []
      const toggle = (v: string) => {
        const next = arr.includes(v) ? arr.filter(x => x !== v) : [...arr, v]
        onChange(next)
      }
      return (
        <div className="space-y-1.5">
          {(field.opciones ?? []).map(o => {
            const checked = arr.includes(o.value)
            return (
              <button
                key={o.value}
                type="button"
                onClick={() => toggle(o.value)}
                className={cn(
                  'w-full text-left flex items-center gap-2.5 px-3 py-2.5 rounded-lg border text-sm transition-colors',
                  checked
                    ? 'border-teal bg-teal/10 text-text'
                    : 'border-border text-text-dim hover:border-border-soft hover:text-text'
                )}
              >
                <span className={cn(
                  'w-4 h-4 rounded border flex items-center justify-center shrink-0',
                  checked ? 'border-teal bg-teal' : 'border-border'
                )}>
                  {checked && <Check className="w-3 h-3 text-bg" />}
                </span>
                {o.label}
              </button>
            )
          })}
        </div>
      )
    }
    case 'select':
      return (
        <select
          value={(value as string) ?? ''}
          onChange={e => onChange(e.target.value)}
          className={inputCls}
        >
          <option value="" disabled>Elegir…</option>
          {(field.opciones ?? []).map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      )
    case 'repeatable':
      return (
        <RepeatableList
          field={field}
          value={Array.isArray(value) ? value as Record<string, unknown>[] : []}
          onChange={onChange as (v: Record<string, unknown>[]) => void}
          respuestasGlobales={respuestasGlobales}
        />
      )
    case 'file':
      return (
        <FileDrop
          field={field}
          files={files ?? []}
          onChange={onFilesChange ?? (() => {})}
          documentosGuardados={documentosGuardados ?? []}
          onEliminarDocumento={onEliminarDocumento}
        />
      )
    default:
      return null
  }
}

const inputCls = 'w-full px-3 py-2 rounded-lg bg-bg-3 border border-border text-sm text-text placeholder:text-text-faint focus:outline-none focus:border-teal/60 transition-colors'

// ─── Repeatable ───────────────────────────────────────────────────────────────

function RepeatableList({
  field, value, onChange, respuestasGlobales,
}: {
  field: FieldDef
  value: Record<string, unknown>[]
  onChange: (v: Record<string, unknown>[]) => void
  respuestasGlobales: Record<string, Record<string, unknown>>
}) {
  const agregar = () => onChange([...value, {}])
  const eliminar = (i: number) => onChange(value.filter((_, idx) => idx !== i))
  const actualizar = (i: number, fieldId: string, v: unknown) => {
    const next = value.map((item, idx) => idx === i ? { ...item, [fieldId]: v } : item)
    onChange(next)
  }

  return (
    <div className="space-y-3">
      {value.length === 0 && (
        <p className="text-sm text-text-faint italic">Todavía no agregaste ninguno.</p>
      )}
      {value.map((item, i) => (
        <div key={i} className="rounded-xl border border-border-soft bg-bg-3 p-4 space-y-3 relative">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-widest text-text-faint">
              {field.itemLabel ?? 'Ítem'} {i + 1}
            </p>
            <button
              type="button"
              onClick={() => eliminar(i)}
              className="p-1 rounded-md text-text-faint hover:text-coral hover:bg-coral/10 transition-colors"
              title="Eliminar"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
          {(field.campos ?? []).map(sub => (
            <Field
              key={sub.id}
              field={sub}
              value={item[sub.id]}
              onChange={v => actualizar(i, sub.id, v)}
              respuestasInstancia={item}
              respuestasGlobales={respuestasGlobales}
            />
          ))}
        </div>
      ))}
      <button
        type="button"
        onClick={agregar}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-dashed border-border text-sm font-medium text-text-dim hover:border-teal/40 hover:text-teal transition-colors"
      >
        <Plus className="w-4 h-4" />
        Agregar {field.itemLabel?.toLowerCase() ?? 'ítem'}
      </button>
    </div>
  )
}

// ─── File ────────────────────────────────────────────────────────────────────

function FileDrop({ field, files, onChange, documentosGuardados, onEliminarDocumento }: {
  field: FieldDef
  files: File[]
  onChange: (files: File[]) => void
  documentosGuardados: Documento[]
  onEliminarDocumento?: (docId: string) => Promise<void>
}) {
  const [hover, setHover] = useState(false)
  const [eliminandoId, setEliminandoId] = useState<string | null>(null)
  const handleFiles = (list: FileList | null) => {
    if (!list) return
    const nuevos = Array.from(list)
    onChange(field.multiple ? [...files, ...nuevos] : nuevos.slice(0, 1))
  }
  const eliminarGuardado = async (docId: string) => {
    if (!onEliminarDocumento) return
    setEliminandoId(docId)
    try { await onEliminarDocumento(docId) } finally { setEliminandoId(null) }
  }
  return (
    <div>
      <label
        className={cn(
          'flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed cursor-pointer text-sm transition-colors',
          hover ? 'border-teal/50 bg-teal/5 text-teal' : 'border-border text-text-dim hover:border-border-soft'
        )}
        onDragOver={e => { e.preventDefault(); setHover(true) }}
        onDragLeave={() => setHover(false)}
        onDrop={e => { e.preventDefault(); setHover(false); handleFiles(e.dataTransfer.files) }}
      >
        <Upload className="w-4 h-4" />
        Arrastrá o hacé clic para subir {field.accept && <span className="text-xs">({field.accept})</span>}
        <input
          type="file"
          accept={field.accept}
          multiple={field.multiple}
          className="hidden"
          onChange={e => handleFiles(e.target.files)}
        />
      </label>
      {(documentosGuardados.length > 0 || files.length > 0) && (
        <div className="mt-2 space-y-1.5">
          {documentosGuardados.map(doc => {
            const borrando = eliminandoId === doc.id
            return (
              <div
                key={doc.id}
                className={cn(
                  'flex items-center gap-2 bg-bg-3 rounded-lg px-3 py-2 text-sm transition-opacity',
                  borrando && 'opacity-60'
                )}
              >
                <FileText className="w-4 h-4 text-success/70 shrink-0" />
                <span className="flex-1 truncate text-text">{doc.nombre}</span>
                <span className="text-xs text-success/80">
                  {borrando ? 'eliminando…' : 'guardado'}
                </span>
                <span className="text-xs text-text-faint">{formatBytes(doc.tamano)}</span>
                <button
                  type="button"
                  disabled={borrando}
                  onClick={() => eliminarGuardado(doc.id)}
                  className="p-1 rounded text-text-faint hover:text-coral hover:bg-coral/10 transition-colors disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-text-faint"
                  title={borrando ? 'Eliminando…' : 'Eliminar de la nube'}
                >
                  {borrando
                    ? <Loader2 className="w-3.5 h-3.5 animate-spin text-coral" />
                    : <Trash2 className="w-3.5 h-3.5" />
                  }
                </button>
              </div>
            )
          })}
          {files.map((f, i) => (
            <div key={i} className="flex items-center gap-2 bg-bg-3 rounded-lg px-3 py-2 text-sm">
              <FileText className="w-4 h-4 text-teal/60 shrink-0" />
              <span className="flex-1 truncate text-text">{f.name}</span>
              <span className="text-xs text-text-faint">pendiente</span>
              <span className="text-xs text-text-faint">{formatBytes(f.size)}</span>
              <button
                type="button"
                onClick={() => onChange(files.filter((_, idx) => idx !== i))}
                className="p-1 rounded text-text-faint hover:text-coral hover:bg-coral/10 transition-colors"
                title="Quitar"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
