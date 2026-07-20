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
  | 'section'      // encabezado de grupo (no input)

export interface Opcion {
  value: string
  label: string
  recomendado?: boolean
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
  maxItems?: number             // solo file multiple: cap de archivos
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
      {
        id: 'denominacion',
        label: 'Nombre del estudio',
        tipo: 'text',
        obligatorio: true,
        ayuda: 'O denominación comercial.',
        placeholder: 'Estudio Sandrone & Asociados',
      },
      {
        id: 'domicilio',
        label: 'Domicilio real del estudio',
        tipo: 'text',
        obligatorio: true,
      },
      {
        id: 'domicilioConstituido',
        label: 'Domicilio constituido, si es distinto del real',
        tipo: 'text',
        ayuda: 'Es el domicilio legal donde se reciben notificaciones si no coincide con la oficina física. Dejar en blanco si es el mismo.',
      },
      {
        id: 'telefonoFijo',
        label: 'Teléfono fijo',
        tipo: 'text',
      },
      {
        id: 'telefonoCelular',
        label: 'Teléfono celular',
        tipo: 'text',
        obligatorio: true,
        ayuda: 'Prefijo sin 0 y número sin 15.',
      },
      {
        id: 'email',
        label: 'Email de contacto',
        tipo: 'text',
        obligatorio: true,
      },
      {
        id: 'cantidadAbogados',
        label: '¿Cuántos abogados firman escritos en el estudio?',
        tipo: 'number',
        obligatorio: true,
      },
      {
        id: 'abogados',
        label: 'Para cada abogado',
        tipo: 'repeatable',
        itemLabel: 'Abogado',
        minItems: 1,
        obligatorio: true,
        campos: [
          { id: 'nombre',    label: 'Nombre completo',         tipo: 'text', obligatorio: true },
          { id: 'cuit',      label: 'CUIT',                    tipo: 'text', obligatorio: true },
          {
            id: 'matricula',
            label: 'Matrícula (tomo y folio)',
            tipo: 'text',
            obligatorio: true,
            placeholder: 'Tomo 45, Folio 123',
          },
          {
            id: 'colegio',
            label: 'Colegio de Abogados',
            tipo: 'text',
            obligatorio: true,
            placeholder: 'Colegio de Abogados de Córdoba',
          },
        ],
      },
      {
        id: 'pieFirma',
        label: 'Pie de firma habitual que usan en los escritos',
        tipo: 'textarea',
        obligatorio: true,
        ayuda: 'Escribí o aclará en qué orden aparece la información cuando firmás los escritos.',
        placeholder: 'Dra. Victoria Sandrone — Abogada — T° 45 F° 123 C.A.C.',
      },
    ],
  },
  {
    id: 'jurisdiccion-alcance',
    numero: 2,
    titulo: 'Jurisdicción y alcance geográfico',
    descripcion: '¿En qué jurisdicciones trabaja el estudio? Configuración por cada una.',
    campos: [
      {
        id: 'jurisdicciones',
        label: '¿En qué jurisdicción(es) opera el estudio?',
        ayuda: 'Escribí cada una tal como la reconocerías vos. Si operan en más de una, agregalas todas.',
        tipo: 'repeatable',
        itemLabel: 'Jurisdicción',
        minItems: 1,
        obligatorio: true,
        campos: [
          {
            id: 'nombre',
            label: 'Nombre de la jurisdicción',
            tipo: 'text',
            obligatorio: true,
            placeholder: 'Córdoba Capital · Provincia de Buenos Aires - Departamento Judicial La Plata · Nación/CABA',
          },
          {
            id: 'instanciaPrevia',
            label: '¿Existe una instancia de conciliación obligatoria antes de poder demandar?',
            tipo: 'textarea',
            obligatorio: true,
            ayuda: 'Ej.: en Nación/CABA la respuesta sería "sí, ante el SECLO"; en Provincia de Buenos Aires o Córdoba, "no". Si no lo saben, aclárenlo así queda marcado como pendiente de confirmar en vez de asumir cualquiera de las dos opciones.',
            placeholder: 'Sí, ante el SECLO · No · No lo sé todavía',
          },
          {
            id: 'presentacionElectronica',
            label: '¿El fuero de cada jurisdicción usa un sistema de presentación electrónica particular que el estudio ya conozca?',
            tipo: 'text',
            ayuda: 'Si no lo saben, se puede dejar en blanco.',
            placeholder: 'Ej.: MEV en Provincia de Buenos Aires · Portal del Poder Judicial de la Nación en Nación/CABA',
          },
          {
            id: 'ofrecimientoPrueba',
            label: 'El ofrecimiento de prueba de la parte actora, ¿va incluido en la demanda, o es un acto procesal separado y posterior (por ejemplo, después de la audiencia de conciliación)?',
            tipo: 'textarea',
            obligatorio: true,
            ayuda: 'Ej.: en Nación/CABA y Provincia de Buenos Aires va incluido en la demanda; en Córdoba depende del procedimiento: en el PDA va incluido, en el ordinario es un acto separado (art. 52 Ley 7987). Si no lo saben, aclárenlo así queda pendiente de confirmar en vez de asumir cualquiera de las dos.',
            placeholder: 'Incluido en la demanda · Acto separado posterior · No lo sé todavía',
          },
        ],
      },
      {
        id: 'reglasCompetencia',
        label: '¿Hay alguna regla de competencia o procedimiento propia que el estudio ya conozca y quiera que se aplique?',
        tipo: 'textarea',
        obligatorio: true,
        ayuda: 'Si no completan, la skill de Jurisdicción y Competencia trabaja solo con los puntos de conexión del caso.',
        placeholder: 'Ej.: en Córdoba, si el trabajador vive en el interior de la provincia, preferimos litigar en la sede más cercana a su domicilio aunque el empleador esté en la Capital.',
        showIf: ctx => Array.isArray(ctx.localAnswers.jurisdicciones) && (ctx.localAnswers.jurisdicciones as unknown[]).length > 1,
      },
      {
        id: 'criterioConveniencia',
        label: '¿Hay algún criterio de conveniencia propio para elegir entre jurisdicciones habilitadas para un mismo caso?',
        tipo: 'textarea',
        ayuda: 'Si no tienen un criterio armado, se puede dejar en blanco.',
        placeholder: 'Ej.: si el caso habilita tanto Nación como Provincia, preferimos siempre Nación porque los tiempos de resolución suelen ser más rápidos. O: evitamos tal juzgado en particular por demoras conocidas.',
        showIf: ctx => Array.isArray(ctx.localAnswers.jurisdicciones) && (ctx.localAnswers.jurisdicciones as unknown[]).length > 1,
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
        obligatorio: true,
        opciones: [
          { value: 'firma-pacto-honorarios',        label: 'Firma de un pacto de honorarios o cuota litis con el cliente antes de iniciar acciones.' },
          { value: 'intimacion-previa',             label: 'Intimación previa por telegrama o carta documento antes de demandar.' },
          { value: 'instancia-conciliacion-previa', label: 'Instancia de conciliación obligatoria antes de poder demandar (ej: el SECLO en Nación/CABA). (ya la confirmaste en la Instancia 2 — se repite acá para que el mapa quede completo en un solo lugar)' },
          { value: 'presentacion-demanda',          label: 'Presentación de la demanda.' },
          { value: 'audiencia-conciliacion-juicio', label: 'Audiencia de conciliación una vez iniciada la demanda (distinta de la instancia previa del punto 3 — esta es dentro del expediente judicial).' },
          { value: 'traslado-contestacion',         label: 'Traslado de la demanda y contestación por parte del empleador.' },
          { value: 'replica-segundo-traslado',      label: 'Réplica o segundo traslado después de la contestación.' },
          { value: 'ofrecimiento-prueba-separado',  label: 'Ofrecimiento de prueba como acto procesal separado de la demanda (no incluido en el escrito de inicio). (ya la confirmaste en la Instancia 2)' },
          { value: 'apertura-prueba',               label: 'Apertura formal a prueba / período probatorio.' },
          { value: 'produccion-prueba',             label: 'Producción de prueba (documental, testimonial, pericial, confesional, informativa) como etapa con su propio trámite.' },
          { value: 'audiencia-vista-causa',         label: 'Audiencia de vista de causa, o audiencia única, de forma oral.' },
          { value: 'alegato',                       label: 'Alegato al cierre de la prueba.' },
          { value: 'sentencia-primera-instancia',   label: 'Sentencia de primera instancia.' },
          { value: 'recurso-apelacion',             label: 'Recurso de apelación ante una Cámara si la sentencia es adversa.' },
          { value: 'ejecucion-sentencia',           label: 'Ejecución de sentencia si el empleador no paga voluntariamente.' },
          { value: 'acuerdo-conciliatorio',         label: 'Posibilidad de acuerdo conciliatorio en cualquier momento del proceso (extrajudicial, homologado directamente, o durante el trámite).' },
        ],
      },
      {
        id: 'particularidades',
        label: '¿Hay alguna etapa propia de tu provincia que no esté en esta lista, o que funcione distinto a como la describimos?',
        tipo: 'textarea',
        obligatorio: true,
        ayuda: 'Contanos qué es y en qué momento del proceso ocurre. Esto nos ayuda a detectar si necesitamos ajustar o crear algo nuevo para tu jurisdicción.',
      },
    ],
  },
  {
    id: 'casos-que-toma',
    numero: 4,
    titulo: 'Qué casos toma el estudio',
    descripcion: 'Estos son los filtros que usa la skill de Triage laboral despidos (análisis de viabilidad de cliente) antes de decir si conviene tomar una consulta o no según tus criterios.',
    campos: [
      {
        id: 'sectores',
        label: '¿Atienden trabajadores del sector privado, del sector público, o ambos?',
        tipo: 'multi',
        obligatorio: true,
        opciones: [
          { value: 'privado', label: 'Sector privado' },
          { value: 'publico', label: 'Sector público' },
        ],
      },
      {
        id: 'sectoresNoAtender',
        label: '¿Hay alguna actividad o sector que el estudio prefiera NO atender?',
        tipo: 'textarea',
        obligatorio: true,
        placeholder: 'Ej.: no tomamos casos de trabajo rural ni de servicio doméstico.',
      },
      {
        id: 'antiguedadMinima',
        label: '¿Tienen un piso de antigüedad mínima en el empleo para tomar un caso?',
        tipo: 'text',
        ayuda: 'Esto es cuánto tiempo trabajó la persona para ese empleador, NO cuánto tiempo pasó desde el despido (eso es la prescripción, que es un límite legal de 2 años y no depende del criterio del estudio). Ejemplo: si ponen "3 meses", no tomarían el caso de alguien que trabajó solo 2 meses, aunque el despido haya sido ayer. Dejar en blanco si no tienen un piso.',
      },
      {
        id: 'pisoMontoReclamo',
        label: '¿Tienen un piso de monto de reclamo estimado para que valga la pena tomar el caso?',
        tipo: 'number',
        ayuda: 'Ej.: "no tomamos casos con un reclamo estimado menor a $500.000". Dejar en blanco si no tienen piso.',
        placeholder: 'Monto en pesos',
      },
      {
        id: 'consultoOtroAbogado',
        label: '¿Toman casos donde el trabajador ya consultó o inició gestiones con otro abogado?',
        tipo: 'textarea',
        obligatorio: true,
        ayuda: 'Ej.: "sí, si ya no tiene relación con el abogado anterior" o "no, salvo que nos lo derive el colega directamente".',
        placeholder: 'Sí · No · Depende',
      },
      {
        id: 'otroCriterio',
        label: '¿Algún otro criterio propio para descartar una consulta que no esté cubierto arriba?',
        tipo: 'textarea',
      },
    ],
  },
  {
    id: 'criterios-liquidacion',
    numero: 5,
    titulo: 'Criterios de liquidación',
    descripcion: 'La skill de liquidación se ejecuta en 3 oportunidades: 1) preliminar cuando viene el cliente y queremos hacer un cálculo, 2) en la demanda para poner la liquidación y 3) en la ejecución de la sentencia para actualizarla. Para que la respuesta que da se acomode a tu forma de calcular, necesitamos estos datos.',
    campos: [
      {
        id: 'reparacionIntegral',
        label: 'Ante la derogación de las multas de las leyes 24.013 y 25.323 y del art. 80 LCT (vigente desde 2024): ¿el estudio reclama por reparación integral en su lugar?',
        tipo: 'textarea',
        obligatorio: true,
        ayuda: 'Si depende del caso, explicá en qué situaciones.',
        placeholder: 'Sí · No · Depende del caso (explicar)',
      },
      {
        id: 'reparacionIntegralCriterio',
        label: 'Si reclaman reparación integral: ¿tienen un criterio propio para estimar el monto, o lo define el abogado caso por caso?',
        tipo: 'textarea',
        ayuda: 'Si lo deciden caso por caso sin una regla fija, se puede dejar en blanco.',
        placeholder: 'Ej.: calculamos un adicional equivalente a 6 meses de sueldo · Lo dejamos a criterio del abogado según la jurisprudencia de la zona en ese momento.',
      },
      {
        id: 'inconstitucionalidadDerogaciones',
        label: '¿Plantean la inconstitucionalidad de esas derogaciones como reclamo subsidiario?',
        tipo: 'textarea',
        obligatorio: true,
        ayuda: 'Si depende del caso, explicá en qué situaciones.',
        placeholder: 'Sí · No · Depende del caso (explicar)',
      },
      {
        id: 'preferenciaActualizacion',
        label: 'Para la actualización de créditos: ¿tienen preferencia entre el régimen de IPC + 3% anual (causas nuevas) o el régimen transitorio del art. 55 (causas en trámite), más allá de lo que la ley indique para cada situación?',
        tipo: 'textarea',
        ayuda: 'En general no hace falta elegir: la ley ya define cuál corresponde según si la causa es nueva o está en trámite. Completar solo si tienen un criterio propio distinto al que marca la ley.',
      },
      {
        id: 'fechaCalculo',
        label: '¿A qué fecha calculan habitualmente la liquidación para una demanda?',
        tipo: 'multi',
        obligatorio: true,
        ayuda: 'Ej.: "siempre calculamos al día del despido, y actualizamos recién si el caso llega a instancia de ejecución".',
        opciones: [
          { value: 'capital-historico-despido',   label: 'Capital histórico a la fecha del despido' },
          { value: 'actualizado-presentacion',    label: 'Actualizado a la fecha de presentación' },
        ],
      },
      {
        id: 'otroCriterio',
        label: '¿Tenés en cuenta algún otro criterio relevante?',
        tipo: 'textarea',
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
        label: '¿Qué porcentaje de cuota litis usan habitualmente?',
        tipo: 'number',
        obligatorio: true,
        ayuda: 'Ej.: 20%, que es el tope legal.',
      },
      {
        id: 'tipoPacto',
        label: '¿Usan pacto de cuota litis, contrato de honorarios aparte, o ambos?',
        tipo: 'multi',
        obligatorio: true,
        ayuda: 'El pacto de cuota litis es el acuerdo donde el cliente cede un porcentaje de lo que llegue a cobrar; el contrato de honorarios es un documento más amplio que puede sumar otras condiciones además del porcentaje. La mayoría de los estudios usa solo el pacto. Si usan ambos, tildá los dos.',
        opciones: [
          { value: 'pacto-cuota-litis',    label: 'Pacto de cuota litis' },
          { value: 'contrato-honorarios',  label: 'Contrato de honorarios aparte' },
        ],
      },
      {
        id: 'condicionParticularPacto',
        label: '¿Tienen alguna condición o modalidad particular que agregan siempre al pacto?',
        tipo: 'textarea',
        placeholder: 'Ej.: cobramos un adelanto de $X al iniciar, independientemente del resultado del juicio.',
      },
      {
        id: 'ley27802Postura',
        label: 'Sobre las novedades de la Ley 27.802 (tope global de costas del 25% con prorrateo, y pago de sentencias en cuotas): si tuvieran que elegir una inclinación por default, ¿prefieren mencionarlo, no mencionarlo, o no tienen preferencia?',
        tipo: 'radio',
        obligatorio: true,
        ayuda: 'El tema está en debate doctrinario activo, así que la skill le va a preguntar al abogado en cada pacto igual, mostrando esto como sugerencia — nunca decide por su cuenta ni se salta la pregunta en vivo.',
        opciones: [
          { value: 'mencionarlo',    label: 'Mencionarlo' },
          { value: 'no-mencionarlo', label: 'No mencionarlo' },
          { value: 'sin-preferencia', label: 'Sin preferencia' },
        ],
      },
      {
        id: 'otroDato',
        label: 'Aclará cualquier otro dato que sea necesario.',
        tipo: 'textarea',
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
        id: 'referenciasDoctrina',
        label: '¿Hay fallos, plenarios o autores de doctrina que el estudio use como referencia habitual?',
        tipo: 'textarea',
        ayuda: 'Pueden escribir el nombre del fallo o autor. Si tienen el PDF guardado, súbanlo en la Instancia 9. Se puede dejar vacío sin problema.',
      },
      {
        id: 'tonoRedaccion',
        label: '¿Cómo prefieren el tono de redacción de los escritos?',
        tipo: 'radio',
        obligatorio: true,
        opciones: [
          { value: 'formal-tradicional', label: 'Más formal / tradicional (como se escribe habitualmente en el fuero)' },
          { value: 'directo',            label: 'Más directo (sin fórmulas de estilo antiguas)' },
        ],
      },
      {
        id: 'armadoDemandaPreferencia',
        label: 'Al armar una demanda, ¿cuál preferís como sugerencia por default: completa de una sola vez, o por bloques confirmando cada parte?',
        tipo: 'radio',
        ayuda: 'Elijas lo que elijas acá, la skill te va a preguntar en cada demanda igual, mostrando esta preferencia como sugerencia — nunca se salta la pregunta en vivo. Si no tenés preferencia, dejalo en blanco.',
        opciones: [
          { value: 'completa',        label: 'Completa de una sola vez' },
          { value: 'por-bloques',     label: 'Por bloques, confirmando cada parte', recomendado: true },
          { value: 'sin-preferencia', label: 'Sin preferencia' },
        ],
      },
      {
        id: 'otroDato',
        label: 'Aclará cualquier otro dato que sea necesario.',
        tipo: 'textarea',
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
        id: 'tonoComunicacion',
        label: '¿Cómo prefieren el tono al comunicarse con el trabajador/cliente?',
        tipo: 'textarea',
        obligatorio: true,
        placeholder: 'Ej.: formal · cercano y con explicaciones simples, muchos de nuestros clientes no tienen experiencia con lo judicial.',
      },
      {
        id: 'plantillasComunicacion',
        label: '¿Tienen plantillas propias de comunicación (instructivos, actualizaciones de caso, rendición final) que quieran cargar?',
        tipo: 'radio',
        obligatorio: true,
        ayuda: 'Si eligen "Sí", suban los archivos en la Instancia 9.',
        opciones: [
          { value: 'si-cargar',      label: 'Sí, vamos a cargar archivo(s)' },
          { value: 'no-usar-estandar', label: 'No, usar un formato estándar' },
        ],
      },
      {
        id: 'otroDato',
        label: 'Aclará cualquier otro dato que sea necesario.',
        tipo: 'textarea',
      },
    ],
  },
  {
    id: 'modelos-plantillas',
    numero: 9,
    titulo: 'Modelos y plantillas',
    descripcion: 'Esta es la instancia más pesada — conviene que quede al final, y que se pueda completar después, no necesariamente en la misma sesión que el resto del formulario. Todos los modelos son opcionales: si el estudio no carga uno específico, la skill usa la estructura estándar del paquete para ese tipo.',
    campos: [
      // ─── Modelos de demanda laboral ────────────────────────────────────────
      {
        id: 'sectionDemandas',
        tipo: 'section',
        label: 'Modelos de demanda laboral',
        ayuda: 'Si usás un único modelo base para todas las demandas, tildá la opción de abajo y subí solo ese archivo. Si distinguís por tipo, dejala destildada y cargá los modelos que tengas.',
      },
      {
        id: 'demandaUsarBaseUnica',
        label: 'Uso un único modelo base para todas las demandas',
        tipo: 'boolean',
      },
      {
        id: 'demandaModeloBase',
        label: 'Modelo base de demanda',
        tipo: 'file',
        accept: '.doc,.docx',
        ayuda: 'Este modelo se va a usar para todos los tipos de demanda.',
        showIf: ctx => ctx.localAnswers.demandaUsarBaseUnica === true,
      },
      { id: 'demandaDespidoSinCausa',           label: 'Despido sin causa.',                                          tipo: 'file', accept: '.doc,.docx', showIf: ctx => ctx.localAnswers.demandaUsarBaseUnica !== true },
      { id: 'demandaDespidoIndirecto',          label: 'Despido indirecto.',                                          tipo: 'file', accept: '.doc,.docx', showIf: ctx => ctx.localAnswers.demandaUsarBaseUnica !== true },
      { id: 'demandaTrabajoNoRegistrado',       label: 'Trabajo no registrado / mal registrado.',                     tipo: 'file', accept: '.doc,.docx', showIf: ctx => ctx.localAnswers.demandaUsarBaseUnica !== true },
      { id: 'demandaDespidoEmbarazoMatrimonio', label: 'Despido por embarazo / matrimonio.',                          tipo: 'file', accept: '.doc,.docx', showIf: ctx => ctx.localAnswers.demandaUsarBaseUnica !== true },
      { id: 'demandaDespidoEnfermedad',         label: 'Despido durante enfermedad inculpable / reserva de puesto.',  tipo: 'file', accept: '.doc,.docx', showIf: ctx => ctx.localAnswers.demandaUsarBaseUnica !== true },
      { id: 'demandaDespidoDiscriminatorio',    label: 'Despido discriminatorio.',                                    tipo: 'file', accept: '.doc,.docx', showIf: ctx => ctx.localAnswers.demandaUsarBaseUnica !== true },
      { id: 'demandaExtincionFuerzaMayor',      label: 'Extinción por fuerza mayor / falta de trabajo.',              tipo: 'file', accept: '.doc,.docx', showIf: ctx => ctx.localAnswers.demandaUsarBaseUnica !== true },

      // ─── Modelos de telegrama / carta documento ────────────────────────────
      {
        id: 'sectionTelegramas',
        tipo: 'section',
        label: 'Modelos de telegrama / carta documento',
        ayuda: 'Si usás un único modelo base para todos los telegramas, tildá la opción de abajo y subí solo ese archivo. Si distinguís por supuesto, dejala destildada y cargá los modelos que tengas.',
      },
      {
        id: 'telegramaUsarBaseUnica',
        label: 'Uso un único modelo base para todos los telegramas / cartas documento',
        tipo: 'boolean',
      },
      {
        id: 'telegramaModeloBase',
        label: 'Modelo base de telegrama / CD',
        tipo: 'file',
        accept: '.doc,.docx',
        ayuda: 'Este modelo se va a usar para todos los supuestos.',
        showIf: ctx => ctx.localAnswers.telegramaUsarBaseUnica === true,
      },
      { id: 'telegramaRegistracion',          label: 'Registración / aclaración de la situación laboral.', tipo: 'file', accept: '.doc,.docx', showIf: ctx => ctx.localAnswers.telegramaUsarBaseUnica !== true },
      { id: 'telegramaSubRegistracion',       label: 'Sub-registración.',                                  tipo: 'file', accept: '.doc,.docx', showIf: ctx => ctx.localAnswers.telegramaUsarBaseUnica !== true },
      { id: 'telegramaHostigamiento',         label: 'Hostigamiento / acoso laboral.',                     tipo: 'file', accept: '.doc,.docx', showIf: ctx => ctx.localAnswers.telegramaUsarBaseUnica !== true },
      { id: 'telegramaDiferenciasSalariales', label: 'Diferencias salariales / horas extras.',             tipo: 'file', accept: '.doc,.docx', showIf: ctx => ctx.localAnswers.telegramaUsarBaseUnica !== true },
      { id: 'telegramaCertificadosArt80',     label: 'Certificados de trabajo (art. 80 LCT).',             tipo: 'file', accept: '.doc,.docx', showIf: ctx => ctx.localAnswers.telegramaUsarBaseUnica !== true },
      { id: 'telegramaDespidoIndirecto',      label: 'Despido indirecto / autodespido.',                   tipo: 'file', accept: '.doc,.docx', showIf: ctx => ctx.localAnswers.telegramaUsarBaseUnica !== true },
      { id: 'telegramaEnfermedadInculpable',  label: 'Enfermedad inculpable / reserva de puesto.',         tipo: 'file', accept: '.doc,.docx', showIf: ctx => ctx.localAnswers.telegramaUsarBaseUnica !== true },
      { id: 'telegramaRechazoMisiva',         label: 'Rechazo de misiva del empleador.',                   tipo: 'file', accept: '.doc,.docx', showIf: ctx => ctx.localAnswers.telegramaUsarBaseUnica !== true },

      // ─── Liquidación ───────────────────────────────────────────────────────
      {
        id: 'sectionLiquidacion',
        tipo: 'section',
        label: 'Liquidación',
      },
      {
        id: 'liquidacionCalculadora',
        label: 'Calculadora de liquidación (Excel con fórmulas), si ya tienen una propia.',
        tipo: 'file',
        accept: '.xls,.xlsx,.csv',
        ayuda: 'Si no cargan, se usa la calculadora estándar del paquete.',
      },

      // ─── Honorarios ────────────────────────────────────────────────────────
      {
        id: 'sectionHonorarios',
        tipo: 'section',
        label: 'Honorarios (separados, son dos documentos distintos)',
      },
      { id: 'honorariosPactoCuotaLitis', label: 'Modelo de pacto de cuota litis.',                                                 tipo: 'file', accept: '.doc,.docx' },
      { id: 'honorariosContrato',        label: 'Modelo de contrato de honorarios, si lo usan además del pacto o en su lugar.',   tipo: 'file', accept: '.doc,.docx' },

      // ─── Pericial ──────────────────────────────────────────────────────────
      {
        id: 'sectionPericial',
        tipo: 'section',
        label: 'Pericial',
      },
      { id: 'periciaImpugnacion', label: 'Modelo de impugnación pericial.', tipo: 'file', accept: '.doc,.docx' },

      // ─── Escritos de trámite ───────────────────────────────────────────────
      {
        id: 'sectionEscritosTramite',
        tipo: 'section',
        label: 'Escritos de trámite (uno por tipo, todos opcionales)',
      },
      { id: 'escritoPoder',                  label: 'Poder.',                                                      tipo: 'file', accept: '.doc,.docx' },
      { id: 'escritoSegundoTraslado',        label: 'Segundo traslado / réplica a la contestación.',               tipo: 'file', accept: '.doc,.docx' },
      { id: 'escritoAperturaPrueba',         label: 'Pedido de apertura a prueba.',                                tipo: 'file', accept: '.doc,.docx' },
      { id: 'escritoCedulaNotificacion',     label: 'Cédula de notificación.',                                     tipo: 'file', accept: '.doc,.docx' },
      { id: 'escritoCedulaPrueba',           label: 'Cédula de prueba (testigos / absolución de posiciones).',     tipo: 'file', accept: '.doc,.docx' },
      { id: 'escritoOficioPrueba',           label: 'Oficio (de prueba).',                                          tipo: 'file', accept: '.doc,.docx' },
      { id: 'escritoAcreditacionOficio',     label: 'Acreditación de oficio.',                                     tipo: 'file', accept: '.doc,.docx' },
      { id: 'escritoAcuerdoConciliatorio',   label: 'Acuerdo conciliatorio.',                                      tipo: 'file', accept: '.doc,.docx' },
      { id: 'escritoEjecucionSentencia',     label: 'Escrito de inicio de ejecución de sentencia.',                tipo: 'file', accept: '.doc,.docx' },
      { id: 'escritoRecurso',                label: 'Recurso (revocatoria / aclaratoria).',                        tipo: 'file', accept: '.doc,.docx' },
      { id: 'escritoRebeldia',               label: 'Rebeldía.',                                                   tipo: 'file', accept: '.doc,.docx' },

      // ─── Ofrecimiento de prueba ────────────────────────────────────────────
      {
        id: 'sectionOfrecimientoPrueba',
        tipo: 'section',
        label: 'Ofrecimiento de prueba (skill propia, no es un escrito de trámite)',
      },
      {
        id: 'ofrecimientoPruebaModelo',
        label: 'Modelo de ofrecimiento de prueba.',
        tipo: 'file',
        accept: '.doc,.docx',
        ayuda: 'Solo aplica si en la jurisdicción del estudio el ofrecimiento es un acto separado de la demanda (ver Instancia 2).',
      },

      // ─── Alegato y recursos ────────────────────────────────────────────────
      {
        id: 'sectionAlegatoRecursos',
        tipo: 'section',
        label: 'Alegato y recursos',
      },
      { id: 'alegatoModelo',         label: 'Modelo de alegato.',                                        tipo: 'file', accept: '.doc,.docx' },
      { id: 'recursoApelacionModelo',label: 'Modelo de expresión de agravios / recurso de apelación.',   tipo: 'file', accept: '.doc,.docx' },

      // ─── Otros modelos ─────────────────────────────────────────────────────
      {
        id: 'sectionOtrosModelos',
        tipo: 'section',
        label: 'Otros modelos',
      },
      {
        id: 'modelosExtras',
        label: 'Modelos adicionales (hasta 5)',
        tipo: 'file',
        accept: '.doc,.docx',
        multiple: true,
        maxItems: 5,
        ayuda: 'Espacio libre para cualquier modelo que no encaje en las categorías anteriores. Máximo 5 archivos.',
      },
    ],
  },
]

