// Schema declarativo del alta de estudio (9 instancias).
//
// TODO — sincronizar contra `formulario-alta-estudio.md` cuando llegue.
// Los campos actuales son un esqueleto representativo basado en el brief:
// cuando llegue el doc, reemplazar/completar sin tocar el renderer ni el context.

export type FieldType =
  | 'text'
  | 'textarea'
  | 'number'
  | 'boolean'      // sí / no
  | 'radio'        // opción única
  | 'multi'        // opción múltiple (checkboxes)
  | 'select'
  | 'repeatable'   // sub-formulario en lista
  | 'file'         // archivos locales; upload real cuando conectemos back

export interface Opcion {
  value: string
  label: string
}

// Context que se le pasa a showIf:
// - answers: todas las respuestas (por instanciaId → fieldId → valor)
// - localAnswers: respuestas del bloque actual (útil dentro de repeatables)
export interface EvalCtx {
  answers: Record<string, Record<string, unknown>>
  localAnswers: Record<string, unknown>
}

export interface FieldDef {
  id: string
  label: string
  tipo: FieldType
  ayuda?: string
  placeholder?: string
  obligatorio?: boolean
  opciones?: Opcion[]
  campos?: FieldDef[]           // solo repeatable
  minItems?: number             // solo repeatable
  itemLabel?: string            // "Abogado", "Jurisdicción", etc.
  accept?: string               // solo file
  multiple?: boolean            // solo file
  showIf?: (ctx: EvalCtx) => boolean
}

export interface InstanciaDef {
  id: string
  numero: number
  titulo: string
  descripcion: string
  campos: FieldDef[]
}

// ─── Instancias ───────────────────────────────────────────────────────────────

