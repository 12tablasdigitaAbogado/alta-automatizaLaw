import type { Estudio } from '@/types'

export const MOCK_ESTUDIOS: Record<string, Estudio> = {
  'estudio-001': {
    id: 'estudio-001',
    denominacion: 'García & Asociados',
    abogadoResponsable: 'María García',
    matricula: 'Tomo 42, Folio 187 — CPACF',
    domicilio: 'Av. Corrientes 1234, Piso 5 Of. B, CABA',
    telefono: '+54 11 4321-5678',
    email: 'garcia@estudiojuridico.com',
    estiloRedaccion: 'Formal, técnico. Evitar coloquialismos. Primera persona del plural.',
    pieFirma: 'Dra. María García\nAbogada — CPACF T° 42 F° 187\nTel: +54 11 4321-5678 | garcia@estudiojuridico.com',
  },
  'estudio-002': {
    id: 'estudio-002',
    denominacion: 'Rodríguez & Asociados',
    abogadoResponsable: 'Carlos Rodríguez',
    matricula: 'Tomo 55, Folio 320 — CPACF',
    domicilio: 'Florida 850, Piso 2, CABA',
    telefono: '+54 11 5555-1234',
    email: 'rodriguez@rlabogados.com',
    estiloRedaccion: 'Formal y conciso. Lenguaje claro.',
    pieFirma: 'Dr. Carlos Rodríguez\nAbogada — CPACF T° 55 F° 320',
  },
  'estudio-003': {
    id: 'estudio-003',
    denominacion: 'Fernández Asociados',
    abogadoResponsable: 'Laura Fernández',
    matricula: 'Tomo 68, Folio 91 — CPACF',
    domicilio: 'Reconquista 458, Piso 8, CABA',
    telefono: '+54 11 4444-9900',
    email: 'fernandez@fernandezasociados.com',
    estiloRedaccion: 'Técnico-jurídico, con citas doctrinales frecuentes.',
    pieFirma: 'Dra. Laura Fernández\nAbogada — CPACF T° 68 F° 91',
  },
}
