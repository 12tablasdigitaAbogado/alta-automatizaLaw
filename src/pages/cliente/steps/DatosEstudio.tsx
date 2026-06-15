import { useState, useEffect } from 'react'
import { Building2, Save } from 'lucide-react'
import { NavPasos } from '@/components/roadmap/NavPasos'
import { useRoadmap } from '@/context/RoadmapContext'
import type { Estudio } from '@/types'
import { cn } from '@/lib/utils'

interface Campo {
  key: keyof Estudio
  label: string
  placeholder: string
  requerido: boolean
  tipo?: 'textarea' | 'text'
  ayuda?: string
}

const CAMPOS: Campo[] = [
  { key: 'denominacion', label: 'Denominación del estudio', placeholder: 'García & Asociados', requerido: true },
  { key: 'abogadoResponsable', label: 'Abogado/a responsable', placeholder: 'Dra. María García', requerido: true },
  { key: 'matricula', label: 'Matrícula (tomo/folio/colegio)', placeholder: 'Tomo 42, Folio 187 — CPACF', requerido: true, ayuda: 'Ej: Tomo 42, Folio 187 — CPACF' },
  { key: 'domicilio', label: 'Domicilio legal', placeholder: 'Av. Corrientes 1234, Piso 5 Of. B, CABA', requerido: true },
  { key: 'telefono', label: 'Teléfono', placeholder: '+54 11 4321-5678', requerido: true },
  { key: 'email', label: 'Email del estudio', placeholder: 'contacto@estudio.com', requerido: true },
  { key: 'jurisdiccion', label: 'Jurisdicción principal', placeholder: 'Ciudad Autónoma de Buenos Aires', requerido: true },
  { key: 'fueroPrincipal', label: 'Fuero principal', placeholder: 'Civil y Comercial', requerido: true, ayuda: 'Ej: Civil y Comercial, Laboral, Penal, Contencioso Administrativo' },
  { key: 'estiloRedaccion', label: 'Estilo de redacción', placeholder: 'Formal, técnico. Evitar coloquialismos. Primera persona del plural.', requerido: false, tipo: 'textarea', ayuda: 'Indicá el tono y estilo que el asistente debe usar en los escritos.' },
  { key: 'pieFirma', label: 'Pie de firma', placeholder: 'Dra. María García\nAbogada — CPACF T° 42 F° 187', requerido: false, tipo: 'textarea', ayuda: 'Texto que aparecerá al pie de cada documento generado.' },
]

export function DatosEstudio() {
  const { estudio, saveEstudio, setPasoActivo, completarPaso } = useRoadmap()
  const [form, setForm] = useState<Partial<Estudio>>({})
  const [guardado, setGuardado] = useState(false)

  useEffect(() => {
    setForm(estudio)
  }, [estudio])

  const camposRequeridos = CAMPOS.filter(c => c.requerido)
  const completo = camposRequeridos.every(c => !!(form[c.key] as string)?.trim())

  const handleChange = (key: keyof Estudio, value: string) => {
    setForm(prev => ({ ...prev, [key]: value }))
    setGuardado(false)
  }

  const handleGuardar = async () => {
    await saveEstudio(form)
    setGuardado(true)
  }

  const handleSiguiente = async () => {
    await saveEstudio(form)
    completarPaso(2)
    setPasoActivo(3)
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-teal/10 border border-teal/25 flex items-center justify-center">
          <Building2 className="w-5 h-5 text-teal" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-text">Datos del estudio</h1>
          <p className="text-sm text-text-dim">Esta información es la identidad que el asistente usará en cada documento.</p>
        </div>
      </div>

      <div className="space-y-4">
        {CAMPOS.map(({ key, label, placeholder, requerido, tipo, ayuda }) => {
          const valor = (form[key] as string) ?? ''
          const esTextarea = tipo === 'textarea'
          const vacio = requerido && !valor.trim()

          return (
            <div key={key}>
              <label className="block text-sm font-medium text-text mb-1.5">
                {label}
                {requerido && <span className="text-teal ml-1">*</span>}
              </label>
              {ayuda && <p className="text-xs text-text-faint mb-1.5">{ayuda}</p>}
              {esTextarea ? (
                <textarea
                  value={valor}
                  onChange={e => handleChange(key, e.target.value)}
                  placeholder={placeholder}
                  rows={3}
                  className={cn(
                    'w-full bg-bg-3 border rounded-lg px-3.5 py-2.5 text-sm text-text placeholder:text-text-faint resize-none transition-colors outline-none focus:border-teal/50 focus:ring-1 focus:ring-teal/20',
                    vacio ? 'border-border' : 'border-border'
                  )}
                />
              ) : (
                <input
                  type="text"
                  value={valor}
                  onChange={e => handleChange(key, e.target.value)}
                  placeholder={placeholder}
                  className="w-full bg-bg-3 border border-border rounded-lg px-3.5 py-2.5 text-sm text-text placeholder:text-text-faint transition-colors outline-none focus:border-teal/50 focus:ring-1 focus:ring-teal/20"
                />
              )}
            </div>
          )
        })}
      </div>

      {/* Guardar parcial */}
      <div className="mt-6 flex justify-end">
        <button
          onClick={handleGuardar}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm text-text-dim border border-border hover:bg-bg-3 hover:text-text transition-colors"
        >
          <Save className="w-3.5 h-3.5" />
          {guardado ? 'Guardado ✓' : 'Guardar borrador'}
        </button>
      </div>

      {!completo && (
        <p className="text-xs text-text-faint text-center mt-4">
          Completá los campos obligatorios (<span className="text-teal">*</span>) para continuar.
        </p>
      )}

      <NavPasos
        paso={2}
        onAnterior={() => setPasoActivo(1)}
        onSiguiente={handleSiguiente}
        deshabilitarSiguiente={!completo}
        labelSiguiente="Guardar y continuar"
      />
    </div>
  )
}
