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

export const LABELS_ESTADO_ALTA = {
  'pendiente': 'Pendiente',
  'agendada': 'Alta agendada',
  'realizada': 'Alta realizada',
} as const

export const LABEL_CARPETA: Record<string, string> = {
  telegramas: 'Telegramas y cartas documento',
  demandas: 'Demandas laborales',
  escritos: 'Escritos procesales',
  impugnaciones: 'Impugnaciones periciales',
  honorarios: 'Contratos de honorarios',
  comunicaciones: 'Comunicaciones con clientes',
  'escalas-cct': 'Escalas de CCT',
}
