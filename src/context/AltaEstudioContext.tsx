import { createContext, useContext, useEffect, useMemo, useState, useRef, type ReactNode } from 'react'
import { INSTANCIAS, type InstanciaDef, type FieldDef } from '@/data/altaEstudio'
import { altaEstudioService, estudioService, documentoService } from '@/services'
import { useAuth } from '@/context/AuthContext'
import type { Documento } from '@/types'
import { CARPETAS_MODELOS } from '@/data/altaEstudio'

type Valor = unknown
type RespuestasInstancia = Record<string, Valor>
type Respuestas = Record<string, RespuestasInstancia>

interface Ctx {
  instancias: InstanciaDef[]
  instanciaActiva: number
  setInstanciaActiva: (n: number) => void
  respuestas: Respuestas
  setRespuesta: (instanciaId: string, fieldId: string, valor: Valor) => void
  archivos: Record<string, File[]>
  setArchivos: (fieldId: string, files: File[]) => void
  documentosGuardados: Record<string, Documento[]>
  eliminarDocumentoGuardado: (docId: string) => Promise<void>
  progreso: { completadas: Set<string>; porcentaje: number }
  reset: () => void
  loading: boolean
  saving: boolean
  saveError: string | null
  guardarInstanciaActual: () => Promise<void>
}

const AltaEstudioCtx = createContext<Ctx | null>(null)

// Buffer offline: guarda en localStorage aunque falle Supabase.
const localKey = (estudioId: string) => `alta-estudio:v2:${estudioId || 'anon'}`

