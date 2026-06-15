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
  telefono: string
  email: string
  jurisdiccion: string
  fueroPrincipal: string
  estiloRedaccion: string
  pieFirma: string
}

export type CategoriaDocumento =
  | 'cartas-documento'
  | 'demandas'
  | 'contratos'
  | 'escritos-varios'

export interface Documento {
  id: string
  estudioId: string
  categoria: CategoriaDocumento
  nombre: string
  tamano: number
  fecha: string
  // En Fase 1 el archivo vive solo en memoria (File object no serializable)
  // TODO Fase 2: subir a Supabase Storage y guardar la URL
  archivoLocal?: File
}

// TODO Fase 2: definir la lista real de módulos disponibles con el equipo
export type ModuloId =
  | 'redaccion-escritos'
  | 'cartas-documento'
  | 'respuesta-telegramas'
  | 'analisis-contratos'
  | 'consulta-jurisprudencia'
  | 'liquidacion-honorarios'

export type ConectorId = 'google-drive' | 'google-calendar' | 'gmail'

export interface ConfiguracionModulos {
  modulos: ModuloId[]
  conectores: ConectorId[]
}

export type EstadoPaso = 'pendiente' | 'en-progreso' | 'completo'

export interface ProgresoRoadmap {
  usuarioId: string
  pasos: Record<number, EstadoPaso>
  porcentaje: number
  // Gating: los tres requisitos para desbloquear el paso 7
  identidadCompleta: boolean
  tieneDocumentos: boolean
  checklistCompleto: boolean
  desbloqueado: boolean
}

export type EstadoAlta =
  | 'pendiente'
  | 'agendada'
  | 'realizada'

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

// Estado del checklist técnico (paso 5)
export interface ChecklistTecnico {
  claudeDesktopInstalado: boolean
  planClaudeActivo: boolean
  tieneGoogleWorkspace: boolean
  accesoInternetEstable: boolean
  disponibleParaReunion: boolean
}

// Checklist del runbook de alta (solo admin)
export interface RunbookItem {
  id: string
  label: string
  completado: boolean
}

// Cliente enriquecido para la lista del admin
export interface ClienteResumen {
  usuario: Usuario
  estudio: Estudio
  progreso: ProgresoRoadmap
  alta: Alta
}
