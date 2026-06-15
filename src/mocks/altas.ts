import type { Alta, RunbookItem } from '@/types'

export const MOCK_ALTAS: Record<string, Alta> = {
  'estudio-001': {
    id: 'alta-001',
    estudioId: 'estudio-001',
    estado: 'agendada',
    fecha: '2026-06-20',
    horaInicio: '10:00',
    horaFin: '11:00',
    linkMeet: 'https://meet.google.com/abc-defg-hij',
  },
  'estudio-002': {
    id: 'alta-002',
    estudioId: 'estudio-002',
    estado: 'pendiente',
  },
  'estudio-003': {
    id: 'alta-003',
    estudioId: 'estudio-003',
    estado: 'realizada',
    fecha: '2026-06-10',
    horaInicio: '14:00',
    horaFin: '15:00',
    linkMeet: 'https://meet.google.com/xyz-uvwx-yz1',
  },
}

// Runbook de alta — pasos del setup-day
// TODO: refinar con el equipo cuando esté definido el flujo completo
export const RUNBOOK_PASOS: Omit<RunbookItem, 'completado'>[] = [
  { id: 'rb-01', label: 'Descargar e instalar Claude Desktop en la PC del cliente' },
  { id: 'rb-02', label: 'Verificar plan activo de Claude (Pro o Team)' },
  { id: 'rb-03', label: 'Abrir Claude Desktop y crear un nuevo Proyecto (Cowork)' },
  { id: 'rb-04', label: 'Pegar el bloque de Instrucciones Globales en el contexto del proyecto' },
  { id: 'rb-05', label: 'Instalar el plugin/extensión de Claude correspondiente' },
  { id: 'rb-06', label: 'Instalar las skills jurídicas seleccionadas por el cliente' },
  { id: 'rb-07', label: 'Subir los modelos desde el ZIP a la carpeta del estudio' },
  { id: 'rb-08', label: 'Conectar Google Drive (si aplica)' },
  { id: 'rb-09', label: 'Conectar Google Calendar (si aplica)' },
  { id: 'rb-10', label: 'Conectar Gmail (si aplica)' },
  { id: 'rb-11', label: 'Prueba de funcionamiento: generar un escrito de prueba' },
  { id: 'rb-12', label: 'Revisión final con el cliente y cierre del alta' },
]
