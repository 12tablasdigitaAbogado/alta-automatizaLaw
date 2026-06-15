/**
 * Implementación MOCK de todos los servicios (Fase 1).
 * TODO Fase 2: reemplazar con implementaciones de Supabase en src/services/supabase.ts
 * y cambiar los exports en src/services/index.ts
 */
import type {
  EstudioService,
  DocumentoService,
  ConfiguracionService,
  ChecklistService,
  ProgresoService,
  AltaService,
  UsuarioService,
} from './interfaces'
import type { Estudio, Documento, ConfiguracionModulos, ChecklistTecnico, ProgresoRoadmap, Alta, ClienteResumen } from '@/types'
import { MOCK_ESTUDIOS } from '@/mocks/estudios'
import { MOCK_ALTAS } from '@/mocks/altas'
import { MOCK_PROGRESO, MOCK_CHECKLIST, MOCK_CONFIGURACION } from '@/mocks/progreso'
import { MOCK_USUARIOS } from '@/mocks/usuarios'

// Estado mutable en memoria (simula la DB)
const estudiosState: Record<string, Estudio> = { ...MOCK_ESTUDIOS }
const documentosState: Record<string, Documento[]> = {
  'estudio-001': [
    { id: 'doc-001', estudioId: 'estudio-001', categoria: 'cartas-documento', nombre: 'Modelo CD intimacion pago.docx', tamano: 24576, fecha: '2026-06-01' },
    { id: 'doc-002', estudioId: 'estudio-001', categoria: 'demandas', nombre: 'Modelo demanda ordinaria daños.docx', tamano: 51200, fecha: '2026-06-02' },
    { id: 'doc-003', estudioId: 'estudio-001', categoria: 'contratos', nombre: 'Contrato locacion modelo.docx', tamano: 38912, fecha: '2026-06-03' },
  ],
  'estudio-002': [],
  'estudio-003': [
    { id: 'doc-004', estudioId: 'estudio-003', categoria: 'escritos-varios', nombre: 'Recurso administrativo modelo.docx', tamano: 32768, fecha: '2026-06-05' },
  ],
}
const altasState: Record<string, Alta> = { ...MOCK_ALTAS }
const progresoState: Record<string, ProgresoRoadmap> = { ...MOCK_PROGRESO }
const checklistState: Record<string, ChecklistTecnico> = { ...MOCK_CHECKLIST }
const configState: Record<string, ConfiguracionModulos> = { ...MOCK_CONFIGURACION }

const delay = (ms = 150) => new Promise(r => setTimeout(r, ms))

// ─── Estudio ────────────────────────────────────────────────────────────────
export const estudioService: EstudioService = {
  async getEstudio(id) {
    await delay()
    return estudiosState[id] ?? null
  },
  async saveEstudio(id, data) {
    await delay()
    estudiosState[id] = { ...(estudiosState[id] ?? { id }), ...data } as Estudio
  },
}

// ─── Documentos ─────────────────────────────────────────────────────────────
export const documentoService: DocumentoService = {
  async listDocumentos(estudioId) {
    await delay()
    return documentosState[estudioId] ?? []
  },
  async addDocumento(estudioId, doc) {
    await delay()
    if (!documentosState[estudioId]) documentosState[estudioId] = []
    documentosState[estudioId].push(doc)
    await recalcularYGuardar(estudioId)
  },
  async removeDocumento(estudioId, docId) {
    await delay()
    documentosState[estudioId] = (documentosState[estudioId] ?? []).filter(d => d.id !== docId)
    await recalcularYGuardar(estudioId)
  },
}

// ─── Configuración de módulos ────────────────────────────────────────────────
export const configuracionService: ConfiguracionService = {
  async getConfiguracion(estudioId) {
    await delay()
    return configState[estudioId] ?? { modulos: [], conectores: [] }
  },
  async saveConfiguracion(estudioId, config) {
    await delay()
    configState[estudioId] = config
  },
}

// ─── Checklist técnico ───────────────────────────────────────────────────────
export const checklistService: ChecklistService = {
  async getChecklist(estudioId) {
    await delay()
    return checklistState[estudioId] ?? {
      claudeDesktopInstalado: false,
      planClaudeActivo: false,
      tieneGoogleWorkspace: false,
      accesoInternetEstable: false,
      disponibleParaReunion: false,
    }
  },
  async saveChecklist(estudioId, data) {
    await delay()
    checklistState[estudioId] = data
    await recalcularYGuardar(estudioId)
  },
}

