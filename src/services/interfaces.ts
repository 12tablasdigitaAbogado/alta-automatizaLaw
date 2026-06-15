import type {
  Estudio,
  Documento,
  ConfiguracionModulos,
  ProgresoRoadmap,
  Alta,
  Usuario,
  ChecklistTecnico,
  ClienteResumen,
} from '@/types'

export interface EstudioService {
  getEstudio(estudioId: string): Promise<Estudio | null>
  saveEstudio(estudioId: string, data: Partial<Estudio>): Promise<void>
}

export interface DocumentoService {
  listDocumentos(estudioId: string): Promise<Documento[]>
  addDocumento(estudioId: string, doc: Documento): Promise<void>
  removeDocumento(estudioId: string, docId: string): Promise<void>
}

export interface ConfiguracionService {
  getConfiguracion(estudioId: string): Promise<ConfiguracionModulos>
  saveConfiguracion(estudioId: string, config: ConfiguracionModulos): Promise<void>
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

export interface UsuarioService {
  getUsuario(userId: string): Promise<Usuario | null>
  listClientes(): Promise<ClienteResumen[]>
}

// TODO Fase 2: interface del servicio de calendario (Calendly / Cal.com)
export interface CalendarioService {
  getSlots(fechaDesde: string, fechaHasta: string): Promise<SlotDisponible[]>
  reservarSlot(slotId: string, estudioId: string): Promise<Alta>
}

export interface SlotDisponible {
  id: string
  fecha: string
  horaInicio: string
  horaFin: string
  disponible: boolean
}
