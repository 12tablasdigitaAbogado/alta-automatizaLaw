/**
 * CalendarBooking — placeholder para el embed de Calendly.
 *
 * TODO Fase 2: reemplazar el contenido de este componente con el embed de Calendly.
 * Opciones:
 *   a) Inline embed: <div className="calendly-inline-widget" data-url="https://calendly.com/tu-url" />
 *      + <script src="https://assets.calendly.com/assets/external/widget.js" />
 *   b) Popup widget: usar el SDK de Calendly (npm i react-calendly)
 *
 * La agenda del admin (lectura de reservas) requiere la API REST de Calendly
 * y un webhook backend. Ver src/services/calendario.mock.ts para la interfaz.
 * TODO Fase 2: implementar src/services/calendario.supabase.ts con edge functions
 * que proxeen las llamadas a la API de Calendly (API key en servidor, no en cliente).
 */
interface Props {
  urlCalendly?: string
  onReservado?: () => void
}

export function CalendarBooking({ urlCalendly }: Props) {
  if (urlCalendly) {
    // TODO Fase 2: activar cuando tengamos la URL de Calendly
    // return (
    //   <div
    //     className="calendly-inline-widget w-full rounded-xl overflow-hidden"
    //     style={{ minWidth: '320px', height: '700px' }}
    //     data-url={urlCalendly}
    //   />
    // )
  }

  return (
    <div className="w-full border-2 border-dashed border-border rounded-2xl p-10 text-center">
      <div className="w-14 h-14 rounded-2xl bg-teal/8 border border-teal/20 flex items-center justify-center mx-auto mb-4">
        <span className="text-2xl">📅</span>
      </div>
      <p className="text-base font-semibold text-text mb-2">Calendario de agendamiento</p>
      <p className="text-sm text-text-dim mb-4">
        Acá va el embed de Calendly para que elijas tu horario.
      </p>
      <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-warning/8 border border-warning/20 rounded-lg">
        <span className="text-xs text-warning">TODO Fase 2: conectar Calendly</span>
      </div>
    </div>
  )
}
