export type SkillId =
  | 'ficha-primera-consulta'
  | 'triage-consultas'
  | 'jurisdiccion-competencia'
  | 'instancia-prejudicial'
  | 'estrategia-caso'
  | 'contrato-honorarios'
  | 'telegrama-cd'
  | 'liquidacion-rubros'
  | 'investigacion-juridica'
  | 'plazos-procesales'
  | 'demanda-laboral'
  | 'nomina-documental'
  | 'ofrecimiento-prueba'
  | 'escritos-tramite'
  | 'analisis-contestacion'
  | 'impugnacion-pericial'
  | 'preparacion-testimonial'
  | 'alegato'
  | 'recurso-apelacion'
  | 'respuesta-clientes'
  | 'anonimizador'

export type EtapaId =
  | 'antes-caso'
  | 'intimacion'
  | 'demanda-tramite'
  | 'prueba-cierre'
  | 'transversal'

export interface Etapa {
  id: EtapaId
  nombre: string
  descripcion: string
}

export const ETAPAS: Etapa[] = [
  { id: 'antes-caso',       nombre: 'Antes de tomar el caso', descripcion: 'Primer contacto, viabilidad y encuadre del caso.' },
  { id: 'intimacion',       nombre: 'Intimación y armado',    descripcion: 'Reclamos previos, cálculos y preparación del expediente.' },
  { id: 'demanda-tramite',  nombre: 'Demanda y trámite',      descripcion: 'Escrito de inicio, prueba y trámite procesal.' },
  { id: 'prueba-cierre',    nombre: 'Prueba y cierre',        descripcion: 'Producción de prueba, alegato y recursos.' },
  { id: 'transversal',      nombre: 'Transversales',          descripcion: 'Skills que se usan en cualquier momento del proceso.' },
]

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
  etapa: EtapaId
  modelos: ModeloRequerido[]
  contexto: CampoContexto[]
}

// Carpetas compartidas — declaradas una vez para que el renombre sea local.
const CARPETA_ESCRITOS: ModeloRequerido = {
  carpeta: 'escritos',
  label: 'Escritos procesales del estudio',
  ejemplo: 'Poder, pacto de cuota litis, apertura a prueba, ofrecimiento de prueba, alegato, recursos.',
  obligatorio: true,
  minArchivos: 1,
}

// ─── Antes de tomar el caso ───────────────────────────────────────────────────

