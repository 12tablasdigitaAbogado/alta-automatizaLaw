export type SkillId =
  | 'telegrama-cd'
  | 'demanda-laboral'
  | 'escritos-tramite'
  | 'liquidacion-rubros'
  | 'analisis-contestacion'
  | 'preparacion-testimonial'
  | 'impugnacion-pericial'
  | 'alegato'
  | 'triage-consultas'
  | 'jurisdiccion-competencia'
  | 'respuesta-clientes'
  | 'investigacion-juridica'
  | 'contrato-honorarios'

export interface ModeloRequerido {
  carpeta: string
  label: string
  ejemplo: string
  obligatorio: boolean
  minArchivos: number
  // TODO: cargar archivos modelo por defecto en Supabase Storage (bucket público) y poner las URLs acá
  modeloDefault?: string
}

export interface CampoContexto {
  id: string
  label: string
  tipo: 'text' | 'textarea' | 'select'
  obligatorio: boolean
  ayuda?: string
  opciones?: string[]
}

export interface Skill {
  id: SkillId
  nombre: string
  descripcion: string
  bloque: string
  modelos: ModeloRequerido[]
  contexto: CampoContexto[]
}

// ─── Bloque 1 · Redacción ─────────────────────────────────────────────────────

const bloque1: Skill[] = [
  {
    id: 'telegrama-cd',
    nombre: 'Telegrama / Carta Documento',
    descripcion: 'Redacta todas las intimaciones laborales: registración, sub-registración, hostigamiento, diferencias, art. 80, despido indirecto y réplicas.',
    bloque: 'Redacción',
    modelos: [
      {
        carpeta: 'telegramas',
        label: 'Modelos de telegramas y cartas documento',
        ejemplo: 'Intimación registración, CD despido indirecto, réplica a telegrama del empleador, art. 80 LCT.',
        obligatorio: true,
        minArchivos: 1,
      },
    ],
    contexto: [],
  },
  {
    id: 'demanda-laboral',
    nombre: 'Demanda Laboral',
    descripcion: 'Genera el escrito de inicio en sus 4 variantes, con la liquidación completa donde la jurisdicción lo exige.',
    bloque: 'Redacción',
    modelos: [
      {
        carpeta: 'demandas',
        label: 'Demandas reales por tipo de caso',
        ejemplo: 'Demanda por despido incausado, diferencias salariales, accidente de trabajo, ofrecimiento de prueba.',
        obligatorio: true,
        minArchivos: 1,
      },
    ],
    contexto: [],
  },
  {
    id: 'escritos-tramite',
    nombre: 'Escritos de Trámite',
    descripcion: 'Toda la papelería procesal: poder, cuota litis, segundo traslado, apertura a prueba, cédulas, oficios, acuerdos y ejecución.',
    bloque: 'Redacción',
    modelos: [
      {
        carpeta: 'escritos-tramite',
        label: 'Escritos procesales del estudio',
        ejemplo: 'Poder, pacto de cuota litis, escrito apertura a prueba, oficio bancario, acuerdo homologatorio.',
        obligatorio: true,
        minArchivos: 1,
      },
    ],
    contexto: [],
  },
]

// ─── Bloque 2 · Cálculo ───────────────────────────────────────────────────────

const bloque2: Skill[] = [
  {
    id: 'liquidacion-rubros',
    nombre: 'Liquidación de Rubros',
    descripcion: 'Calcula la indemnización en modo preliminar, para demanda o actualizada. Para diferencias salariales necesita la escala del CCT.',
    bloque: 'Cálculo',
    modelos: [
      {
        carpeta: 'liquidaciones',
        label: 'Planilla de liquidación del estudio (opcional)',
        ejemplo: 'Planilla Excel con fórmulas para art. 245, preaviso, vacaciones, SAC, multas 24.013/25.323.',
        obligatorio: false,
        minArchivos: 0,
      },
    ],
    contexto: [],
  },
]

// ─── Bloque 3 · Estrategia ────────────────────────────────────────────────────

