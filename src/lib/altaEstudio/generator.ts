import { INSTANCIAS, CARPETAS_MODELOS, type FieldDef, type InstanciaDef } from '@/data/altaEstudio'
import { campoVisible } from '@/context/AltaEstudioContext'

type Respuestas = Record<string, Record<string, unknown>>

// ─── perfil_estudio.md ───────────────────────────────────────────────────────

export function generarPerfilEstudio(respuestas: Respuestas): string {
  const lineas: string[] = []
  const denominacion = String(respuestas['datos-estudio']?.denominacion ?? 'Estudio')
  lineas.push(`# ${denominacion} — Perfil del estudio`)
  lineas.push('')
  lineas.push(`_Generado el ${new Date().toISOString().slice(0, 10)}_`)
  lineas.push('')

  for (const inst of INSTANCIAS) {
    if (inst.id === 'modelos-plantillas') continue // los modelos se vuelcan en la estructura de carpetas, no en el .md
    lineas.push(`## ${inst.numero}. ${inst.titulo}`)
    lineas.push('')
    const local = respuestas[inst.id] ?? {}
    const bloque = renderCampos(inst.campos, local, respuestas)
    if (bloque.trim() === '') {
      lineas.push('_Pendiente de completar._')
    } else {
      lineas.push(bloque)
    }
    lineas.push('')
  }

  return lineas.join('\n')
}

function renderCampos(campos: FieldDef[], local: Record<string, unknown>, todas: Respuestas, nivel = 0): string {
  const partes: string[] = []
  for (const campo of campos) {
    if (!campoVisible(campo, local, todas)) continue
    const valor = local[campo.id]
    if (!hasValor(valor)) continue
    partes.push(formatearCampo(campo, valor, todas, nivel))
  }
  return partes.join('\n\n')
}

function hasValor(v: unknown): boolean {
  if (v === undefined || v === null || v === '') return false
  if (Array.isArray(v) && v.length === 0) return false
  return true
}

function formatearCampo(campo: FieldDef, valor: unknown, todas: Respuestas, nivel: number): string {
  const heading = nivel === 0 ? '###' : '####'
  switch (campo.tipo) {
    case 'text':
    case 'textarea':
      return `${heading} ${campo.label}\n${String(valor)}`
    case 'number':
      return `${heading} ${campo.label}\n${String(valor)}`
    case 'boolean':
      return `${heading} ${campo.label}\n${valor ? 'Sí' : 'No'}`
    case 'radio':
    case 'select': {
      const label = campo.opciones?.find(o => o.value === valor)?.label ?? String(valor)
      return `${heading} ${campo.label}\n${label}`
    }
    case 'multi': {
      const arr = (valor as string[]) ?? []
      const labels = arr.map(v => campo.opciones?.find(o => o.value === v)?.label ?? v)
      return `${heading} ${campo.label}\n${labels.map(l => `- ${l}`).join('\n')}`
    }
    case 'repeatable': {
      const items = (valor as Record<string, unknown>[]) ?? []
      const sub = items.map((item, i) => {
        const cuerpo = renderCampos(campo.campos ?? [], item, todas, nivel + 1)
        return `**${campo.itemLabel ?? 'Ítem'} ${i + 1}**\n\n${cuerpo}`
      }).join('\n\n')
      return `${heading} ${campo.label}\n\n${sub}`
    }
    case 'file':
      // Los archivos no van al .md; se listan en el manifiesto.
      return ''
    default:
      return ''
  }
}

// ─── Manifiesto de carpetas ──────────────────────────────────────────────────

export interface ManifestoCarpeta {
  path: string       // relativo a "<Estudio> – Laboral/"
  descripcion: string
}

export function generarManifiestoCarpetas(_respuestas: Respuestas): ManifestoCarpeta[] {
  const carpetasBase: ManifestoCarpeta[] = [
    { path: 'perfil_estudio.md',     descripcion: 'Perfil del estudio generado por el alta.' },
    { path: 'modelos/telegramas',    descripcion: 'Modelos de telegramas y cartas documento.' },
    { path: 'modelos/demandas',      descripcion: 'Modelos de demanda por tipo de caso.' },
    { path: 'modelos/escritos',      descripcion: 'Escritos de trámite, ofrecimiento de prueba, alegatos y recursos.' },
    { path: 'modelos/liquidaciones', descripcion: 'Liquidaciones (provistas por la plataforma).' },
    { path: 'modelos/impugnaciones', descripcion: 'Impugnaciones periciales.' },
    { path: 'modelos/honorarios',    descripcion: 'Contratos de honorarios y pacto de cuota litis.' },
    { path: 'modelos/comunicaciones',descripcion: 'Plantillas de comunicación con clientes.' },
    { path: 'datos/escalas-cct',     descripcion: 'Escalas salariales de CCT propias del estudio.' },
    { path: 'clientes',              descripcion: 'Un subdirectorio por cliente / expediente.' },
  ]
  return carpetasBase
}

// Devuelve los archivos que el usuario subió en la instancia 9,
// mapeados a la carpeta canónica en la que deberían quedar.
export function mapearArchivosACarpetas(archivos: Record<string, File[]>): { carpeta: string; archivo: File }[] {
  const salida: { carpeta: string; archivo: File }[] = []
  for (const { fieldId, carpeta } of CARPETAS_MODELOS) {
    for (const f of archivos[fieldId] ?? []) {
      salida.push({ carpeta, archivo: f })
    }
  }
  return salida
}

// Utilidad para debug/preview: manifiesto en texto plano.
export function manifiestoToText(_denominacion: string, manifiesto: ManifestoCarpeta[]): string {
  const lineas = ['Estructura de carpetas del estudio:', '']
  for (const c of manifiesto) {
    lineas.push(`- ${c.path}  # ${c.descripcion}`)
  }
  return lineas.join('\n')
}

// Punto de integración pendiente:
// Cuando conectemos back, esta función va a orquestar:
// 1. UPSERT en tablas `estudios`, `abogados`, `jurisdicciones`, `respuestas_alta`.
// 2. Creación de carpetas en Storage (bucket `modelos` + `datos`).
// 3. Upload de los File[] a las carpetas mapeadas.
// 4. Guardado del perfil_estudio.md en la raíz del estudio.
export function _puntoIntegracionBackend(): void {
  // ver TODO en Tarea 2 - persistencia
}

export function _referenciaInstancias(): InstanciaDef[] {
  return INSTANCIAS
}