// ─── Progreso ────────────────────────────────────────────────────────────────
async function recalcularYGuardar(estudioId: string): Promise<ProgresoRoadmap> {
  const estudio = estudiosState[estudioId]
  const docs = documentosState[estudioId] ?? []
  const checklist = checklistState[estudioId]
  const pasos = progresoState[estudioId]?.pasos ?? { 1: 'pendiente', 2: 'pendiente', 3: 'pendiente', 4: 'pendiente', 5: 'pendiente', 6: 'pendiente', 7: 'pendiente' }

  const identidadCompleta = !!(
    estudio?.denominacion &&
    estudio?.abogadoResponsable &&
    estudio?.matricula &&
    estudio?.domicilio &&
    estudio?.telefono &&
    estudio?.email &&
    estudio?.jurisdiccion &&
    estudio?.fueroPrincipal
  )

  const tieneDocumentos = docs.length > 0

  const checklistCompleto = !!(
    checklist?.claudeDesktopInstalado &&
    checklist?.planClaudeActivo &&
    checklist?.tieneGoogleWorkspace &&
    checklist?.accesoInternetEstable &&
    checklist?.disponibleParaReunion
  )

  const desbloqueado = identidadCompleta && tieneDocumentos && checklistCompleto

  // Calcular porcentaje basado en pasos completados (excl paso 7)
  const pasosBase = [1, 2, 3, 4, 5, 6]
  const completados = pasosBase.filter(p => pasos[p] === 'completo').length
  const porcentaje = Math.round((completados / pasosBase.length) * 100)

  const nuevo: ProgresoRoadmap = {
    usuarioId: progresoState[estudioId]?.usuarioId ?? '',
    pasos,
    porcentaje,
    identidadCompleta,
    tieneDocumentos,
    checklistCompleto,
    desbloqueado,
  }
  progresoState[estudioId] = nuevo
  return nuevo
}

export const progresoService: ProgresoService = {
  async getProgreso(estudioId) {
    await delay()
    return progresoState[estudioId] ?? await recalcularYGuardar(estudioId)
  },
  async recalcularProgreso(estudioId) {
    await delay()
    return recalcularYGuardar(estudioId)
  },
}

// Exponer para que otros servicios mock actualicen el progreso
export function marcarPasoCompleto(estudioId: string, paso: number) {
  if (!progresoState[estudioId]) return
  progresoState[estudioId].pasos[paso] = 'completo'
  recalcularYGuardar(estudioId)
}

// ─── Alta ────────────────────────────────────────────────────────────────────
export const altaService: AltaService = {
  async getAlta(estudioId) {
    await delay()
    return altasState[estudioId] ?? null
  },
  async reservarAlta(estudioId, fecha, hora) {
    await delay()
    const alta: Alta = {
      id: `alta-${Date.now()}`,
      estudioId,
      fecha,
      horaInicio: hora,
      horaFin: `${parseInt(hora) + 1}:00`,
      estado: 'agendada',
      linkMeet: 'https://meet.google.com/placeholder',
    }
    altasState[estudioId] = alta
    return alta
  },
  async actualizarEstado(altaId, estado) {
    await delay()
    const alta = Object.values(altasState).find(a => a.id === altaId)
    if (alta) alta.estado = estado
  },
  async listAltas() {
    await delay()
    return Object.values(altasState)
  },
}

// ─── Usuario / Admin ─────────────────────────────────────────────────────────
export const usuarioService: UsuarioService = {
  async getUsuario(userId) {
    await delay()
    return MOCK_USUARIOS.find(u => u.id === userId) ?? null
  },
  async listClientes(): Promise<ClienteResumen[]> {
    await delay()
    const clientes = MOCK_USUARIOS.filter(u => u.rol === 'cliente')
    return clientes.map(usuario => ({
      usuario,
      estudio: estudiosState[usuario.estudioId] ?? { id: usuario.estudioId, denominacion: 'Sin datos', abogadoResponsable: '', matricula: '', domicilio: '', telefono: '', email: usuario.email, jurisdiccion: '', fueroPrincipal: '', estiloRedaccion: '', pieFirma: '' },
      progreso: progresoState[usuario.estudioId] ?? { usuarioId: usuario.id, pasos: {}, porcentaje: 0, identidadCompleta: false, tieneDocumentos: false, checklistCompleto: false, desbloqueado: false },
      alta: altasState[usuario.estudioId] ?? { id: '', estudioId: usuario.estudioId, estado: 'pendiente' },
    }))
  },
}
