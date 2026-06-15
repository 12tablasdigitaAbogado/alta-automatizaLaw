export type SkillId =
  | 'alta-caso'
  | 'telegrama-cd'
  | 'liquidacion'
  | 'demanda-laboral'
  | 'respuesta-telegrama'

export interface ModeloRequerido {
  carpeta: string
  label: string
  ejemplo: string
  obligatorio: boolean
  minArchivos: number
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
  modelos: ModeloRequerido[]
  contexto: CampoContexto[]
}

export const SKILLS: Skill[] = [
  {
    id: 'alta-caso',
    nombre: 'Alta de caso laboral',
    descripcion: 'Redacta el encuadre inicial, convenio de honorarios y autorización del cliente.',
    modelos: [
      {
        carpeta: 'intake',
        label: 'Documentos de apertura de caso',
        ejemplo: 'Convenio de cuota litis, poder/autorización del cliente, ficha de consulta inicial.',
        obligatorio: true,
        minArchivos: 1,
      },
    ],
    contexto: [
      {
        id: 'cuota_litis_pct',
        label: '% habitual de cuota litis',
        tipo: 'text',
        obligatorio: true,
        ayuda: 'Ej: 20% del monto obtenido en juicio.',
      },
      {
        id: 'datos_consulta',
        label: 'Datos que relevás en la consulta inicial',
        tipo: 'textarea',
        obligatorio: false,
        ayuda: 'Campos o preguntas estándar que hacés al cliente en la primera entrevista.',
      },
    ],
  },
  {
    id: 'telegrama-cd',
    nombre: 'Telegrama / carta documento laboral',
    descripcion: 'Redacta intimaciones laborales, autodespidos y comunicaciones formales al empleador.',
    modelos: [
      {
        carpeta: 'telegramas',
        label: 'Modelos de telegramas y cartas documento',
        ejemplo: 'Intimación art. 11 ley 24.013, intimación pago de haberes, autodespido art. 246, rechazo de telegramas del empleador.',
        obligatorio: true,
        minArchivos: 1,
      },
    ],
    contexto: [
      {
        id: 'formulas_telegrama',
        label: 'Fórmulas habituales del estudio',
        tipo: 'textarea',
        obligatorio: false,
        ayuda: 'Frases o cláusulas de estilo que usás en tus telegramas.',
      },
      {
        id: 'plazo_intimacion',
        label: 'Plazo de intimación estándar',
        tipo: 'text',
        obligatorio: false,
        ayuda: 'Ej: 48 horas para telegramas Correo Argentino, 2 días hábiles.',
      },
      {
        id: 'formato_envio',
        label: 'Formato de envío',
        tipo: 'select',
        opciones: ['Correo Argentino (ley 23.789)', 'Carta documento', 'Ambos'],
        obligatorio: false,
        ayuda: 'Medio habitual de envío de comunicaciones formales.',
      },
    ],
  },
  {
    id: 'liquidacion',
    nombre: 'Liquidación indemnizatoria',
    descripcion: 'Calcula y redacta liquidaciones finales, rubros indemnizatorios y planillas de despido.',
    modelos: [
      {
        carpeta: 'liquidaciones',
        label: 'Planillas de cálculo y modelos de liquidación',
        ejemplo: 'Planilla de liquidación final, tabla de multas ley 24.013/25.323, modelo de liquidación art. 245.',
        obligatorio: true,
        minArchivos: 1,
      },
    ],
    contexto: [
      {
        id: 'rubros_liquidacion',
        label: 'Rubros que liquidás habitualmente',
        tipo: 'textarea',
        obligatorio: true,
        ayuda: 'Ej: indemnización art. 245, preaviso, integración mes, vacaciones proporcionales, SAC proporcional.',
      },
      {
        id: 'multas_aplicables',
        label: 'Multas que aplicás',
        tipo: 'textarea',
        obligatorio: false,
        ayuda: 'Ej: art. 8, 9, 10 ley 24.013; art. 1 y 2 ley 25.323; art. 80 LCT.',
      },
      {
        id: 'tope_vizzoti',
        label: 'Criterio para tope art. 245 (Vizzoti)',
        tipo: 'text',
        obligatorio: false,
        ayuda: 'Ej: aplicar 67% del salario real cuando supera el tope RIPTE.',
      },
      {
        id: 'tasa_interes',
        label: 'Tasa de interés aplicable',
        tipo: 'text',
        obligatorio: true,
        ayuda: 'Ej: tasa activa BNA, acta CNAT 2601 o 2764 según jurisdicción.',
      },
    ],
  },
  {
    id: 'demanda-laboral',
    nombre: 'Demanda laboral',
    descripcion: 'Redacta escritos de demanda, ofrecimiento de prueba y recursos judiciales.',
    modelos: [
      {
        carpeta: 'demandas',
        label: 'Modelos de demanda',
        ejemplo: 'Demanda por despido incausado, demanda por diferencias salariales, demanda accidente/ART ley 27.348, ofrecimiento de prueba.',
        obligatorio: true,
        minArchivos: 1,
      },
    ],
    contexto: [
      {
        id: 'fuero_procedimiento',
        label: 'Fuero, jurisdicción y procedimiento',
        tipo: 'text',
        obligatorio: true,
        ayuda: 'Ej: Fuero Laboral CABA — CNAT — procedimiento oral ley 18.345.',
      },
      {
        id: 'tribunal',
        label: 'Tribunal habitual',
        tipo: 'text',
        obligatorio: false,
        ayuda: 'Ej: CNAT Sala I, Juzgado Nacional de 1ª Instancia del Trabajo nº 42.',
      },
      {
        id: 'estilo_demanda',
        label: 'Estilo de redacción para demandas',
        tipo: 'textarea',
        obligatorio: false,
        ayuda: 'Tono, estructura y particularidades de estilo que usás en los escritos.',
      },
      {
        id: 'fallos_cabecera',
        label: 'Fallos de cabecera / doctrina que citás',
        tipo: 'textarea',
        obligatorio: false,
        ayuda: 'Fallos o doctrina que citás habitualmente (CSJN, CNAT, salas preferidas).',
      },
    ],
  },
  {
    id: 'respuesta-telegrama',
    nombre: 'Respuesta a telegramas del empleador',
    descripcion: 'Redacta respuestas a despidos con causa, abandonos y misivas típicas del empleador.',
    modelos: [
      {
        carpeta: 'telegramas',
        label: 'Modelos de respuesta a telegramas',
        ejemplo: 'Respuesta a despido con causa, rechazo abandono art. 244, contestación de injuria, respuesta a intimaciones del empleador.',
        obligatorio: true,
        minArchivos: 1,
      },
    ],
    contexto: [
      {
        id: 'estrategia_misivas',
        label: 'Estrategia frente a misivas típicas del empleador',
        tipo: 'textarea',
        obligatorio: false,
        ayuda: 'Criterios para responder despidos con causa, abandonos, reducciones de jornada, etc.',
      },
      {
        id: 'plazo_respuesta',
        label: 'Plazo de respuesta estándar',
        tipo: 'text',
        obligatorio: false,
        ayuda: 'Ej: 48 horas para despidos con causa, 24 horas para abandonos.',
      },
    ],
  },
]

export const SKILL_MAP: Record<SkillId, Skill> = Object.fromEntries(
  SKILLS.map(s => [s.id, s])
) as Record<SkillId, Skill>

/** Devuelve las carpetas únicas requeridas por las skills activas */
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
        // Si ya existe la carpeta, fusionar obligatorio (OR) y minArchivos (MAX)
        const existente = resultado.find(r => r.carpeta === modelo.carpeta)!
        existente.obligatorio = existente.obligatorio || modelo.obligatorio
        existente.minArchivos = Math.max(existente.minArchivos, modelo.minArchivos)
      }
    }
  }
  return resultado
}

/** Devuelve los campos de contexto únicos (deduplicados por id) de las skills activas */
export function camposContextoDeSkills(skillIds: SkillId[]): CampoContexto[] {
  const vistos = new Set<string>()
  const resultado: CampoContexto[] = []
  for (const id of skillIds) {
    const skill = SKILL_MAP[id]
    if (!skill) continue
    for (const campo of skill.contexto) {
      if (!vistos.has(campo.id)) {
        vistos.add(campo.id)
        resultado.push(campo)
      }
    }
  }
  return resultado
}
