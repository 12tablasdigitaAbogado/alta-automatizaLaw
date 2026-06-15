import { useState } from 'react'
import { Copy, Check, Edit3 } from 'lucide-react'
import type { Estudio } from '@/types'

interface Props {
  estudio: Estudio
}

function generarBloque(estudio: Estudio, carpeta: string): string {
  return `=== ESTUDIO JURIDICO ===
CARPETA DEL ESTUDIO: ${carpeta}

Estudio: ${estudio.denominacion}
Abogado/a responsable: ${estudio.abogadoResponsable}
Matrícula (tomo y folio / colegio): ${estudio.matricula}
Domicilio: ${estudio.domicilio}
Teléfono / Email: ${estudio.telefono} / ${estudio.email}
Jurisdicción: ${estudio.jurisdiccion}
Fuero principal: ${estudio.fueroPrincipal}
Estilo: ${estudio.estiloRedaccion || 'No especificado'}
Pie de firma: ${estudio.pieFirma || 'No especificado'}

Las skills jurídicas deben:
- Tomar esta identidad para membrete, personería y firma.
- Leer los modelos desde ${carpeta}\\modelos\\<tipo>\\.
- Guardar los borradores en ${carpeta}\\salidas\\<tipo>\\.`
}

export function BloqueInstrucciones({ estudio }: Props) {
  const [carpeta, setCarpeta] = useState(`C:\\Users\\<usuario>\\Desktop\\${estudio.denominacion.replace(/[^a-zA-Z0-9\s]/g, '').toUpperCase()}`)
  const [editandoCarpeta, setEditandoCarpeta] = useState(false)
  const [copiado, setCopiado] = useState(false)

  const bloque = generarBloque(estudio, carpeta)

  const copiar = async () => {
    await navigator.clipboard.writeText(bloque)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
  }

  return (
    <div className="bg-bg-card border border-border rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <div>
          <h3 className="text-sm font-semibold text-text">Instrucciones globales</h3>
          <p className="text-xs text-text-dim mt-0.5">Texto listo para pegar en el contexto del proyecto de Cowork</p>
        </div>
        <button
          onClick={copiar}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            copiado
              ? 'bg-teal/15 text-teal border border-teal/30'
              : 'bg-bg-3 text-text-dim border border-border hover:border-teal/30 hover:text-teal'
          }`}
        >
          {copiado ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          {copiado ? 'Copiado' : 'Copiar'}
        </button>
      </div>

      {/* Carpeta editable */}
      <div className="px-5 py-3 bg-bg-3 border-b border-border flex items-center gap-2">
        <span className="text-xs text-text-faint shrink-0">CARPETA DEL ESTUDIO:</span>
        {editandoCarpeta ? (
          <input
            autoFocus
            value={carpeta}
            onChange={e => setCarpeta(e.target.value)}
            onBlur={() => setEditandoCarpeta(false)}
            onKeyDown={e => e.key === 'Enter' && setEditandoCarpeta(false)}
            className="flex-1 bg-transparent text-xs text-teal outline-none border-b border-teal/40 pb-0.5"
          />
        ) : (
          <button
            onClick={() => setEditandoCarpeta(true)}
            className="flex items-center gap-1.5 group"
          >
            <span className="text-xs text-teal font-mono">{carpeta}</span>
            <Edit3 className="w-3 h-3 text-text-faint group-hover:text-teal transition-colors" />
          </button>
        )}
      </div>

      {/* Bloque de texto */}
      <pre className="px-5 py-4 text-xs text-text-dim font-mono leading-relaxed whitespace-pre-wrap overflow-x-auto">
        {bloque}
      </pre>
    </div>
  )
}
