import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function formatFecha(iso: string): string {
  if (!iso) return '—'
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

export const LABELS_CATEGORIA = {
  'cartas-documento': 'Cartas documento / Telegramas',
  'demandas': 'Demandas',
  'contratos': 'Contratos',
  'escritos-varios': 'Escritos varios',
} as const

export const LABELS_MODULO = {
  'redaccion-escritos': 'Redacción de escritos judiciales',
  'cartas-documento': 'Cartas documento y telegramas',
  'respuesta-telegramas': 'Respuesta a telegramas',
  'analisis-contratos': 'Análisis de contratos',
  'consulta-jurisprudencia': 'Consulta de jurisprudencia',
  'liquidacion-honorarios': 'Liquidación de honorarios',
} as const

export const LABELS_CONECTOR = {
  'google-drive': 'Google Drive',
  'google-calendar': 'Google Calendar',
  'gmail': 'Gmail',
} as const

export const LABELS_ESTADO_ALTA = {
  'pendiente': 'Pendiente',
  'agendada': 'Alta agendada',
  'realizada': 'Alta realizada',
} as const
