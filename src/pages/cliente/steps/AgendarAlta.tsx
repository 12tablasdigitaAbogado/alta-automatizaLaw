import { useState, useEffect, useRef } from 'react'
import { Lock, Unlock, CalendarDays, PartyPopper, CalendarCheck } from 'lucide-react'
import { GhlBooking } from '@/components/shared/GhlBooking'
import { GhlForm } from '@/components/shared/GhlForm'
import { useRoadmap } from '@/context/RoadmapContext'
import { cn } from '@/lib/utils'

export function AgendarAlta() {
  const { progreso, alta, marcarAltaAgendada } = useRoadmap()
  const desbloqueado = progreso?.desbloqueado ?? false
  const yaAgendado = alta?.estado === 'agendada' || alta?.estado === 'realizada'

  const [animando, setAnimando] = useState(false)
  const [mostrado, setMostrado] = useState(false)
  const bookingFiredRef = useRef(false)

  useEffect(() => {
    if (desbloqueado && !mostrado) {
      setAnimando(true)
      setMostrado(true)
      const t = setTimeout(() => setAnimando(false), 600)
      return () => clearTimeout(t)
    }
  }, [desbloqueado, mostrado])

  // GHL emite al parent un mensaje con forma de tupla
  // ["msgsndr-booking-complete", { fingerprint, calendarId }]
  // cuando el usuario confirma su turno en el widget Neo.
  useEffect(() => {
    if (yaAgendado) return
    const handler = (e: MessageEvent) => {
      const origin = (e.origin || '').toLowerCase()
      const fromGhl =
        origin.includes('leadconnectorhq.com') ||
        origin.includes('msgsndr.com') ||
        origin.includes('gohighlevel.com')
      if (!fromGhl) return

      const data = e.data
      if (!Array.isArray(data) || data[0] !== 'msgsndr-booking-complete') return
      if (bookingFiredRef.current) return
      bookingFiredRef.current = true

      const payload = data[1] ?? {}
      const ref = JSON.stringify({
        source: 'ghl',
        fingerprint: payload.fingerprint,
        calendarId: payload.calendarId,
        ts: Date.now(),
      })
      marcarAltaAgendada(ref)
    }
    window.addEventListener('message', handler)
    return () => window.removeEventListener('message', handler)
  }, [marcarAltaAgendada, yaAgendado])

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className={cn(
          'w-10 h-10 rounded-xl border flex items-center justify-center transition-all',
          yaAgendado
            ? 'bg-teal/10 border-teal/30'
            : desbloqueado
              ? 'bg-teal/10 border-teal/30 glow-teal'
              : 'bg-bg-3 border-border'
        )}>
          {yaAgendado ? (
            <CalendarCheck className="w-5 h-5 text-teal" />
          ) : desbloqueado ? (
            <Unlock className={cn('w-5 h-5 text-teal', animando && 'animate-unlock')} />
          ) : (
            <Lock className="w-5 h-5 text-text-faint" />
          )}
        </div>
        <div>
          <h1 className="text-xl font-bold text-text">Agendar alta</h1>
          <p className="text-sm text-text-dim">
            {yaAgendado
              ? 'Tu reunión de alta está confirmada.'
              : desbloqueado
                ? 'Elegí el día y hora para tu reunión de alta.'
                : 'Completá el setup para desbloquear el agendamiento.'}
          </p>
        </div>
      </div>

      {yaAgendado ? (
        /* Estado: ya agendado */
        <div className="space-y-4">
          <div className="flex items-center gap-3 bg-teal/8 border border-teal/25 rounded-2xl p-6">
            <PartyPopper className="w-8 h-8 text-teal shrink-0" />
            <div>
              <p className="text-base font-semibold text-teal">¡Reunión agendada!</p>
              <p className="text-sm text-text-dim mt-1">
                Vas a recibir un email de confirmación con el link de Google Meet y los detalles de la reunión.
              </p>
            </div>
          </div>

          <div className="bg-bg-card border border-border rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <CalendarDays className="w-4 h-4 text-text-dim" />
              <h2 className="text-sm font-semibold text-text">¿Qué pasa en la reunión?</h2>
            </div>
            <ul className="space-y-1.5">
              {[
                'Duración: 60 minutos por Google Meet',
                'El operador configura Claude Desktop con tu contexto',
                'Instala las skills seleccionadas y conecta los servicios',
                'Hacen una prueba en vivo con un escrito real',
                'Al final, tu asistente está 100% operativo',
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-text-dim">
                  <span className="text-teal/50 mt-0.5">·</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <p className="text-sm text-text-dim text-center">
            ¿Necesitás cambiar el horario? Usá el link del email de confirmación para reprogramar.
          </p>

          <div className="pt-2">
            <h2 className="text-sm font-semibold text-text mb-3">
              Un último paso: completá este formulario
            </h2>
            <p className="text-sm text-text-dim mb-4">
              Nos ayuda a preparar tu reunión de alta con todo el contexto necesario.
            </p>
            <GhlForm />
          </div>
        </div>
      ) : desbloqueado ? (
        /* Estado: desbloqueado, aún no agendó */
        <>
          <div className="flex items-center gap-3 bg-teal/8 border border-teal/25 rounded-2xl p-5 mb-6 glow-teal">
            <PartyPopper className="w-6 h-6 text-teal shrink-0" />
            <div>
              <p className="text-sm font-semibold text-teal">¡Setup completo!</p>
              <p className="text-sm text-text-dim mt-0.5">
                Tu información está lista. Elegí un horario y nuestro operador se encarga de todo el día del alta.
              </p>
            </div>
          </div>

          <div className="bg-bg-card border border-border rounded-2xl p-5 mb-6">
            <div className="flex items-center gap-2 mb-3">
              <CalendarDays className="w-4 h-4 text-text-dim" />
              <h2 className="text-sm font-semibold text-text">¿Qué pasa en la reunión?</h2>
            </div>
            <ul className="space-y-1.5">
              {[
                'Duración: 60 minutos por Google Meet',
                'El operador configura Claude Desktop con tu contexto',
                'Instala las skills seleccionadas y conecta los servicios',
                'Hacen una prueba en vivo con un escrito real',
                'Al final, tu asistente está 100% operativo',
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-text-dim">
                  <span className="text-teal/50 mt-0.5">·</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <GhlBooking />
        </>
      ) : (
        /* Estado: bloqueado */
        <div className="border-2 border-dashed border-border rounded-2xl p-10 text-center">
          <Lock className="w-10 h-10 text-text-faint mx-auto mb-4" />
          <p className="text-base font-semibold text-text mb-2">
            Completá tu setup para desbloquear tu alta
          </p>
          <p className="text-sm text-text-dim mb-6 max-w-sm mx-auto">
            Necesitás completar la identidad del estudio y confirmar el checklist técnico.
          </p>
          <div className="space-y-2.5 text-left max-w-xs mx-auto">
            {[
              { ok: progreso?.identidadCompleta, label: 'Identidad del estudio' },
              { ok: progreso?.checklistCompleto, label: 'Checklist técnico' },
            ].map(({ ok, label }) => (
              <div key={label} className="flex items-center gap-2.5">
                <div className={cn(
                  'w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0',
                  ok ? 'bg-teal border-teal' : 'border-text-faint'
                )}>
                  {ok && <span className="text-bg text-xs font-bold">✓</span>}
                </div>
                <span className={cn('text-sm', ok ? 'text-text' : 'text-text-dim')}>{label}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
