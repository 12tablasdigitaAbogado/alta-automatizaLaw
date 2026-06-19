import { supabase } from '@/lib/supabase'
import type {
  EstudioService, DocumentoService, ConfiguracionService,
  ContextoService, ChecklistService, ProgresoService, AltaService, UsuarioService,
} from './interfaces'
import type {
  Estudio, Documento, ConfiguracionModulos, ContextoEstudio,
  ChecklistTecnico, ProgresoRoadmap, Alta, ClienteResumen, Usuario, Rol, EstadoCliente,
} from '@/types'
import { carpetasDeSkills } from '@/data/skills'

const STORAGE_BUCKET = 'modelos'

// ─── Mappers ─────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToEstudio(row: any): Estudio {
  return {
    id: row.id,
    denominacion: row.denominacion ?? '',
    abogadoResponsable: row.abogado_responsable ?? '',
    matricula: row.matricula ?? '',
    domicilio: row.domicilio ?? '',
    telefono: row.telefono ?? '',
    email: row.email_estudio ?? '',
    estiloRedaccion: row.estilo_redaccion ?? '',
    pieFirma: row.pie_firma ?? '',
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToDocumento(row: any): Documento {
  return {
    id: row.id,
    estudioId: row.estudio_id,
    carpeta: row.carpeta,
    nombre: row.nombre,
    tamano: row.tamano ?? 0,
    fecha: row.fecha ?? new Date().toISOString().slice(0, 10),
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToChecklist(row: any): ChecklistTecnico {
  return {
    claudeDesktopInstalado: row.claude_desktop ?? false,
    planClaudeActivo: row.plan_activo ?? false,
    tieneGoogleWorkspace: row.google_workspace ?? false,
    accesoInternetEstable: row.buena_internet ?? false,
    disponibleParaReunion: row.disponibilidad_reunion ?? false,
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToProgreso(row: any, usuarioId = ''): ProgresoRoadmap {
  return {
    usuarioId,
    pasos: row.pasos ?? { ...PROGRESO_DEFAULT_PASOS },
    porcentaje: row.porcentaje ?? 0,
    identidadCompleta: row.identidad_completa ?? false,
    tieneDocumentos: row.tiene_documentos ?? false,
    checklistCompleto: row.checklist_completo ?? false,
    desbloqueado: row.desbloqueado ?? false,
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToAlta(row: any): Alta {
  return {
    id: row.id,
    estudioId: row.estudio_id,
    fecha: row.fecha ?? undefined,
    horaInicio: row.hora_inicio ?? undefined,
    horaFin: row.hora_fin ?? undefined,
    linkMeet: row.link_meet ?? undefined,
    estado: row.estado ?? 'pendiente',
    notas: row.notas ?? undefined,
  }
}

const PROGRESO_DEFAULT_PASOS = {
  1: 'pendiente', 2: 'pendiente', 3: 'pendiente',
  4: 'pendiente', 5: 'pendiente', 6: 'pendiente',
} as const

// ─── EstudioService ──────────────────────────────────────────────────────────

export const estudioService: EstudioService = {
  async getEstudio(estudioId) {
    if (!estudioId) return null
    const { data, error } = await supabase
      .from('estudios')
      .select('*')
      .eq('id', estudioId)
      .single()
    if (error || !data) return null
    return rowToEstudio(data)
  },

  async saveEstudio(estudioId, data) {
    const dbData: Record<string, unknown> = {}
    if (data.denominacion !== undefined) dbData.denominacion = data.denominacion
    if (data.abogadoResponsable !== undefined) dbData.abogado_responsable = data.abogadoResponsable
    if (data.matricula !== undefined) dbData.matricula = data.matricula
    if (data.domicilio !== undefined) dbData.domicilio = data.domicilio
    if (data.telefono !== undefined) dbData.telefono = data.telefono
    if (data.email !== undefined) dbData.email_estudio = data.email
    if (data.estiloRedaccion !== undefined) dbData.estilo_redaccion = data.estiloRedaccion
    if (data.pieFirma !== undefined) dbData.pie_firma = data.pieFirma

    if (estudioId) {
      const { error } = await supabase
        .from('estudios')
        .update({ ...dbData, updated_at: new Date().toISOString() })
        .eq('id', estudioId)
      if (error) throw new Error(error.message)
      return estudioId
    }

    // New client: use SECURITY DEFINER RPC to bypass RLS chicken-and-egg
    // (SELECT policy can't see the row until perfiles.estudio_id is set,
    //  but we need the row id to set it — the function does both atomically)
    const { data: newId, error: rpcError } = await supabase.rpc('crear_estudio_inicial', {
      p_denominacion:        (dbData.denominacion        as string) ?? '',
      p_abogado_responsable: (dbData.abogado_responsable as string) ?? '',
      p_matricula:           (dbData.matricula           as string) ?? '',
      p_domicilio:           (dbData.domicilio           as string) ?? '',
      p_telefono:            (dbData.telefono            as string) ?? '',
      p_email_estudio:       (dbData.email_estudio       as string) ?? '',
      p_estilo_redaccion:    (dbData.estilo_redaccion    as string) ?? '',
      p_pie_firma:           (dbData.pie_firma           as string) ?? '',
    })
    if (rpcError || !newId) throw new Error(rpcError?.message ?? 'Error creando estudio')

    return newId as string
  },
}

// ─── DocumentoService ────────────────────────────────────────────────────────

export const documentoService: DocumentoService = {
  async listDocumentos(estudioId) {
    if (!estudioId) return []
    const { data, error } = await supabase
      .from('documentos')
      .select('*')
      .eq('estudio_id', estudioId)
      .order('created_at', { ascending: false })
    if (error || !data) return []
    return data.map(rowToDocumento)
  },

  async addDocumento(estudioId, doc) {
    let storagePath = ''

    if (doc.archivoLocal) {
      storagePath = `${estudioId}/${doc.carpeta}/${doc.id}-${doc.nombre}`
      const { error: uploadError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(storagePath, doc.archivoLocal, { upsert: false })
      if (uploadError) throw new Error(uploadError.message)
    }

    const { error } = await supabase
      .from('documentos')
      .insert({
        id: doc.id,
        estudio_id: estudioId,
        carpeta: doc.carpeta,
        nombre: doc.nombre,
        tamano: doc.tamano,
        fecha: doc.fecha || new Date().toISOString().slice(0, 10),
        storage_path: storagePath,
      })
    if (error) throw new Error(error.message)
  },

  async removeDocumento(estudioId, docId) {
    // Get storage_path before deleting
    const { data } = await supabase
      .from('documentos')
      .select('storage_path')
      .eq('id', docId)
      .eq('estudio_id', estudioId)
      .single()

    const { error } = await supabase
      .from('documentos')
      .delete()
      .eq('id', docId)
      .eq('estudio_id', estudioId)
    if (error) throw new Error(error.message)

    if (data?.storage_path) {
      await supabase.storage.from(STORAGE_BUCKET).remove([data.storage_path])
    }
  },
}

// ─── ConfiguracionService ────────────────────────────────────────────────────

export const configuracionService: ConfiguracionService = {
  async getConfiguracion(estudioId) {
    if (!estudioId) return { skillIds: [] }
    const { data } = await supabase
      .from('configuracion_modulos')
      .select('modulos')
      .eq('estudio_id', estudioId)
      .single()
    if (!data) return { skillIds: [] }
    return {
      skillIds: (data.modulos ?? []) as ConfiguracionModulos['skillIds'],
    }
  },

  async saveConfiguracion(estudioId, config) {
    if (!estudioId) return
    const { error } = await supabase
      .from('configuracion_modulos')
      .upsert(
        { estudio_id: estudioId, modulos: config.skillIds, updated_at: new Date().toISOString() },
        { onConflict: 'estudio_id' }
      )
    if (error) throw new Error(error.message)
  },
}

// ─── ContextoService ─────────────────────────────────────────────────────────

export const contextoService: ContextoService = {
  async getContexto(estudioId) {
    if (!estudioId) return {}
    const { data } = await supabase
      .from('estudios')
      .select('contexto')
      .eq('id', estudioId)
      .single()
    return (data?.contexto as ContextoEstudio) ?? {}
  },

  async saveContexto(estudioId, contexto) {
    if (!estudioId) return
    const { error } = await supabase
      .from('estudios')
      .update({ contexto, updated_at: new Date().toISOString() })
      .eq('id', estudioId)
    if (error) throw new Error(error.message)
  },
}

// ─── ChecklistService ─────────────────────────────────────────────────────────

export const checklistService: ChecklistService = {
  async getChecklist(estudioId) {
    const defaults: ChecklistTecnico = {
      claudeDesktopInstalado: false,
      planClaudeActivo: false,
      tieneGoogleWorkspace: false,
      accesoInternetEstable: false,
      disponibleParaReunion: false,
    }
    if (!estudioId) return defaults
    const { data } = await supabase
      .from('checklist_tecnico')
      .select('*')
      .eq('estudio_id', estudioId)
      .single()
    if (!data) return defaults
    return rowToChecklist(data)
  },

  async saveChecklist(estudioId, data) {
    if (!estudioId) return
    const { error } = await supabase
      .from('checklist_tecnico')
      .upsert(
        {
          estudio_id: estudioId,
          claude_desktop: data.claudeDesktopInstalado,
          plan_activo: data.planClaudeActivo,
          google_workspace: data.tieneGoogleWorkspace,
          buena_internet: data.accesoInternetEstable,
          disponibilidad_reunion: data.disponibleParaReunion,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'estudio_id' }
      )
    if (error) throw new Error(error.message)
  },
}

// ─── ProgresoService ──────────────────────────────────────────────────────────

async function computeYGuardar(estudioId: string): Promise<ProgresoRoadmap> {
  const [
    { data: estudioRow },
    { data: docs },
    { data: chkRow },
    { data: cfgRow },
    { data: progresoRow },
  ] = await Promise.all([
    supabase.from('estudios').select('denominacion, abogado_responsable, matricula, domicilio, telefono, email_estudio, perfil_id, contexto').eq('id', estudioId).single(),
    supabase.from('documentos').select('carpeta').eq('estudio_id', estudioId),
    supabase.from('checklist_tecnico').select('*').eq('estudio_id', estudioId).single(),
    supabase.from('configuracion_modulos').select('modulos').eq('estudio_id', estudioId).single(),
    supabase.from('progreso_roadmap').select('pasos').eq('estudio_id', estudioId).single(),
  ])

  const identidadCompleta = !!(
    estudioRow?.denominacion &&
    estudioRow?.abogado_responsable &&
    estudioRow?.matricula &&
    estudioRow?.domicilio &&
    estudioRow?.telefono &&
    estudioRow?.email_estudio
  )

  const skillIds = (cfgRow?.modulos ?? []) as ConfiguracionModulos['skillIds']
  const carpetasRequeridas = carpetasDeSkills(skillIds)
  const docList = docs ?? []
  const modelosOk = carpetasRequeridas
    .filter(c => c.obligatorio)
    .every(c => docList.filter((d: { carpeta: string }) => d.carpeta === c.carpeta).length >= c.minArchivos)

  const tieneDocumentos = skillIds.length === 0 ? docList.length > 0 : modelosOk

  const checklist = chkRow ? rowToChecklist(chkRow) : null
  const checklistCompleto = !!(
    checklist?.claudeDesktopInstalado &&
    checklist?.planClaudeActivo &&
    checklist?.tieneGoogleWorkspace &&
    checklist?.accesoInternetEstable &&
    checklist?.disponibleParaReunion
  )

  const desbloqueado = identidadCompleta && checklistCompleto

  const pasos = (progresoRow?.pasos as ProgresoRoadmap['pasos']) ?? { ...PROGRESO_DEFAULT_PASOS }
  const pasosBase = [1, 2, 3, 4, 5, 6]
  const completados = pasosBase.filter(p => pasos[p] === 'completo').length
  const porcentaje = Math.round((completados / pasosBase.length) * 100)

  const { error } = await supabase
    .from('progreso_roadmap')
    .upsert(
      {
        estudio_id: estudioId,
        pasos,
        porcentaje,
        identidad_completa: identidadCompleta,
        tiene_documentos: tieneDocumentos,
        checklist_completo: checklistCompleto,
        desbloqueado,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'estudio_id' }
    )
  if (error) console.error('Error guardando progreso:', error)

  return {
    usuarioId: estudioRow?.perfil_id ?? '',
    pasos,
    porcentaje,
    identidadCompleta,
    tieneDocumentos,
    checklistCompleto,
    desbloqueado,
  }
}

export const progresoService: ProgresoService = {
  async getProgreso(estudioId) {
    if (!estudioId) return { usuarioId: '', pasos: { ...PROGRESO_DEFAULT_PASOS }, porcentaje: 0, identidadCompleta: false, tieneDocumentos: false, checklistCompleto: false, desbloqueado: false }
    const { data } = await supabase
      .from('progreso_roadmap')
      .select('*, estudios!inner(perfil_id)')
      .eq('estudio_id', estudioId)
      .single()
    if (!data) return computeYGuardar(estudioId)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return rowToProgreso(data, (data as any).estudios?.perfil_id ?? '')
  },
  async recalcularProgreso(estudioId) {
    if (!estudioId) return { usuarioId: '', pasos: { ...PROGRESO_DEFAULT_PASOS }, porcentaje: 0, identidadCompleta: false, tieneDocumentos: false, checklistCompleto: false, desbloqueado: false }
    return computeYGuardar(estudioId)
  },
}

export async function marcarPasoCompleto(estudioId: string, paso: number) {
  if (!estudioId) return
  const { data } = await supabase
    .from('progreso_roadmap')
    .select('pasos')
    .eq('estudio_id', estudioId)
    .single()

  const pasos = { ...(data?.pasos ?? PROGRESO_DEFAULT_PASOS), [paso]: 'completo' }
  await supabase
    .from('progreso_roadmap')
    .upsert(
      { estudio_id: estudioId, pasos, updated_at: new Date().toISOString() },
      { onConflict: 'estudio_id' }
    )
}

// ─── AltaService ─────────────────────────────────────────────────────────────

export const altaService: AltaService = {
  async getAlta(estudioId) {
    if (!estudioId) return null
    const { data } = await supabase
      .from('altas')
      .select('*')
      .eq('estudio_id', estudioId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()
    if (!data) return null
    return rowToAlta(data)
  },

  async reservarAlta(estudioId, fecha, horaOLink) {
    const isLink = horaOLink.startsWith('http') || horaOLink === ''
    const { data, error } = await supabase
      .from('altas')
      .insert({
        estudio_id: estudioId,
        ...(fecha && { fecha }),
        ...(isLink ? { link_meet: horaOLink || null } : { hora_inicio: horaOLink }),
        estado: 'agendada',
      })
      .select()
      .single()
    if (error || !data) throw new Error(error?.message ?? 'Error reservando alta')
    return rowToAlta(data)
  },

  async actualizarEstado(altaId, estado) {
    const { error } = await supabase
      .from('altas')
      .update({ estado, updated_at: new Date().toISOString() })
      .eq('id', altaId)
    if (error) throw new Error(error.message)
  },

  async listAltas() {
    const { data } = await supabase
      .from('altas')
      .select('*')
      .order('created_at', { ascending: false })
    return (data ?? []).map(rowToAlta)
  },
}

// ─── UsuarioService ───────────────────────────────────────────────────────────

export const usuarioService: UsuarioService = {
  async getUsuario(userId) {
    const { data } = await supabase
      .from('perfiles')
      .select('id, email, nombre, rol, estado, estudio_id')
      .eq('id', userId)
      .single()
    if (!data) return null
    return {
      id: data.id,
      email: data.email,
      nombre: data.nombre,
      rol: data.rol as Rol,
      estado: data.estado as EstadoCliente,
      estudioId: data.estudio_id ?? undefined,
    }
  },

  async listClientes(): Promise<ClienteResumen[]> {
    const { data: perfiles } = await supabase
      .from('perfiles')
      .select(`
        id, email, nombre, rol, estado, estudio_id,
        estudios!perfiles_estudio_id_fkey (
          id, denominacion, abogado_responsable, matricula, domicilio, telefono,
          email_estudio, estilo_redaccion, pie_firma, contexto,
          configuracion_modulos ( modulos ),
          progreso_roadmap ( pasos, porcentaje, identidad_completa, tiene_documentos, checklist_completo, desbloqueado ),
          documentos ( id, estudio_id, carpeta, nombre, tamano, fecha ),
          altas ( id, estudio_id, fecha, hora_inicio, hora_fin, link_meet, estado, notas )
        )
      `)
      .eq('rol', 'cliente')
      .order('created_at', { ascending: false })

    if (!perfiles) return []

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return perfiles.map((p: any) => {
      const est = p.estudios
      const usuario: Usuario = {
        id: p.id,
        email: p.email,
        nombre: p.nombre,
        rol: p.rol as Rol,
        estado: p.estado as EstadoCliente,
        estudioId: p.estudio_id ?? undefined,
      }

      if (!est) {
        return {
          usuario,
          estudio: { id: '', denominacion: 'Sin datos', abogadoResponsable: '', matricula: '', domicilio: '', telefono: '', email: p.email, estiloRedaccion: '', pieFirma: '' },
          configuracion: { skillIds: [] },
          contexto: {},
          documentos: [],
          progreso: { usuarioId: p.id, pasos: { ...PROGRESO_DEFAULT_PASOS }, porcentaje: 0, identidadCompleta: false, tieneDocumentos: false, checklistCompleto: false, desbloqueado: false },
          alta: { id: '', estudioId: '', estado: 'pendiente' as const },
        }
      }

      const cfg = Array.isArray(est.configuracion_modulos) ? est.configuracion_modulos[0] : est.configuracion_modulos
      const prog = Array.isArray(est.progreso_roadmap) ? est.progreso_roadmap[0] : est.progreso_roadmap
      const altas: Alta[] = Array.isArray(est.altas) ? est.altas.map(rowToAlta) : []
      const ultimaAlta = altas[0] ?? { id: '', estudioId: est.id, estado: 'pendiente' as const }

      return {
        usuario,
        estudio: rowToEstudio(est),
        configuracion: {
          skillIds: (cfg?.modulos ?? []) as ConfiguracionModulos['skillIds'],
        },
        contexto: (est.contexto as ContextoEstudio) ?? {},
        documentos: (est.documentos ?? []).map(rowToDocumento),
        progreso: prog
          ? rowToProgreso(prog, p.id)
          : { usuarioId: p.id, pasos: { ...PROGRESO_DEFAULT_PASOS }, porcentaje: 0, identidadCompleta: false, tieneDocumentos: false, checklistCompleto: false, desbloqueado: false },
        alta: ultimaAlta,
      }
    })
  },
}