function loadLocal(estudioId: string): Respuestas {
  try {
    const raw = localStorage.getItem(localKey(estudioId))
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function saveLocal(estudioId: string, r: Respuestas) {
  try { localStorage.setItem(localKey(estudioId), JSON.stringify(r)) } catch { /* full */ }
}

export function campoVisible(field: FieldDef, respuestasInstancia: RespuestasInstancia, respuestasGlobales: Respuestas): boolean {
  if (!field.showIf) return true
  return field.showIf({ answers: respuestasGlobales, localAnswers: respuestasInstancia })
}

export function instanciaCompleta(instancia: InstanciaDef, respuestas: Respuestas): boolean {
  const local = respuestas[instancia.id] ?? {}
  let algunObligatorio = false
  let algunValor = false
  for (const campo of instancia.campos) {
    if (!campoVisible(campo, local, respuestas)) continue
    if (campo.obligatorio) {
      algunObligatorio = true
      if (!tieneValor(campo, local[campo.id], respuestas)) return false
    }
    if (tieneValor(campo, local[campo.id], respuestas)) algunValor = true
  }
  // Si la instancia no tiene obligatorios, exigimos que al menos un campo
  // haya sido respondido para considerarla completa.
  if (!algunObligatorio && !algunValor) return false
  return true
}

function tieneValor(field: FieldDef, valor: Valor, respuestas: Respuestas): boolean {
  if (valor === undefined || valor === null || valor === '') return false
  if (field.tipo === 'multi' && Array.isArray(valor) && valor.length === 0) return false
  if (field.tipo === 'repeatable') {
    if (!Array.isArray(valor) || valor.length === 0) return false
    if (field.minItems && valor.length < field.minItems) return false
    for (const item of valor as RespuestasInstancia[]) {
      for (const sub of field.campos ?? []) {
        if (!campoVisible(sub, item, respuestas)) continue
        if (!sub.obligatorio) continue
        if (!tieneValor(sub, item[sub.id], respuestas)) return false
      }
    }
  }
  return true
}

export function AltaEstudioProvider({ children }: { children: ReactNode }) {
  const { usuario, refreshPerfil } = useAuth()
  const estudioId = usuario?.estudioId ?? ''

  const [respuestas, setRespuestas] = useState<Respuestas>({})
  const [archivos, setArchivosState] = useState<Record<string, File[]>>({})
  const [documentos, setDocumentos] = useState<Documento[]>([])
  const [instanciaActiva, setInstanciaActivaState] = useState(1)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const recargarDocumentos = async (idEstudio: string) => {
    if (!idEstudio) { setDocumentos([]); return }
    try {
      const docs = await documentoService.listDocumentos(idEstudio)
      setDocumentos(docs)
    } catch (e) {
      console.warn('[alta-estudio] listDocumentos falló', e)
    }
  }

  // Load inicial: intento back; si falla, uso el buffer local.
  useEffect(() => {
    let cancelado = false
    async function cargar() {
      setLoading(true)
      // Prime desde localStorage (respuesta rápida)
      const local = loadLocal(estudioId)
      if (Object.keys(local).length > 0) setRespuestas(local)
      if (estudioId) {
        try {
          const remoto = await altaEstudioService.loadAll(estudioId)
          if (!cancelado) {
            // El back manda; el local solo se usa si el back no tiene nada de la instancia
            setRespuestas(prev => ({ ...prev, ...remoto }))
          }
        } catch (e) {
          console.warn('[alta-estudio] load fallido, uso buffer local', e)
        }
        await recargarDocumentos(estudioId)
      } else {
        setDocumentos([])
      }
      if (!cancelado) setLoading(false)
    }
    cargar()
    return () => { cancelado = true }
  }, [estudioId])

  // Autosave local (siempre).
  const saveTimer = useRef<number | null>(null)
  useEffect(() => {
    if (saveTimer.current) window.clearTimeout(saveTimer.current)
    saveTimer.current = window.setTimeout(() => saveLocal(estudioId, respuestas), 300)
    return () => { if (saveTimer.current) window.clearTimeout(saveTimer.current) }
  }, [respuestas, estudioId])

  const setRespuesta = (instanciaId: string, fieldId: string, valor: Valor) => {
    setRespuestas(prev => ({
      ...prev,
      [instanciaId]: { ...(prev[instanciaId] ?? {}), [fieldId]: valor },
    }))
    setSaveError(null)
  }

  const setArchivos = (fieldId: string, files: File[]) => {
    setArchivosState(prev => ({ ...prev, [fieldId]: files }))
  }

  // Persistencia por instancia (llamada al pasar a la siguiente o al blur explícito).
  const guardarInstancia = async (idx: number) => {
    const inst = INSTANCIAS[idx - 1]
    if (!inst) return
    const payload = respuestas[inst.id] ?? {}
    setSaving(true); setSaveError(null)
    try {
      let idEstudio = estudioId
      // Instancia 1 sin estudio previo → crear vía RPC existente
      if (inst.id === 'datos-estudio' && !idEstudio) {
        idEstudio = await estudioService.saveEstudio('', {
          denominacion:  (payload.denominacion as string) ?? '',
          domicilio:     (payload.domicilio    as string) ?? '',
          telefono:      (payload.telefono     as string) ?? '',
          email:         (payload.email        as string) ?? '',
          pieFirma:      (payload.pieFirma     as string) ?? '',
        })
        await refreshPerfil()
      }
      if (idEstudio) {
        await altaEstudioService.saveInstancia(idEstudio, inst.id, payload)
        // Instancia 9: subir archivos pendientes
        if (inst.id === 'modelos-plantillas') {
          let subioAlgo = false
          for (const { fieldId, carpeta } of CARPETAS_MODELOS) {
            const files = archivos[fieldId] ?? []
            const carpetaDb = carpeta.replace(/^modelos\//, '').replace(/^datos\//, '')
            for (const file of files) {
              const doc: Documento = {
                id: crypto.randomUUID(),
                estudioId: idEstudio,
                carpeta: carpetaDb,
                nombre: file.name,
                tamano: file.size,
                fecha: new Date().toISOString().slice(0, 10),
                archivoLocal: file,
              }
              await documentoService.addDocumento(idEstudio, doc)
              subioAlgo = true
            }
          }
          // Limpio buffer local de archivos ya subidos
          setArchivosState({})
          if (subioAlgo) await recargarDocumentos(idEstudio)
        }
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      setSaveError(msg)
      throw e
    } finally {
      setSaving(false)
    }
  }

  const setInstanciaActiva = (n: number) => {
    // Antes de moverme, guardo la instancia actual (fire & forget con feedback).
    guardarInstancia(instanciaActiva).catch(() => { /* saveError ya seteado */ })
    setInstanciaActivaState(Math.max(1, Math.min(INSTANCIAS.length, n)))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const guardarInstanciaActual = () => guardarInstancia(instanciaActiva)

  const documentosGuardados = useMemo(() => {
    const map: Record<string, Documento[]> = {}
    for (const { fieldId, carpeta } of CARPETAS_MODELOS) {
      const carpetaDb = carpeta.replace(/^modelos\//, '').replace(/^datos\//, '')
      map[fieldId] = documentos.filter(d => d.carpeta === carpetaDb)
    }
    return map
  }, [documentos])

  const eliminarDocumentoGuardado = async (docId: string) => {
    if (!estudioId) return
    await documentoService.removeDocumento(estudioId, docId)
    setDocumentos(prev => prev.filter(d => d.id !== docId))
  }

  const progreso = useMemo(() => {
    const completadas = new Set<string>()
    for (const inst of INSTANCIAS) {
      if (instanciaCompleta(inst, respuestas)) completadas.add(inst.id)
    }
    return {
      completadas,
      porcentaje: Math.round((completadas.size / INSTANCIAS.length) * 100),
    }
  }, [respuestas])

  const reset = () => {
    setRespuestas({})
    setArchivosState({})
    setInstanciaActivaState(1)
    try { localStorage.removeItem(localKey(estudioId)) } catch { /* noop */ }
  }

  const value: Ctx = {
    instancias: INSTANCIAS,
    instanciaActiva,
    setInstanciaActiva,
    respuestas,
    setRespuesta,
    archivos,
    setArchivos,
    documentosGuardados,
    eliminarDocumentoGuardado,
    progreso,
    reset,
    loading,
    saving,
    saveError,
    guardarInstanciaActual,
  }

  return <AltaEstudioCtx.Provider value={value}>{children}</AltaEstudioCtx.Provider>
}

export function useAltaEstudio() {
  const ctx = useContext(AltaEstudioCtx)
  if (!ctx) throw new Error('useAltaEstudio fuera del provider')
  return ctx
}
