import type { ProgresoRoadmap, ChecklistTecnico, ConfiguracionModulos } from '@/types'

export const MOCK_CHECKLIST: Record<string, ChecklistTecnico> = {
  'estudio-001': {
    claudeDesktopInstalado: true,
    planClaudeActivo: true,
    tieneGoogleWorkspace: true,
    accesoInternetEstable: true,
    disponibleParaReunion: true,
  },
  'estudio-002': {
    claudeDesktopInstalado: false,
    planClaudeActivo: false,
    tieneGoogleWorkspace: true,
    accesoInternetEstable: true,
    disponibleParaReunion: false,
  },
  'estudio-003': {
    claudeDesktopInstalado: true,
    planClaudeActivo: true,
    tieneGoogleWorkspace: true,
    accesoInternetEstable: true,
    disponibleParaReunion: true,
  },
}

export const MOCK_CONFIGURACION: Record<string, ConfiguracionModulos> = {
  'estudio-001': {
    skillIds: ['telegrama-cd', 'demanda-laboral', 'respuesta-telegrama'],
    conectores: ['google-drive', 'google-calendar', 'gmail'],
  },
  'estudio-002': {
    skillIds: [],
    conectores: [],
  },
  'estudio-003': {
    skillIds: ['alta-caso', 'liquidacion', 'demanda-laboral'],
    conectores: ['google-drive'],
  },
}

export const MOCK_PROGRESO: Record<string, ProgresoRoadmap> = {
  'estudio-001': {
    usuarioId: 'user-001',
    pasos: { 1: 'completo', 2: 'completo', 3: 'completo', 4: 'completo', 5: 'completo', 6: 'completo', 7: 'completo' },
    porcentaje: 100,
    identidadCompleta: true,
    tieneDocumentos: true,
    checklistCompleto: true,
    desbloqueado: true,
  },
  'estudio-002': {
    usuarioId: 'user-002',
    pasos: { 1: 'completo', 2: 'en-progreso', 3: 'pendiente', 4: 'pendiente', 5: 'pendiente', 6: 'pendiente', 7: 'pendiente' },
    porcentaje: 20,
    identidadCompleta: false,
    tieneDocumentos: false,
    checklistCompleto: false,
    desbloqueado: false,
  },
  'estudio-003': {
    usuarioId: 'user-003',
    pasos: { 1: 'completo', 2: 'completo', 3: 'completo', 4: 'completo', 5: 'completo', 6: 'completo', 7: 'completo' },
    porcentaje: 100,
    identidadCompleta: true,
    tieneDocumentos: true,
    checklistCompleto: true,
    desbloqueado: true,
  },
}
