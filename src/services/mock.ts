/**
 * Implementación MOCK de todos los servicios.
 * TODO Fase 2: reemplazar con src/services/supabase.ts y cambiar exports en index.ts
 */
import type {
  EstudioService, DocumentoService, ConfiguracionService,
  ContextoService, ChecklistService, ProgresoService, AltaService, UsuarioService,
} from './interfaces'
import type {
  Estudio, Documento, ConfiguracionModulos, ContextoEstudio,
  ChecklistTecnico, ProgresoRoadmap, Alta, ClienteResumen,
} from '@/types'
import { MOCK_ESTUDIOS } from '@/mocks/estudios'
import { MOCK_ALTAS } from '@/mocks/altas'
import { MOCK_PROGRESO, MOCK_CHECKLIST, MOCK_CONFIGURACION } from '@/mocks/progreso'
import { MOCK_USUARIOS } from '@/mocks/usuarios'
import { SKILL_MAP, carpetasDeSkills } from '@/data/skills'

const estudiosState: Record<string, Estudio> = { ...MOCK_ESTUDIOS }

const documentosState: Record<string, Documento[]> = {
  'estudio-001': [
    { id: 'doc-001', estudioId: 'estudio-001', carpeta: 'telegramas', nombre: 'Modelo CD intimacion pago.docx', tamano: 24576, fecha: '2026-06-01' },
    { id: 'doc-002', estudioId: 'estudio-001', carpeta: 'demandas', nombre: 'Modelo demanda ordinaria daños.docx', tamano: 51200, fecha: '2026-06-02' },
  ],
  'estudio-002': [],
  'estudio-003': [
    { id: 'doc-003', estudioId: 'estudio-003', carpeta: 'intake', nombre: 'Convenio honorarios modelo.docx', tamano: 32768, fecha: '2026-06-05' },
    { id: 'doc-004', estudioId: 'estudio-003', carpeta: 'liquidaciones', nombre: 'Planilla liquidacion final.xlsx', tamano: 45056, fecha: '2026-06-05' },
    { id: 'doc-005', estudioId: 'estudio-003', carpeta: 'demandas', nombre: 'Demanda despido modelo.docx', tamano: 61440, fecha: '2026-06-05' },
  ],
}

const altasState: Record<string, Alta> = { ...MOCK_ALTAS }
const progresoState: Record<string, ProgresoRoadmap> = { ...MOCK_PROGRESO }
const checklistState: Record<string, ChecklistTecnico> = { ...MOCK_CHECKLIST }
const configState: Record<string, ConfiguracionModulos> = { ...MOCK_CONFIGURACION }
const contextoState: Record<string, ContextoEstudio> = {
  'estudio-001': {
    cuota_litis_pct: '20%',
    fuero_procedimiento: 'Fuero Laboral CABA — CNAT — ley 18.345',
    fallos_cabecera: 'Vizzoti CSJN; Lucca de Hoz CSJN',
    rubros_liquidacion: '',
    tasa_interes: 'Tasa activa BNA — acta CNAT 2764',
  },
  'estudio-003': {
    cuota_litis_pct: '25%',
    rubros_liquidacion: 'Indemnización art. 245, preaviso, integración mes, vac. prop., SAC prop.',
    tasa_interes: 'Tasa activa BNA — acta CNAT 2601',
    fuero_procedimiento: 'Fuero Nacional del Trabajo CABA',
  },
}

const delay = (ms = 150) => new Promise(r => setTimeout(r, ms))

// ─── Estudio ────────────────────────────────────────────────────────────────
export const estudioService: EstudioService = {
  async getEstudio(id) {
    await delay()
    return estudiosState[id] ?? null
  },
  async saveEstudio(id, data) {
    await delay()
    const efectivoId = id || `estudio-${Date.now()}`
    estudiosState[efectivoId] = { ...(estudiosState[efectivoId] ?? { id: efectivoId }), ...data } as Estudio
    return efectivoId
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

// ─── Configuración ──────────────────────────────────────────────────────────
export const configuracionService: ConfiguracionService = {
  async getConfiguracion(estudioId) {
    await delay()
    return configState[estudioId] ?? { skillIds: [] }
  },
  async saveConfiguracion(estudioId, config) {
    await delay()
    configState[estudioId] = config
  },
}

// ─── Contexto ────────────────────────────────────────────────────────────────
export const contextoService: ContextoService = {
  async getContexto(estudioId) {
    await delay()
    return contextoState[estudioId] ?? {}
  },
  async saveContexto(estudioId, contexto) {
    await delay()
    contextoState[estudioId] = contexto
    await recalcularYGuardar(estudioId)
  },
}

// ─── Checklist ───────────────────────────────────────────────────────────────
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
  const config = configState[estudioId] ?? { skillIds: [] }
  const contexto = contextoState[estudioId] ?? {}
  const pasos = progresoState[estudioId]?.pasos ?? {
    1: 'pendiente', 2: 'pendiente', 3: 'pendiente',
    4: 'pendiente', 5: 'pendiente', 6: 'pendiente', 7: 'pendiente',
  }

  const identidadCompleta = !!(
    estudio?.denominacion &&
    estudio?.abogadoResponsable &&
    estudio?.matricula &&
    estudio?.domicilio &&
    estudio?.telefono &&
    estudio?.email
  )

  // Gating modelos: cada carpeta obligatoria de las skills activas tiene minArchivos
  const carpetasRequeridas = carpetasDeSkills(config.skillIds)
  const modelosOk = carpetasRequeridas
    .filter(c => c.obligatorio)
    .every(c => docs.filter(d => d.carpeta === c.carpeta).length >= c.minArchivos)

  // Gating contexto: cada campo obligatorio de las skills activas está completo
  const skillIds = config.skillIds
  const camposObligatorios = skillIds.flatMap(id => {
    const skill = SKILL_MAP[id]
    return skill ? skill.contexto.filter(c => c.obligatorio) : []
  })
  const idsVistos = new Set<string>()
  const camposUnicos = camposObligatorios.filter(c => {
    if (idsVistos.has(c.id)) return false
    idsVistos.add(c.id)
    return true
  })
  const contextoOk = camposUnicos.every(c => !!(contexto[c.id]?.trim()))

  const tieneDocumentos = skillIds.length === 0 ? docs.length > 0 : modelosOk

  const checklistCompleto = !!(
    checklist?.claudeDesktopInstalado &&
    checklist?.planClaudeActivo &&
    checklist?.tieneGoogleWorkspace &&
    checklist?.accesoInternetEstable &&
    checklist?.disponibleParaReunion
  )

  const desbloqueado = identidadCompleta && tieneDocumentos && contextoOk && checklistCompleto

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
    return clientes.map(usuario => {
      const estudioId = usuario.estudioId ?? ''
      return {
        usuario,
        estudio: estudiosState[estudioId] ?? {
          id: estudioId, denominacion: 'Sin datos', abogadoResponsable: '',
          matricula: '', domicilio: '', telefono: '', email: usuario.email,
          estiloRedaccion: '', pieFirma: '',
        },
        configuracion: configState[estudioId] ?? { skillIds: [] },
        contexto: contextoState[estudioId] ?? {},
        documentos: documentosState[estudioId] ?? [],
        progreso: progresoState[estudioId] ?? {
          usuarioId: usuario.id, pasos: {}, porcentaje: 0,
          identidadCompleta: false, tieneDocumentos: false,
          checklistCompleto: false, desbloqueado: false,
        },
        alta: altasState[estudioId] ?? { id: '', estudioId, estado: 'pendiente' },
      }
    })
  },
}
