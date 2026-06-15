import { ArrowLeft, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  paso: number
  totalPasos?: number
  onAnterior?: () => void
  onSiguiente?: () => void
  labelSiguiente?: string
  deshabilitarSiguiente?: boolean
  ocultarSiguiente?: boolean
}

export function NavPasos({
  paso,
  totalPasos = 7,
  onAnterior,
  onSiguiente,
  labelSiguiente = 'Continuar',
  deshabilitarSiguiente = false,
  ocultarSiguiente = false,
}: Props) {
  return (
    <div className="flex items-center justify-between pt-8 mt-8 border-t border-border">
      <button
        onClick={onAnterior}
        disabled={paso <= 1}
        className={cn(
          'flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors',
          paso <= 1
            ? 'text-text-faint cursor-not-allowed'
            : 'text-text-dim hover:text-text hover:bg-bg-3'
        )}
      >
        <ArrowLeft className="w-4 h-4" />
        Anterior
      </button>

      <span className="text-sm text-text-dim">
        {paso} de {totalPasos}
      </span>

      {!ocultarSiguiente && (
        <button
          onClick={onSiguiente}
          disabled={deshabilitarSiguiente}
          className={cn(
            'flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all',
            deshabilitarSiguiente
              ? 'bg-bg-3 text-text-faint cursor-not-allowed border border-border'
              : 'bg-teal text-bg hover:bg-teal-hover'
          )}
        >
          {labelSiguiente}
          <ArrowRight className="w-4 h-4" />
        </button>
      )}
    </div>
  )
}
