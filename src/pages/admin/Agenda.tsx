import { useState } from 'react'
import { CalendarDays, Info, Copy, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

const CALENDAR_URL = import.meta.env.VITE_GOOGLE_CALENDAR_EMBED_URL as string | undefined

function buildEmbedUrl(rawUrl: string): string {
  try {
    const url = new URL(rawUrl)
    url.searchParams.set('showTitle', '0')
    url.searchParams.set('showPrint', '0')
    url.searchParams.set('showCalendars', '0')
    url.searchParams.set('showTz', '0')
    url.searchParams.set('bgcolor', '%230f0f12')
    if (!url.searchParams.has('ctz')) {
      url.searchParams.set('ctz', 'America%2FArgentina%2FBuenos_Aires')
    }
    return url.toString()
  } catch {
    return rawUrl
  }
}

export default function Agenda() {
  const [copiado, setCopiado] = useState(false)

  const copiarInstruccion = () => {
    const texto = 'https://calendar.google.com/calendar/embed?src=TU_EMAIL%40gmail.com&ctz=America%2FArgentina%2FBuenos_Aires'
    navigator.clipboard.writeText(texto)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
  }

  const embedUrl = CALENDAR_URL ? buildEmbedUrl(CALENDAR_URL) : null

  return (
    <div className="p-4 sm:p-6 md:p-8 h-full flex flex-col">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-teal/10 border border-teal/25 flex items-center justify-center">
          <CalendarDays className="w-5 h-5 text-teal" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-text">Agenda</h1>
          <p className="text-sm text-text-dim">Reuniones de alta agendadas</p>
        </div>
      </div>

      <div className="flex-1 min-h-0">
        {embedUrl ? (
          <div className="bg-bg-card border border-border rounded-2xl overflow-hidden" style={{ height: '700px' }}>
            <iframe
              src={embedUrl}
              className="w-full h-full"
              frameBorder="0"
              scrolling="no"
              title="Agenda Google Calendar"
            />
          </div>
        ) : (
          <SetupGuide onCopiar={copiarInstruccion} copiado={copiado} />
        )}
      </div>
    </div>
  )
}

function SetupGuide({ onCopiar, copiado }: { onCopiar: () => void; copiado: boolean }) {
  return (
    <div className="bg-bg-card border border-border rounded-2xl p-8 flex flex-col items-center text-center gap-6">
      <div className="w-14 h-14 rounded-2xl bg-teal/10 border border-teal/25 flex items-center justify-center">
        <CalendarDays className="w-7 h-7 text-teal" />
      </div>

      <div>
        <h2 className="text-base font-semibold text-text mb-2">Conectá tu Google Calendar</h2>
        <p className="text-sm text-text-dim max-w-md">
          Calendly agrega automáticamente cada reunión a tu Google Calendar.
          Seguí estos pasos para ver tu agenda aquí.
        </p>
      </div>

      <div className="w-full max-w-md text-left space-y-4">
        {[
          {
            n: '1',
            titulo: 'Abrí Google Calendar',
            desc: 'Ingresá en calendar.google.com con la cuenta del operador.',
          },
          {
            n: '2',
            titulo: 'Ajustes del calendario',
            desc: 'Hacé clic en el engranaje → Ajustes → elegí tu calendario en la columna izquierda.',
          },
          {
            n: '3',
            titulo: 'Copiá la URL de embed',
            desc: 'Andá a "Integrar calendario" → copiá la URL que dice "URL pública de este calendario".',
          },
          {
            n: '4',
            titulo: 'Pegala en el .env',
            desc: (
              <span>
                Abrí el archivo <code className="text-teal bg-teal/8 px-1.5 py-0.5 rounded text-xs">.env</code> del proyecto y pegá la URL en{' '}
                <code className="text-teal bg-teal/8 px-1.5 py-0.5 rounded text-xs">VITE_GOOGLE_CALENDAR_EMBED_URL</code>.
                Luego reiniciá el servidor de desarrollo.
              </span>
            ),
          },
        ].map(({ n, titulo, desc }) => (
          <div key={n} className="flex gap-4">
            <div className="w-7 h-7 rounded-full bg-teal/10 border border-teal/25 flex items-center justify-center text-sm font-semibold text-teal shrink-0 mt-0.5">
              {n}
            </div>
            <div>
              <p className="text-sm font-medium text-text">{titulo}</p>
              <p className="text-sm text-text-dim mt-0.5 leading-relaxed">{typeof desc === 'string' ? desc : desc}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="w-full max-w-md bg-bg-3 border border-border rounded-xl p-4 text-left">
        <div className="flex items-start gap-2 mb-3">
          <Info className="w-4 h-4 text-text-dim shrink-0 mt-0.5" />
          <p className="text-sm text-text-dim">La URL debería tener este formato:</p>
        </div>
        <div className="flex items-center gap-2">
          <code className="text-xs text-teal bg-teal/5 border border-teal/15 rounded-lg px-3 py-2 flex-1 break-all leading-relaxed">
            https://calendar.google.com/calendar/embed?src=TU_EMAIL%40gmail.com&ctz=America%2FArgentina%2FBuenos_Aires
          </code>
          <button
            onClick={onCopiar}
            className={cn(
              'flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm border transition-all shrink-0',
              copiado
                ? 'text-teal bg-teal/8 border-teal/20'
                : 'text-text-dim bg-bg border-border hover:border-teal/30 hover:text-teal'
            )}
          >
            {copiado ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>
    </div>
  )
}