const antesCaso: Skill[] = [
  {
    id: 'ficha-primera-consulta',
    nombre: 'Ficha de Primera Consulta',
    descripcion: 'Estructura la entrevista inicial con el cliente y arma la ficha con los datos que después alimentan al resto de las skills.',
    etapa: 'antes-caso',
    modelos: [],
    contexto: [],
  },
  {
    id: 'triage-consultas',
    nombre: 'Triage de Consultas',
    descripcion: 'Aplica los filtros de viabilidad del estudio y devuelve continuar / descartar / derivar.',
    etapa: 'antes-caso',
    modelos: [],
    contexto: [],
  },
  {
    id: 'jurisdiccion-competencia',
    nombre: 'Jurisdicción y Competencia',
    descripcion: 'Determina fuero y procedimiento según los puntos de conexión. Clave en estudios multi-provincia.',
    etapa: 'antes-caso',
    modelos: [],
    contexto: [],
  },
  {
    id: 'instancia-prejudicial',
    nombre: 'Instancia Prejudicial',
    descripcion: 'Prepara los actos previos exigidos según la jurisdicción (SECLO, conciliación obligatoria, etc.) antes de habilitar la vía judicial.',
    etapa: 'antes-caso',
    modelos: [],
    contexto: [],
  },
  {
    id: 'estrategia-caso',
    nombre: 'Estrategia de Caso',
    descripcion: 'Arma la hoja de ruta del caso: hipótesis, prueba disponible, riesgos y línea de acción recomendada.',
    etapa: 'antes-caso',
    modelos: [],
    contexto: [],
  },
  {
    id: 'contrato-honorarios',
    nombre: 'Contrato de Honorarios',
    descripcion: 'Genera el contrato de honorarios y el pacto de cuota litis con los parámetros del estudio.',
    etapa: 'antes-caso',
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

// ─── Intimación y armado ──────────────────────────────────────────────────────

const intimacion: Skill[] = [
  {
    id: 'telegrama-cd',
    nombre: 'Telegrama / Carta Documento',
    descripcion: 'Redacta todas las intimaciones laborales: registración, sub-registración, hostigamiento, diferencias, art. 80, despido indirecto y réplicas.',
    etapa: 'intimacion',
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
    id: 'liquidacion-rubros',
    nombre: 'Liquidación de Rubros',
    descripcion: 'Calcula la indemnización en modo preliminar, para demanda o actualizada. El motor de cálculo viene incluido.',
    etapa: 'intimacion',
    modelos: [],
    contexto: [],
  },
  {
    id: 'investigacion-juridica',
    nombre: 'Investigación Jurídica',
    descripcion: 'Responde doctrina, jurisprudencia y tasas sin inventar citas.',
    etapa: 'intimacion',
    modelos: [],
    contexto: [],
  },
  {
    id: 'plazos-procesales',
    nombre: 'Plazos Procesales',
    descripcion: 'Calcula vencimientos según la jurisdicción, contando días hábiles judiciales y feria.',
    etapa: 'intimacion',
    modelos: [],
    contexto: [],
  },
]

// ─── Demanda y trámite ────────────────────────────────────────────────────────

const demandaTramite: Skill[] = [
  {
    id: 'demanda-laboral',
    nombre: 'Demanda Laboral',
    descripcion: 'Genera el escrito de inicio en sus variantes, con la liquidación completa donde la jurisdicción lo exige.',
    etapa: 'demanda-tramite',
    modelos: [
      {
        carpeta: 'demandas',
        label: 'Demandas reales por tipo de caso',
        ejemplo: 'Demanda por despido incausado, diferencias salariales, accidente de trabajo.',
        obligatorio: true,
        minArchivos: 1,
      },
    ],
    contexto: [],
  },
  {
    id: 'nomina-documental',
    nombre: 'Nómina Documental',
    descripcion: 'Arma la lista de documentos a acompañar con la demanda según el tipo de caso y la jurisdicción.',
    etapa: 'demanda-tramite',
    modelos: [],
    contexto: [],
  },
  {
    id: 'ofrecimiento-prueba',
    nombre: 'Ofrecimiento de Prueba',
    descripcion: 'Redacta el ofrecimiento de prueba (incluido en la demanda o como acto separado, según la jurisdicción).',
    etapa: 'demanda-tramite',
    modelos: [CARPETA_ESCRITOS],
    contexto: [],
  },
  {
    id: 'escritos-tramite',
    nombre: 'Escritos de Trámite',
    descripcion: 'Toda la papelería procesal: poder, cuota litis, segundo traslado, cédulas, oficios, acuerdos y ejecución.',
    etapa: 'demanda-tramite',
    modelos: [CARPETA_ESCRITOS],
    contexto: [],
  },
  {
    id: 'analisis-contestacion',
    nombre: 'Análisis de Contestación',
    descripcion: 'Cruza la contestación del empleador contra el expediente y marca los puntos débiles de la contraria.',
    etapa: 'demanda-tramite',
    modelos: [],
    contexto: [],
  },
]

// ─── Prueba y cierre ──────────────────────────────────────────────────────────

const pruebaCierre: Skill[] = [
  {
    id: 'impugnacion-pericial',
    nombre: 'Impugnación Pericial',
    descripcion: 'Redacta la impugnación a la pericia desfavorable (típico: diferencias salariales).',
    etapa: 'prueba-cierre',
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
    id: 'preparacion-testimonial',
    nombre: 'Preparación Testimonial',
    descripcion: 'Arma el punteo de qué debe reforzar cada testigo según las debilidades del caso.',
    etapa: 'prueba-cierre',
    modelos: [],
    contexto: [],
  },
  {
    id: 'alegato',
    nombre: 'Alegato',
    descripcion: 'Sintetiza la prueba producida y arma el alegato orientado al pedido de sentencia.',
    etapa: 'prueba-cierre',
    modelos: [
      {
        ...CARPETA_ESCRITOS,
        label: 'Formato de alegato del estudio (opcional)',
        ejemplo: 'Alegato en caso de despido incausado, estructura y estilo del estudio.',
        obligatorio: false,
        minArchivos: 0,
      },
    ],
    contexto: [],
  },
  {
    id: 'recurso-apelacion',
    nombre: 'Recurso de Apelación',
    descripcion: 'Redacta el recurso de apelación y la expresión de agravios contra la sentencia.',
    etapa: 'prueba-cierre',
    modelos: [CARPETA_ESCRITOS],
    contexto: [],
  },
]

// ─── Transversales ────────────────────────────────────────────────────────────

const transversales: Skill[] = [
  {
    id: 'respuesta-clientes',
    nombre: 'Respuesta a Clientes',
    descripcion: 'Redacta instrucciones de acción, actualizaciones de estado y rendición final para el cliente.',
    etapa: 'transversal',
    modelos: [
      {
        carpeta: 'comunicaciones',
        label: 'Plantillas de mensajes del estudio (opcional)',
        ejemplo: 'Mensaje de actualización de estado, instrucciones post-telegrama, rendición final de honorarios.',
        obligatorio: false,
        minArchivos: 0,
      },
    ],
    contexto: [],
  },
  {
    id: 'anonimizador',
    nombre: 'Anonimizador de Documentos',
    descripcion: 'Reemplaza datos personales por placeholders para poder compartir escritos y prueba sin exponer al cliente.',
    etapa: 'transversal',
    modelos: [],
    contexto: [],
  },
]

const SKILL_ORDER: SkillId[] = [
  // Antes de tomar el caso
  'ficha-primera-consulta',
  'triage-consultas',
  'jurisdiccion-competencia',
  'instancia-prejudicial',
  'estrategia-caso',
  'contrato-honorarios',
  // Intimación y armado
  'telegrama-cd',
  'liquidacion-rubros',
  'investigacion-juridica',
  'plazos-procesales',
  // Demanda y trámite
  'demanda-laboral',
  'nomina-documental',
  'ofrecimiento-prueba',
  'escritos-tramite',
  'analisis-contestacion',
  // Prueba y cierre
  'impugnacion-pericial',
  'preparacion-testimonial',
  'alegato',
  'recurso-apelacion',
  // Transversales
  'respuesta-clientes',
  'anonimizador',
]

const ALL_SKILLS = [...antesCaso, ...intimacion, ...demandaTramite, ...pruebaCierre, ...transversales]
export const SKILLS: Skill[] = SKILL_ORDER.map(id => ALL_SKILLS.find(s => s.id === id)!)

export const SKILL_MAP: Record<SkillId, Skill> = Object.fromEntries(
  SKILLS.map(s => [s.id, s])
) as Record<SkillId, Skill>

export function skillsPorEtapa(etapa: EtapaId): Skill[] {
  return SKILLS.filter(s => s.etapa === etapa)
}

export function carpetasDeSkills(skillIds: SkillId[]): ModeloRequerido[] {
  const vistas = new Set<string>()
  const resultado: ModeloRequerido[] = []
  for (const id of skillIds) {
    const skill = SKILL_MAP[id]
    if (!skill) continue
    for (const modelo of skill.modelos) {
      if (!vistas.has(modelo.carpeta)) {
        vistas.add(modelo.carpeta)
        resultado.push({ ...modelo })
      } else {
        const existente = resultado.find(r => r.carpeta === modelo.carpeta)!
        existente.obligatorio = existente.obligatorio || modelo.obligatorio
        existente.minArchivos = Math.max(existente.minArchivos, modelo.minArchivos)
      }
    }
  }
  return resultado
}
