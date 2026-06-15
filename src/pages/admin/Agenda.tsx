/**
 * Agenda del admin — calendario visual con datos mock.
 *
 * TODO Fase 2: conectar con la API de Calendly para leer reservas reales.
 * Flujo:
 *   1. El cliente agenda en Calendly (embed del paso 7).
 *   2. Calendly envía un webhook a una Supabase Edge Function.
 *   3. La Edge Function guarda la reserva en la tabla `altas` de Supabase.
 *   4. Esta pantalla lee de Supabase en lugar de los mocks.
 *
 * NOTA: La API REST de Calendly (para leer eventos) requiere un API key
 * guardado en servidor (Edge Function), no en el frontend.
 * Planes compatibles: Standard, Teams, Enterprise (no plan gratuito).
 */
import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, CalendarDays, ExternalLink } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { ClienteResumen } from '@/types'
import { usuarioService } from '@/services'
import { formatFecha, cn } from '@/lib/utils'

const DIAS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']

function getDiasDelMes(año: number, mes: number): number {
  return new Date(año, mes + 1, 0).getDate()
}

function getPrimerDia(año: number, mes: number): number {
  return new Date(año, mes, 1).getDay()
}

export default function Agenda() {
  const hoy = new Date()
  const [año, setAño] = useState(hoy.getFullYear())
  const [mes, setMes] = useState(hoy.getMonth())
  const [clientes, setClientes] = useState<ClienteResumen[]>([])
  const [diaSeleccionado, setDiaSeleccionado] = useState<string | null>(null)

  useEffect(() => {
    usuarioService.listClientes().then(setClientes)
  }, [])

  const altasConFecha = clientes.filter(c => c.alta.fecha && c.alta.estado !== 'pendiente')

  const altasPorFecha = (fecha: string) =>
    altasConFecha.filter(c => c.alta.fecha === fecha)

  const prevMes = () => {
    if (mes === 0) { setMes(11); setAño(a => a - 1) }
    else setMes(m => m - 1)
  }
  const nextMes = () => {
    if (mes === 11) { setMes(0); setAño(a => a + 1) }
    else setMes(m => m + 1)
  }

  const totalDias = getDiasDelMes(año, mes)
  const primerDia = getPrimerDia(año, mes)
  const celdas = Array.from({ length: primerDia + totalDias }, (_, i) => i - primerDia + 1)

  const altasDelDia = diaSeleccionado ? altasPorFecha(diaSeleccionado) : []

  return (
    <div className="p-4 sm:p-6 md:p-8">
      <div className="flex items-center gap-3 mb-6 md:mb-8">
        <div className="w-10 h-10 rounded-xl bg-teal/10 border border-teal/25 flex items-center justify-center">
          <CalendarDays className="w-5 h-5 text-teal" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-text">Agenda</h1>
          <p className="text-sm text-text-dim">Altas agendadas y realizadas</p>
        </div>
        {/* TODO Fase 2 badge */}
        <span className="ml-auto text-xs px-2.5 py-1 bg-warning/8 border border-warning/15 text-warning rounded-full hidden sm:inline">
          TODO Fase 2: conectar Calendly
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">
        {/* Calendario */}
        <div className="bg-bg-card border border-border rounded-2xl overflow-hidden">
          {/* Header del calendario */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border">
            <button onClick={prevMes} className="p-1.5 rounded-lg text-text-dim hover:text-text hover:bg-bg-3 transition-colors">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <h2 className="text-base font-semibold text-text">
              {MESES[mes]} {año}
            </h2>
            <button onClick={nextMes} className="p-1.5 rounded-lg text-text-dim hover:text-text hover:bg-bg-3 transition-colors">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Nombres de días */}
          <div className="grid grid-cols-7 border-b border-border">
            {DIAS.map(d => (
              <div key={d} className="py-2.5 text-center text-xs font-medium text-text-faint">
                {d}
              </div>
            ))}
          </div>

          {/* Grilla */}
          <div className="grid grid-cols-7">
            {celdas.map((dia, i) => {
              if (dia <= 0) return <div key={`empty-${i}`} className="h-12 sm:h-16 border-r border-b border-border/30 last:border-r-0" />

              const fechaStr = `${año}-${String(mes + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`
              const altas = altasPorFecha(fechaStr)
              const esHoy = fechaStr === hoy.toISOString().slice(0, 10)
              const seleccionado = fechaStr === diaSeleccionado

              return (
                <button
                  key={fechaStr}
                  onClick={() => setDiaSeleccionado(seleccionado ? null : fechaStr)}
                  className={cn(
                    'h-12 sm:h-16 border-r border-b border-border/30 last:border-r-0 relative p-1 sm:p-1.5 text-left transition-all',
                    seleccionado && 'bg-teal/8',
                    !seleccionado && 'hover:bg-bg-3'
                  )}
                >
                  <span className={cn(
                    'text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full',
                    esHoy ? 'bg-teal text-bg' : 'text-text-dim',
                    seleccionado && !esHoy && 'text-teal'
                  )}>
                    {dia}
                  </span>
                  {altas.length > 0 && (
                    <div className="flex flex-col gap-0.5 mt-0.5">
                      {altas.slice(0, 2).map(c => (
                        <div
                          key={c.usuario.id}
                          className={cn(
                            'text-xs px-1 py-0.5 rounded truncate',
                            c.alta.estado === 'realizada'
                              ? 'bg-bg-3 text-text-faint'
                              : 'bg-teal/12 text-teal'
                          )}
                        >
                          {c.estudio.denominacion.split(' ')[0]}
                        </div>
                      ))}
                      {altas.length > 2 && (
                        <div className="text-xs text-text-faint pl-1">+{altas.length - 2}</div>
                      )}
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Panel lateral */}
        <div>
          {diaSeleccionado ? (
            <div className="bg-bg-card border border-border rounded-2xl p-5">
              <h3 className="text-sm font-semibold text-text mb-1">{formatFecha(diaSeleccionado)}</h3>
              <p className="text-xs text-text-dim mb-4">
                {altasDelDia.length === 0 ? 'Sin altas este día' : `${altasDelDia.length} alta${altasDelDia.length !== 1 ? 's' : ''}`}
              </p>
              {altasDelDia.length === 0 ? (
                <p className="text-xs text-text-faint text-center py-8">Sin actividad</p>
              ) : (
                <div className="space-y-3">
                  {altasDelDia.map(c => (
                    <div key={c.usuario.id} className="bg-bg-3 rounded-xl p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="text-sm font-medium text-text">{c.estudio.denominacion}</p>
                          <p className="text-xs text-text-dim">{c.alta.horaInicio}–{c.alta.horaFin}</p>
                        </div>
                        <span className={cn(
                          'text-xs px-2 py-0.5 rounded-full border',
                          c.alta.estado === 'agendada' ? 'text-teal bg-teal/8 border-teal/20' : 'text-text-faint bg-bg border-border'
                        )}>
                          {c.alta.estado === 'agendada' ? 'Agendada' : 'Realizada'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Link
                          to={`/admin/clientes/${c.usuario.id}`}
                          className="text-xs text-text-dim hover:text-teal transition-colors"
                        >
                          Ver cockpit →
                        </Link>
                        {c.alta.linkMeet && (
                          <a
                            href={c.alta.linkMeet}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-xs text-teal hover:underline ml-auto"
                          >
                            <ExternalLink className="w-3 h-3" />
                            Meet
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-bg-card border border-border rounded-2xl p-5">
              <p className="text-sm text-text-dim mb-4">Próximas altas</p>
              {altasConFecha.filter(c => c.alta.estado === 'agendada').length === 0 ? (
                <p className="text-xs text-text-faint">Sin altas agendadas</p>
              ) : (
                <div className="space-y-3">
                  {altasConFecha
                    .filter(c => c.alta.estado === 'agendada')
                    .sort((a, b) => (a.alta.fecha ?? '') > (b.alta.fecha ?? '') ? 1 : -1)
                    .map(c => (
                      <Link
                        key={c.usuario.id}
                        to={`/admin/clientes/${c.usuario.id}`}
                        className="block bg-bg-3 rounded-xl p-3.5 hover:bg-bg-3/80 transition-colors"
                      >
                        <p className="text-sm font-medium text-text">{c.estudio.denominacion}</p>
                        <p className="text-xs text-text-dim mt-0.5">
                          {c.alta.fecha && formatFecha(c.alta.fecha)} · {c.alta.horaInicio}–{c.alta.horaFin}
                        </p>
                      </Link>
                    ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
