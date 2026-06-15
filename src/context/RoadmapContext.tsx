import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import type { Estudio, Documento, ConfiguracionModulos, ChecklistTecnico, ProgresoRoadmap } from '@/types'
import {
  estudioService,
  documentoService,
  configuracionService,
  checklistService,
  progresoService,
  marcarPasoCompleto,
} from '@/services'
import { useAuth } from './AuthContext'

interface RoadmapContextValue {
  // Paso activo
  pasoActivo: number
  setPasoActivo: (n: number) => void

  // Datos
  estudio: Partial<Estudio>
  documentos: Documento[]
  configuracion: ConfiguracionModulos
  checklist: ChecklistTecnico
  progreso: ProgresoRoadmap | null
  loading: boolean

  // Acciones
  saveEstudio: (data: Partial<Estudio>) => Promise<void>
  addDocumento: (doc: Documento) => Promise<void>
  removeDocumento: (docId: string) => Promise<void>
  saveConfiguracion: (config: ConfiguracionModulos) => Promise<void>
  saveChecklist: (data: ChecklistTecnico) => Promise<void>
  completarPaso: (paso: number) => void
  refrescarProgreso: () => Promise<void>
}

const RoadmapContext = createContext<RoadmapContextValue | null>(null)

export function RoadmapProvider({ children }: { children: ReactNode }) {
  const { usuario } = useAuth()
  const estudioId = usuario?.estudioId ?? ''

  const [pasoActivo, setPasoActivo] = useState(1)
  const [estudio, setEstudio] = useState<Partial<Estudio>>({})
  const [documentos, setDocumentos] = useState<Documento[]>([])
  const [configuracion, setConfiguracion] = useState<ConfiguracionModulos>({ modulos: [], conectores: [] })
  const [checklist, setChecklist] = useState<ChecklistTecnico>({
    claudeDesktopInstalado: false,
    planClaudeActivo: false,
    tieneGoogleWorkspace: false,
    accesoInternetEstable: false,
    disponibleParaReunion: false,
  })
  const [progreso, setProgreso] = useState<ProgresoRoadmap | null>(null)
  const [loading, setLoading] = useState(true)

  const refrescarProgreso = useCallback(async () => {
    if (!estudioId) return
    const p = await progresoService.recalcularProgreso(estudioId)
    setProgreso(p)
  }, [estudioId])

  // Cargar datos iniciales
  useEffect(() => {
    if (!estudioId) { setLoading(false); return }
    setLoading(true)
    Promise.all([
      estudioService.getEstudio(estudioId),
      documentoService.listDocumentos(estudioId),
      configuracionService.getConfiguracion(estudioId),
      checklistService.getChecklist(estudioId),
      progresoService.getProgreso(estudioId),
    ]).then(([est, docs, cfg, chk, prog]) => {
      if (est) setEstudio(est)
      setDocumentos(docs)
      setConfiguracion(cfg)
      setChecklist(chk)
      setProgreso(prog)
      // Retomar en el paso donde se quedó
      const pasos = prog.pasos
      const ultimo = [1,2,3,4,5,6,7].reverse().find(p => pasos[p] === 'completo')
      if (ultimo && ultimo < 7) setPasoActivo(ultimo + 1)
    }).finally(() => setLoading(false))
  }, [estudioId])

  const saveEstudio = async (data: Partial<Estudio>) => {
    await estudioService.saveEstudio(estudioId, data)
    setEstudio(prev => ({ ...prev, ...data }))
    await refrescarProgreso()
  }

  const addDocumento = async (doc: Documento) => {
    await documentoService.addDocumento(estudioId, doc)
    setDocumentos(prev => [...prev, doc])
    await refrescarProgreso()
  }

  const removeDocumento = async (docId: string) => {
    await documentoService.removeDocumento(estudioId, docId)
    setDocumentos(prev => prev.filter(d => d.id !== docId))
    await refrescarProgreso()
  }

  const saveConfiguracion = async (config: ConfiguracionModulos) => {
    await configuracionService.saveConfiguracion(estudioId, config)
    setConfiguracion(config)
    await refrescarProgreso()
  }

  const saveChecklist = async (data: ChecklistTecnico) => {
    await checklistService.saveChecklist(estudioId, data)
    setChecklist(data)
    await refrescarProgreso()
  }

  const completarPaso = (paso: number) => {
    if (estudioId) marcarPasoCompleto(estudioId, paso)
    setProgreso(prev => {
      if (!prev) return prev
      const pasos = { ...prev.pasos, [paso]: 'completo' as const }
      const pasosBase = [1, 2, 3, 4, 5, 6]
      const completados = pasosBase.filter(p => pasos[p] === 'completo').length
      return { ...prev, pasos, porcentaje: Math.round((completados / pasosBase.length) * 100) }
    })
  }

  return (
    <RoadmapContext.Provider value={{
      pasoActivo, setPasoActivo,
      estudio, documentos, configuracion, checklist, progreso, loading,
      saveEstudio, addDocumento, removeDocumento, saveConfiguracion, saveChecklist,
      completarPaso, refrescarProgreso,
    }}>
      {children}
    </RoadmapContext.Provider>
  )
}

export function useRoadmap() {
  const ctx = useContext(RoadmapContext)
  if (!ctx) throw new Error('useRoadmap debe usarse dentro de RoadmapProvider')
  return ctx
}
