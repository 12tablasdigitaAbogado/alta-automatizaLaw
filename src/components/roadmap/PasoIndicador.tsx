import { Check, Lock } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { EstadoPaso } from '@/types'

interface Props {
  numero: number
  label: string
  estado: EstadoPaso
  activo: boolean
  bloqueado: boolean
  onClick: () => void
}

export function PasoIndicador({ numero, label, estado, activo, bloqueado, onClick }: Props) {
  const completo = estado === 'completo'

  return (
    <button
      onClick={onClick}
      disabled={bloqueado}
      className={cn(
        'flex flex-col items-center gap-1 px-2 py-1 rounded-lg transition-all shrink-0',
        activo && 'bg-teal/8',
        !activo && !bloqueado && 'hover:bg-bg-3 cursor-pointer',
        bloqueado && 'opacity-40 cursor-not-allowed'
      )}
      title={bloqueado ? 'Completá el setup para desbloquear' : label}
    >
      <div className={cn(
        'w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-all',
        completo && 'bg-teal text-bg',
        activo && !completo && 'bg-teal/15 text-teal border border-teal/40',
        !activo && !completo && !bloqueado && 'bg-bg-3 text-text-dim border border-border',
        bloqueado && numero === 7 && 'bg-bg-3 border border-border'
      )}>
        {bloqueado && numero === 7 ? (
          <Lock className="w-3 h-3 text-text-faint" />
        ) : completo ? (
          <Check className="w-3.5 h-3.5" />
        ) : (
          numero
        )}
      </div>
      <span className={cn(
        'text-xs font-medium hidden sm:block',
        activo ? 'text-teal' : completo ? 'text-text-dim' : 'text-text-faint'
      )}>
        {label}
      </span>
    </button>
  )
}
