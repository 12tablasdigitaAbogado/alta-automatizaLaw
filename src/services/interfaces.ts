import type {
  Estudio,
  Documento,
  ConfiguracionModulos,
  ContextoEstudio,
  ProgresoRoadmap,
  Alta,
  Usuario,
  ChecklistTecnico,
  ClienteResumen,
  RespuestasAlta,
} from '@/types'

export interface EstudioService {
  getEstudio(estudioId: string): Promise<Estudio | null>
  /** Returns the effective estudio ID (new if created, same if updated) */
  saveEstudio(estudioId: string, data: Partial<Estudio>): Promise<string>
}

export interface DocumentoService {
  listDocumentos(estudioId: string): Promise<Documento[]>
  addDocumento(estudioId: string, doc: Documento): Promise<Documento>
  removeDocumento(estudioId: string, docId: string): Promise<void>
}

export interface ConfiguracionService {
  getConfiguracion(estudioId: string): Promise<ConfiguracionModulos>
  saveConfiguracion(estudioId: string, config: ConfiguracionModulos): Promise<void>
}

export interface ContextoService {
  getContexto(estudioId: string): Promise<ContextoEstudio>
  saveContexto(estudioId: string, contexto: ContextoEstudio): Promise<void>
}

export interface ChecklistService {
  getChecklist(estudioId: string): Promise<ChecklistTecnico>
  saveChecklist(estudioId: string, data: ChecklistTecnico): Promise<void>
}

export interface ProgresoService {
  getProgreso(estudioId: string): Promise<ProgresoRoadmap>
  recalcularProgreso(estudioId: string): Promise<ProgresoRoadmap>
}

export interface AltaService {
  getAlta(estudioId: string): Promise<Alta | null>
  reservarAlta(estudioId: string, fecha: string, hora: string): Promise<Alta>
  actualizarEstado(altaId: string, estado: Alta['estado']): Promise<void>
  listAltas(): Promise<Alta[]>
}

// Wizard de alta del estudio (9 instancias).
// - Instancia 1 (datos-estudio): identidad → estudios + abogados[]
// - Instancia 2 (jurisdiccion-alcance): jurisdicciones[]
// - Instancias 3-8: payload jsonb en respuestas_alta
// - Instancia 9 (modelos-plantillas): documentos (tabla existente)
export interface AltaEstudioService {
  loadAll(estudioId: string): Promise<RespuestasAlta>
  saveInstancia(estudioId: string, instanciaId: string, payload: Record<string, unknown>): Promise<void>
}

export interface UsuarioService {
  getUsuario(userId: string): Promise<Usuario | null>
  listClientes(): Promise<ClienteResumen[]>
}

// TODO Fase 2: interface del servicio de calendario (Calendly / Cal.com)
export interface SlotDisponible {
  id: string
  fecha: string
  horaInicio: string
  horaFin: string
  disponible: boolean
}

export interface CalendarioService {
  getSlots(fechaDesde: string, fechaHasta: string): Promise<SlotDisponible[]>
  reservarSlot(slotId: string, estudioId: string): Promise<Alta>
}