export const INSTANCIAS: InstanciaDef[] = [
  {
    id: 'datos-estudio',
    numero: 1,
    titulo: 'Datos del estudio',
    descripcion: 'Identidad del estudio y equipo de abogados.',
    campos: [
      { id: 'denominacion', label: 'Denominación del estudio', tipo: 'text', obligatorio: true },
      { id: 'domicilio',    label: 'Domicilio profesional',     tipo: 'text', obligatorio: true },
      { id: 'telefono',     label: 'Teléfono',                  tipo: 'text' },
      { id: 'email',        label: 'Email del estudio',         tipo: 'text', obligatorio: true },
      {
        id: 'abogados',
        label: 'Abogados del estudio',
        tipo: 'repeatable',
        itemLabel: 'Abogado',
        minItems: 1,
        obligatorio: true,
        campos: [
          { id: 'nombre',    label: 'Nombre completo',         tipo: 'text', obligatorio: true },
          { id: 'cuit',      label: 'CUIT',                    tipo: 'text', obligatorio: true },
          { id: 'matricula', label: 'Matrícula (T° / F°)',     tipo: 'text', obligatorio: true },
          { id: 'colegio',   label: 'Colegio / jurisdicción',  tipo: 'text', obligatorio: true },
        ],
      },
      {
        id: 'pieFirma',
        label: 'Pie de firma para escritos',
        tipo: 'textarea',
        ayuda: 'Cómo aparece al pie de cada presentación: nombre, matrícula, estudio, domicilio, contacto. Si se deja vacío, se arma automáticamente con los datos del abogado 1.',
      },
    ],
  },
  {
    id: 'jurisdiccion-alcance',
    numero: 2,
    titulo: 'Jurisdicción y alcance',
    descripcion: '¿En qué jurisdicciones trabaja el estudio? Configuración por cada una.',
    campos: [
      {
        id: 'jurisdicciones',
        label: 'Jurisdicciones en las que trabaja el estudio',
        tipo: 'repeatable',
        itemLabel: 'Jurisdicción',
        minItems: 1,
        obligatorio: true,
        campos: [
          {
            id: 'nombre',
            label: 'Nombre (jurisdicción / fuero / ley procesal)',
            tipo: 'text',
            obligatorio: true,
            placeholder: 'Nación / CABA, Provincia de Buenos Aires, Córdoba, ...',
          },
          {
            id: 'instanciaPrevia',
            label: '¿Requiere instancia prejudicial obligatoria antes de demandar?',
            tipo: 'radio',
            obligatorio: true,
            opciones: [
              { value: 'si',    label: 'Sí' },
              { value: 'no',    label: 'No' },
              { value: 'no-se', label: 'No sé' },
            ],
          },
          {
            id: 'organismo',
            label: '¿Ante qué organismo?',
            tipo: 'text',
            placeholder: 'SECLO, comisión de conciliación, etc.',
            showIf: ctx => ctx.localAnswers.instanciaPrevia === 'si',
          },
          {
            id: 'ofrecimientoPrueba',
            label: '¿Cómo se ofrece la prueba en esta jurisdicción?',
            tipo: 'radio',
            obligatorio: true,
            opciones: [
              { value: 'en-demanda',    label: 'En la demanda' },
              { value: 'acto-separado', label: 'Acto separado' },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'mapa-proceso',
    numero: 3,
    titulo: 'Mapa del proceso',
    descripcion: 'Qué etapas usás y particularidades de tu provincia.',
    campos: [
      {
        id: 'etapas',
        label: 'Etapas del proceso que usás',
        tipo: 'multi',
        opciones: [
          { value: 'primera-consulta',    label: 'Primera consulta y triage' },
          { value: 'intimacion',          label: 'Intimación por telegrama / CD' },
          { value: 'instancia-previa',    label: 'Instancia prejudicial' },
          { value: 'demanda',             label: 'Demanda' },
          { value: 'ofrecimiento-prueba', label: 'Ofrecimiento de prueba' },
          { value: 'produccion-prueba',   label: 'Producción de prueba' },
          { value: 'alegato',             label: 'Alegato' },
          { value: 'sentencia-recurso',   label: 'Sentencia y recursos' },
          { value: 'ejecucion',           label: 'Ejecución' },
        ],
      },
      {
        id: 'particularidades',
        label: '¿Algo distinto en tu provincia que quieras aclarar?',
        tipo: 'textarea',
        ayuda: 'Fuero, plazos, formas, prácticas locales — todo lo que no se ve en el manual.',
      },
    ],
  },
  {
    id: 'casos-que-toma',
    numero: 4,
    titulo: 'Qué casos toma el estudio',
    descripcion: 'Filtros de triage: qué entra, qué se deriva, qué se descarta.',
    campos: [
      {
        id: 'tipos',
        label: 'Tipos de caso que tomás',
        tipo: 'multi',
        opciones: [
          { value: 'despido',         label: 'Despido incausado / indirecto' },
          { value: 'diferencias',     label: 'Diferencias salariales' },
          { value: 'no-registrado',   label: 'Trabajo no registrado / mal registrado' },
          { value: 'accidente',       label: 'Accidentes / ART' },
          { value: 'acoso',           label: 'Hostigamiento / acoso' },
          { value: 'sindical',        label: 'Sindical / gremial' },
        ],
      },
      { id: 'antiguedadMinima', label: 'Antigüedad mínima (en meses) para tomar el caso', tipo: 'number' },
      { id: 'noToma',           label: '¿Qué NO tomás?', tipo: 'textarea' },
      { id: 'deriva',           label: 'Casos que derivás a colegas', tipo: 'textarea' },
    ],
  },
  {
    id: 'criterios-liquidacion',
    numero: 5,
    titulo: 'Criterios de liquidación',
    descripcion: 'Cómo calculás la indemnización.',
    campos: [
      {
        id: 'reparacionIntegral',
        label: '¿Pedís reparación integral?',
        tipo: 'boolean',
      },
      {
        id: 'inconstitucionalidades',
        label: 'Inconstitucionalidades que planteás habitualmente',
        tipo: 'multi',
        opciones: [
          { value: 'art245-tope', label: 'Art. 245 LCT (tope)' },
          { value: 'art4-tarifado', label: 'Art. 4 Ley 24.557 (tarifado ART)' },
          { value: 'otras',       label: 'Otras' },
        ],
      },
      {
        id: 'actualizacionArt',
        label: 'Actualización de deuda — tramo ART',
        tipo: 'text',
        ayuda: 'Régimen ART (Ley 26.773 / 27.348). Default sugerido: "RIPTE + interés (art. 17 inc. 6 Ley 26.773 / Ley 27.348 — doctrina «Espósito»)".',
        placeholder: 'RIPTE + interés (art. 17 inc. 6 Ley 26.773 / Ley 27.348 — doctrina «Espósito»)',
      },
      {
        id: 'actualizacionCreditosComunes',
        label: 'Actualización de deuda — créditos comunes',
        tipo: 'radio',
        ayuda: 'RIPTE se reserva al tramo ART; para créditos comunes lo estándar hoy, si el estudio adhiere a la Ley 27.802, es IPC+3%.',
        opciones: [
          { value: 'ley-27802-ipc',    label: 'Ley 27.802 — IPC (INDEC) + 3% anual (juicios nuevos) / art. 55: tasa pasiva BCRA con techo IPC+3% y piso 67% (juicios en trámite)' },
          { value: 'actas-cnat',       label: 'Actas CNAT (2764 / 2783 / 2658) según fecha' },
          { value: 'tasa-activa-bna',  label: 'Tasa activa Banco Nación' },
          { value: 'ascua',            label: 'Repotenciación / «Ascua» + tasa' },
          { value: 'otra',             label: 'Otra' },
        ],
      },
      {
        id: 'actualizacionCreditosComunesOtra',
        label: 'Especificá el criterio de actualización',
        tipo: 'textarea',
        showIf: ctx => ctx.localAnswers.actualizacionCreditosComunes === 'otra',
      },
      {
        id: 'fechaCalculo',
        label: '¿A qué fecha calculás?',
        tipo: 'radio',
        opciones: [
          { value: 'despido',    label: 'Fecha del despido' },
          { value: 'demanda',    label: 'Fecha de la demanda' },
          { value: 'sentencia',  label: 'Fecha estimada de sentencia' },
        ],
      },
    ],
  },
  {
    id: 'honorarios',
    numero: 6,
    titulo: 'Honorarios',
    descripcion: 'Cómo pactás los honorarios con el cliente.',
    campos: [
      {
        id: 'cuotaLitisPorcentaje',
        label: '% de cuota litis habitual',
        tipo: 'number',
        obligatorio: true,
        ayuda: 'Tope legal: art. 277 LCT.',
      },
      {
        id: 'tipoPacto',
        label: 'Tipo de pacto',
        tipo: 'radio',
        opciones: [
          { value: 'cuota-litis',  label: 'Cuota litis pura' },
          { value: 'anticipo',     label: 'Cuota litis + anticipo' },
          { value: 'hora',         label: 'Por hora' },
          { value: 'mixto',        label: 'Mixto' },
        ],
      },
      { id: 'condiciones', label: 'Condiciones y cláusulas particulares', tipo: 'textarea' },
      {
        id: 'ley27802',
        label: '¿Adherís al régimen de la Ley 27.802?',
        tipo: 'boolean',
        ayuda: 'Impacta en el criterio de actualización de créditos comunes (Instancia 5).',
      },
    ],
  },
  {
    id: 'estilo-doctrina',
    numero: 7,
    titulo: 'Estilo, doctrina y redacción',
    descripcion: 'Cómo escribís y qué doctrina considerás cabecera.',
    campos: [
      {
        id: 'fallos',
        label: 'Fallos de cabecera (uno por línea)',
        tipo: 'textarea',
        placeholder: 'Ej.: Vizzoti (tope art. 245) · Aquino (art. 39 LRT) · Álvarez c/ Cencosud (discriminación/reinstalación) · Arostegui (reparación integral)',
        ayuda: 'Se presentan como sugeridos editables, no como cita cerrada. La vigencia se verifica al momento de usarlos.',
      },
      {
        id: 'tono',
        label: 'Tono de redacción de escritos',
        tipo: 'radio',
        opciones: [
          { value: 'formal',       label: 'Formal / conservador' },
          { value: 'directo',      label: 'Directo / de choque' },
          { value: 'combativo',    label: 'Combativo' },
          { value: 'equilibrado',  label: 'Equilibrado' },
        ],
      },
      {
        id: 'armadoDemanda',
        label: '¿Cómo armás la demanda? (estructura, qué nunca falta)',
        tipo: 'textarea',
        ayuda: 'Estructura, orden de secciones, elementos que no pueden faltar.',
      },
    ],
  },
  {
    id: 'comunicacion-clientes',
    numero: 8,
    titulo: 'Comunicación con clientes',
    descripcion: 'Cómo hablás con tus clientes.',
    campos: [
      {
        id: 'tono',
        label: 'Tono con el cliente',
        tipo: 'radio',
        opciones: [
          { value: 'cercano',    label: 'Cercano / informal' },
          { value: 'profesional',label: 'Profesional / neutro' },
          { value: 'tecnico',    label: 'Técnico / detallado' },
        ],
      },
      { id: 'plantillas', label: 'Plantillas propias (frases, aperturas, cierres)', tipo: 'textarea' },
    ],
  },
  {
    id: 'modelos-plantillas',
    numero: 9,
    titulo: 'Modelos y plantillas',
    descripcion: 'Subí los modelos que tenés. Todo es opcional — podés completar más tarde.',
    campos: [
      { id: 'telegramas',    label: 'Telegramas / cartas documento', tipo: 'file', accept: '.docx,.pdf,.doc,.txt', multiple: true },
      { id: 'demandas',      label: 'Demandas',                      tipo: 'file', accept: '.docx,.pdf,.doc,.txt', multiple: true },
      { id: 'escritos',      label: 'Escritos de trámite / prueba / recursos / alegato', tipo: 'file', accept: '.docx,.pdf,.doc,.txt', multiple: true },
      { id: 'impugnaciones', label: 'Impugnaciones periciales',      tipo: 'file', accept: '.docx,.pdf,.doc,.txt', multiple: true },
      { id: 'honorarios',    label: 'Contrato de honorarios / cuota litis', tipo: 'file', accept: '.docx,.pdf,.doc,.txt', multiple: true },
      { id: 'comunicaciones',label: 'Plantillas de comunicación con clientes', tipo: 'file', accept: '.docx,.pdf,.doc,.txt', multiple: true },
      {
        id: 'escalasCct',
        label: 'Escalas de CCT (si manejás alguna)',
        tipo: 'file',
        accept: '.pdf,.xls,.xlsx,.csv',
        multiple: true,
        ayuda: 'Escalas salariales del/los CCT que maneja el estudio. Las skills de liquidación y diferencias salariales las leen desde acá.',
      },
    ],
  },
]

export const INSTANCIA_MAP: Record<string, InstanciaDef> = Object.fromEntries(
  INSTANCIAS.map(i => [i.id, i])
)

// Mapeo de campos de la instancia 9 → carpeta canónica en Storage.
// Es la fuente de verdad para el manifiesto de carpetas del estudio.
export const CARPETAS_MODELOS: { fieldId: string; carpeta: string }[] = [
  { fieldId: 'telegramas',     carpeta: 'modelos/telegramas' },
  { fieldId: 'demandas',       carpeta: 'modelos/demandas' },
  { fieldId: 'escritos',       carpeta: 'modelos/escritos' },
  { fieldId: 'impugnaciones',  carpeta: 'modelos/impugnaciones' },
  { fieldId: 'honorarios',     carpeta: 'modelos/honorarios' },
  { fieldId: 'comunicaciones', carpeta: 'modelos/comunicaciones' },
  { fieldId: 'escalasCct',     carpeta: 'datos/escalas-cct' },
]
