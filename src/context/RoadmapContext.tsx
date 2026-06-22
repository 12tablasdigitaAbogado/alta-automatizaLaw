import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import type { Estudio, Documento, ConfiguracionModulos, ContextoEstudio, ChecklistTecnico, ProgresoRoadmap, Alta } from '@/types'
import {
  estudioService,
  documentoService,
  configuracionService,
  contextoService,
  checklistService,
  progresoService,
  altaService,
  marcarPasoCompleto,
} from '@/services'
import { useAuth } from './AuthContext'

interface RoadmapContextValue {
  pasoActivo: number
  setPasoActivo: (n: number) => void

  estudio: Partial<Estudio>
  documentos: Documento[]
  configuracion: ConfiguracionModulos
  contextoEstudio: ContextoEstudio
  checklist: ChecklistTecnico
  progreso: ProgresoRoadmap | null
  alta: Alta | null
  loading: boolean

  saveEstudio: (data: Partial<Estudio>) => Promise<void>
  addDocumento: (doc: Documento) => Promise<void>
  removeDocumento: (docId: string) => Promise<void>
  saveConfiguracion: (config: ConfiguracionModulos) => Promise<void>
  saveContextoEstudio: (contexto: ContextoEstudio) => Promise<void>
  saveChecklist: (data: ChecklistTecnico) => Promise<void>
  completarPaso: (paso: number) => void
  refrescarProgreso: () => Promise<void>
  marcarAltaAgendada: (calendlyUri: string) => Promise<void>
}

const RoadmapContext = createContext<RoadmapContextValue | null>(null)

export function RoadmapProvider({ children }: { children: ReactNode }) {
  const { usuario, refreshPerfil } = useAuth()
  const [activeEstudioId, setActiveEstudioId] = useState(() => usuario?.estudioId ?? '')

  const [pasoActivo, setPasoActivo] = useState(1)
  const [estudio, setEstudio] = useState<Partial<Estudio>>({})
  const [documentos, setDocumentos] = useState<Documento[]>([])
  const [configuracion, setConfiguracion] = useState<ConfiguracionModulos>({ skillIds: [] })
  const [contextoEstudio, setContextoEstudio] = useState<ContextoEstudio>({})
  const [checklist, setChecklist] = useState<ChecklistTecnico>({
    claudeDesktopInstalado: false,
    planClaudeActivo: false,
    tieneGoogleWorkspace: false,
    accesoInternetEstable: false,
    disponibleParaReunion: false,
  })
  const [progreso, setProgreso] = useState<ProgresoRoadmap | null>(null)
  const [alta, setAlta] = useState<Alta | null>(null)
  const [loading, setLoading] = useState(true)

  // Sync activeEstudioId when auth state changes (e.g., after first saveEstudio creates the estudio)
  useEffect(() => {
    const id = usuario?.estudioId ?? ''
    if (id && id !== activeEstudioId) setActiveEstudioId(id)
  }, [usuario?.estudioId])

  const refrescarProgreso = useCallback(async () => {
    if (!activeEstudioId) return
    const p = await progresoService.recalcularProgreso(activeEstudioId)
    setProgreso(p)
  }, [activeEstudioId])

  useEffect(() => {
    if (!activeEstudioId) { setLoading(false); return }
    setLoading(true)
    Promise.all([
      estudioService.getEstudio(activeEstudioId),
      documentoService.listDocumentos(activeEstudioId),
      configuracionService.getConfiguracion(activeEstudioId),
      contextoService.getContexto(activeEstudioId),
      checklistService.getChecklist(activeEstudioId),
      progresoService.recalcularProgreso(activeEstudioId),
      altaService.getAlta(activeEstudioId),
    ]).then(([est, docs, cfg, ctx, chk, prog, alt]) => {
      if (est) setEstudio(est)
      setDocumentos(docs)
      setConfiguracion(cfg)
      setContextoEstudio(ctx)
      setChecklist(chk)
      setProgreso(prog)
      setAlta(alt)
      const pasos = prog.pasos
      const ultimo = [1, 2, 3, 4, 5, 6].reverse().find(p => pasos[p] === 'completo')
      if (ultimo && ultimo < 6) {
        setPasoActivo(prev => Math.max(prev, ultimo + 1))
      }
    }).finally(() => setLoading(false))
  }, [activeEstudioId])

  const saveEstudio = async (data: Partial<Estudio>) => {
    const newId = await estudioService.saveEstudio(activeEstudioId, data)
    setEstudio(prev => ({ ...prev, ...data }))
    if (newId !== activeEstudioId) {
      setActiveEstudioId(newId)
      await refreshPerfil()
      // useEffect will re-run when activeEstudioId changes, triggering a full reload
    } else {
      await refrescarProgreso()
    }
  }

  const addDocumento = async (doc: Documento) => {
    await documentoService.addDocumento(activeEstudioId, doc)
    setDocumentos(prev => [...prev, doc])
    await refrescarProgreso()
  }

  const removeDocumento = async (docId: string) => {
    await documentoService.removeDocumento(activeEstudioId, docId)
    setDocumentos(prev => prev.filter(d => d.id !== docId))
    await refrescarProgreso()
  }

  const saveConfiguracion = async (config: ConfiguracionModulos) => {
    await configuracionService.saveConfiguracion(activeEstudioId, config)
    setConfiguracion(config)
    await refrescarProgreso()
  }

  const saveContextoEstudio = async (contexto: ContextoEstudio) => {
    await contextoService.saveContexto(activeEstudioId, contexto)
    setContextoEstudio(contexto)
    await refrescarProgreso()
  }

  const saveChecklist = async (data: ChecklistTecnico) => {
    await checklistService.saveChecklist(activeEstudioId, data)
    setChecklist(data)
    await refrescarProgreso()
  }

  const completarPaso = (paso: number) => {
    if (activeEstudioId) marcarPasoCompleto(activeEstudioId, paso)
    setProgreso(prev => {
      const base: ProgresoRoadmap = prev ?? {
        usuarioId: usuario?.id ?? '',
        pasos: { 1: 'pendiente', 2: 'pendiente', 3: 'pendiente', 4: 'pendiente', 5: 'pendiente', 6: 'pendiente' },
        porcentaje: 0,
        identidadCompleta: false,
        tieneDocumentos: false,
        checklistCompleto: false,
        desbloqueado: false,
      }
      const pasos = { ...base.pasos, [paso]: 'completo' as const }
      const pasosBase = [1, 2, 3, 4, 5, 6]
      const completados = pasosBase.filter(p => pasos[p] === 'completo').length
      return { ...base, pasos, porcentaje: Math.round((completados / pasosBase.length) * 100) }
    })
  }

  const marcarAltaAgendada = async (calendlyUri: string) => {
    const nueva = await altaService.reservarAlta(activeEstudioId, '', calendlyUri)
    setAlta(nueva)
    completarPaso(6)
  }

  return (
    <RoadmapContext.Provider value={{
      pasoActivo, setPasoActivo,
      estudio, documentos, configuracion, contextoEstudio, checklist, progreso, alta, loading,
      saveEstudio, addDocumento, removeDocumento, saveConfiguracion, saveContextoEstudio,
      saveChecklist, completarPaso, refrescarProgreso, marcarAltaAgendada,
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