export const INSTANCIA_MAP: Record<string, InstanciaDef> = Object.fromEntries(
  INSTANCIAS.map(i => [i.id, i])
)

// Mapeo de campos de la instancia 9 → carpeta canónica en Storage.
// Es la fuente de verdad para el manifiesto de carpetas del estudio.
// El prefijo `modelos/` o `datos/` se strippea al guardar en `documentos.carpeta`.
export const CARPETAS_MODELOS: { fieldId: string; carpeta: string }[] = [
  // Demandas
  { fieldId: 'demandaModeloBase',                carpeta: 'modelos/demandas/base' },
  { fieldId: 'demandaDespidoSinCausa',           carpeta: 'modelos/demandas/despido-sin-causa' },
  { fieldId: 'demandaDespidoIndirecto',          carpeta: 'modelos/demandas/despido-indirecto' },
  { fieldId: 'demandaTrabajoNoRegistrado',       carpeta: 'modelos/demandas/trabajo-no-registrado' },
  { fieldId: 'demandaDespidoEmbarazoMatrimonio', carpeta: 'modelos/demandas/despido-embarazo-matrimonio' },
  { fieldId: 'demandaDespidoEnfermedad',         carpeta: 'modelos/demandas/despido-enfermedad' },
  { fieldId: 'demandaDespidoDiscriminatorio',    carpeta: 'modelos/demandas/despido-discriminatorio' },
  { fieldId: 'demandaExtincionFuerzaMayor',      carpeta: 'modelos/demandas/extincion-fuerza-mayor' },

  // Telegramas / CD
  { fieldId: 'telegramaModeloBase',            carpeta: 'modelos/telegramas/base' },
  { fieldId: 'telegramaRegistracion',          carpeta: 'modelos/telegramas/registracion' },
  { fieldId: 'telegramaSubRegistracion',       carpeta: 'modelos/telegramas/sub-registracion' },
  { fieldId: 'telegramaHostigamiento',         carpeta: 'modelos/telegramas/hostigamiento' },
  { fieldId: 'telegramaDiferenciasSalariales', carpeta: 'modelos/telegramas/diferencias-salariales' },
  { fieldId: 'telegramaCertificadosArt80',     carpeta: 'modelos/telegramas/certificados-art80' },
  { fieldId: 'telegramaDespidoIndirecto',      carpeta: 'modelos/telegramas/despido-indirecto' },
  { fieldId: 'telegramaEnfermedadInculpable',  carpeta: 'modelos/telegramas/enfermedad-inculpable' },
  { fieldId: 'telegramaRechazoMisiva',         carpeta: 'modelos/telegramas/rechazo-misiva' },

  // Liquidación
  { fieldId: 'liquidacionCalculadora', carpeta: 'modelos/liquidacion/calculadora' },

  // Honorarios
  { fieldId: 'honorariosPactoCuotaLitis', carpeta: 'modelos/honorarios/pacto-cuota-litis' },
  { fieldId: 'honorariosContrato',        carpeta: 'modelos/honorarios/contrato' },

  // Pericial
  { fieldId: 'periciaImpugnacion', carpeta: 'modelos/pericial/impugnacion' },

  // Escritos de trámite
  { fieldId: 'escritoPoder',                carpeta: 'modelos/escritos/poder' },
  { fieldId: 'escritoSegundoTraslado',      carpeta: 'modelos/escritos/segundo-traslado' },
  { fieldId: 'escritoAperturaPrueba',       carpeta: 'modelos/escritos/apertura-prueba' },
  { fieldId: 'escritoCedulaNotificacion',   carpeta: 'modelos/escritos/cedula-notificacion' },
  { fieldId: 'escritoCedulaPrueba',         carpeta: 'modelos/escritos/cedula-prueba' },
  { fieldId: 'escritoOficioPrueba',         carpeta: 'modelos/escritos/oficio-prueba' },
  { fieldId: 'escritoAcreditacionOficio',   carpeta: 'modelos/escritos/acreditacion-oficio' },
  { fieldId: 'escritoAcuerdoConciliatorio', carpeta: 'modelos/escritos/acuerdo-conciliatorio' },
  { fieldId: 'escritoEjecucionSentencia',   carpeta: 'modelos/escritos/ejecucion-sentencia' },
  { fieldId: 'escritoRecurso',              carpeta: 'modelos/escritos/recurso' },
  { fieldId: 'escritoRebeldia',             carpeta: 'modelos/escritos/rebeldia' },

  // Ofrecimiento de prueba
  { fieldId: 'ofrecimientoPruebaModelo', carpeta: 'modelos/ofrecimiento-prueba' },

  // Alegato y recursos
  { fieldId: 'alegatoModelo',          carpeta: 'modelos/alegato' },
  { fieldId: 'recursoApelacionModelo', carpeta: 'modelos/recurso-apelacion' },

  // Otros modelos (espacio libre, hasta 5 archivos)
  { fieldId: 'modelosExtras',          carpeta: 'modelos/otros' },
]
