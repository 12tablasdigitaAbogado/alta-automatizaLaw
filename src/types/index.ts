import type { SkillId } from '@/data/skills'
export type { SkillId } from '@/data/skills'

export type Rol = 'cliente' | 'operador'

export type EstadoCliente = 'pendiente' | 'activo' | 'rechazado'

export interface Usuario {
  id: string
  email: string
  rol: Rol
  estado: EstadoCliente
  nombre: string
  estudioId?: string
}

export interface Estudio {
  id: string
  denominacion: string
  abogadoResponsable: string
  matricula: string
  domicilio: string
  domicilioConstituido?: string
  telefono: string
  telefonoFijo?: string
  email: string
  estiloRedaccion: string
  pieFirma: string
}

export type ContextoEstudio = Record<string, string>

export interface Documento {
  id: string
  estudioId: string
  carpeta: string
  nombre: string
  tamano: number
  fecha: string
  storagePath?: string
  archivoLocal?: File
}

export interface Abogado {
  id?: string
  nombre: string
  cuit?: string
  matricula?: string
  colegio?: string
}

export interface Jurisdiccion {
  id?: string
  nombre: string
  instanciaPrevia?: string
  ofrecimientoPrueba?: string
  presentacionElectronica?: string
}

// Estado del wizard de alta: respuestas por instancia.
export type RespuestasAlta = Record<string, Record<string, unknown>>

export interface ConfiguracionModulos {
  skillIds: SkillId[]
}

export type EstadoPaso = 'pendiente' | 'en-progreso' | 'completo'

export interface ProgresoRoadmap {
  usuarioId: string
  pasos: Record<number, EstadoPaso>
  porcentaje: number
  identidadCompleta: boolean
  tieneDocumentos: boolean
  checklistCompleto: boolean
  desbloqueado: boolean
}

export type EstadoAlta = 'pendiente' | 'agendada' | 'realizada'

export interface Alta {
  id: string
  estudioId: string
  fecha?: string
  horaInicio?: string
  horaFin?: string
  linkMeet?: string
  estado: EstadoAlta
  notas?: string
}

export interface ChecklistTecnico {
  claudeDesktopInstalado: boolean
  planClaudeActivo: boolean
  tieneGoogleWorkspace: boolean
  accesoInternetEstable: boolean
  disponibleParaReunion: boolean
}

export interface RunbookItem {
  id: string
  label: string
  completado: boolean
}

export interface ClienteResumen {
  usuario: Usuario
  estudio: Estudio
  configuracion: ConfiguracionModulos
  contexto: ContextoEstudio
  documentos: Documento[]
  progreso: ProgresoRoadmap
  alta: Alta
}