const bloque3: Skill[] = [
  {
    id: 'analisis-contestacion',
    nombre: 'Análisis de Contestación',
    descripcion: 'Cruza la contestación del empleador contra el expediente y marca los puntos débiles de la contraria.',
    bloque: 'Estrategia',
    modelos: [],
    contexto: [],
  },
  {
    id: 'preparacion-testimonial',
    nombre: 'Preparación Testimonial',
    descripcion: 'Arma el punteo de qué debe reforzar cada testigo según las debilidades del caso.',
    bloque: 'Estrategia',
    modelos: [],
    contexto: [],
  },
  {
    id: 'impugnacion-pericial',
    nombre: 'Impugnación Pericial',
    descripcion: 'Redacta la impugnación a la pericia desfavorable (típico: diferencias salariales).',
    bloque: 'Estrategia',
    modelos: [
      {
        carpeta: 'impugnaciones',
        label: 'Modelo de impugnación pericial del estudio',
        ejemplo: 'Impugnación a pericia contable por diferencias salariales.',
        obligatorio: true,
        minArchivos: 1,
      },
    ],
    contexto: [],
  },
  {
    id: 'alegato',
    nombre: 'Alegato',
    descripcion: 'Sintetiza la prueba producida y arma el alegato orientado al pedido de sentencia.',
    bloque: 'Estrategia',
    modelos: [
      {
        carpeta: 'alegatos',
        label: 'Formato de alegato del estudio (opcional)',
        ejemplo: 'Alegato en caso de despido incausado, estructura y estilo del estudio.',
        obligatorio: false,
        minArchivos: 0,
      },
    ],
    contexto: [],
  },
]

// ─── Bloque 4 · Pre-litigio y gestión ────────────────────────────────────────

const bloque4: Skill[] = [
  {
    id: 'triage-consultas',
    nombre: 'Triage de Consultas',
    descripcion: 'Aplica los filtros de viabilidad y devuelve continuar / descartar / derivar.',
    bloque: 'Pre-litigio y gestión',
    modelos: [],
    contexto: [],
  },
  {
    id: 'jurisdiccion-competencia',
    nombre: 'Jurisdicción y Competencia',
    descripcion: 'Determina fuero y procedimiento según los puntos de conexión. Se activa principalmente en estudios multi-provincia.',
    bloque: 'Pre-litigio y gestión',
    modelos: [],
    contexto: [],
  },
  {
    id: 'respuesta-clientes',
    nombre: 'Respuesta a Clientes',
    descripcion: 'Redacta instrucciones de acción, actualizaciones de estado y rendición final para el cliente.',
    bloque: 'Pre-litigio y gestión',
    modelos: [
      {
        carpeta: 'respuestas-clientes',
        label: 'Plantillas de mensajes del estudio (opcional)',
        ejemplo: 'Mensaje de actualización de estado, instrucciones post-telegrama, rendición final de honorarios.',
        obligatorio: false,
        minArchivos: 0,
      },
    ],
    contexto: [],
  },
  {
    id: 'investigacion-juridica',
    nombre: 'Investigación Jurídica',
    descripcion: 'Responde doctrina, jurisprudencia y tasas sin inventar citas.',
    bloque: 'Pre-litigio y gestión',
    modelos: [],
    contexto: [],
  },
  {
    id: 'contrato-honorarios',
    nombre: 'Contrato de Honorarios',
    descripcion: 'Genera el contrato de honorarios y el pacto de cuota litis con los parámetros del estudio.',
    bloque: 'Pre-litigio y gestión',
    modelos: [
      {
        carpeta: 'honorarios',
        label: 'Contrato de honorarios y pacto de cuota litis',
        ejemplo: 'Contrato de honorarios vigente del estudio, pacto de cuota litis firmado.',
        obligatorio: true,
        minArchivos: 1,
      },
    ],
    contexto: [],
  },
]

const SKILL_ORDER: SkillId[] = [
  'triage-consultas',
  'contrato-honorarios',
  'respuesta-clientes',
  'telegrama-cd',
  'jurisdiccion-competencia',
  'liquidacion-rubros',
  'demanda-laboral',
  'escritos-tramite',
  'analisis-contestacion',
  'preparacion-testimonial',
  'impugnacion-pericial',
  'alegato',
  'investigacion-juridica',
]

const ALL_SKILLS = [...bloque1, ...bloque2, ...bloque3, ...bloque4]
export const SKILLS: Skill[] = SKILL_ORDER.map(id => ALL_SKILLS.find(s => s.id === id)!)

export const SKILL_MAP: Record<SkillId, Skill> = Object.fromEntries(
  SKILLS.map(s => [s.id, s])
) as Record<SkillId, Skill>

export function carpetasDeSkills(skillIds: SkillId[]): ModeloRequerido[] {
  const vistas = new Set<string>()
  const resultado: ModeloRequerido[] = []
  for (const id of skillIds) {
    const skill = SKILL_MAP[id]
    if (!skill) continue
    for (const modelo of skill.modelos) {
      if (!vistas.has(modelo.carpeta)) {
        vistas.add(modelo.carpeta)
        resultado.push(modelo)
      } else {
        const existente = resultado.find(r => r.carpeta === modelo.carpeta)!
        existente.obligatorio = existente.obligatorio || modelo.obligatorio
        existente.minArchivos = Math.max(existente.minArchivos, modelo.minArchivos)
      }
    }
  }
  return resultado
}
