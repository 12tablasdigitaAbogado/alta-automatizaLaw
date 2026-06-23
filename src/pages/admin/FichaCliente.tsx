import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  ArrowLeft, Copy, Check, CheckSquare, Square,
  CalendarDays, FolderOpen, FileText, Download
} from 'lucide-react'
import { zip, strToU8 } from 'fflate'
import type { ClienteResumen } from '@/types'
import { usuarioService, progresoService } from '@/services'
import { supabase } from '@/lib/supabase'
import { carpetasDeSkills } from '@/data/skills'
import { LABELS_ESTADO_ALTA, LABEL_CARPETA, cn } from '@/lib/utils'

const RUNBOOK: { id: string; label: string }[] = [
  { id: 'drive-estructura', label: 'Crear estructura de carpetas en Drive del estudio' },
  { id: 'drive-modelos', label: 'Subir modelos del cliente a sus carpetas de Drive' },
  { id: 'perfil-md', label: 'Crear archivo perfil_estudio.md en la raíz del Drive' },
  { id: 'plugin-instalar', label: 'Instalar el plugin de skills jurídicas en Claude Desktop' },
  { id: 'skill-validar', label: 'Probar una skill para validar que lee los modelos del Drive' },
]

function generarContextoMd(data: ClienteResumen): string {
  const { estudio, contexto } = data

  const lineasContexto = Object.entries(contexto)
    .filter(([, v]) => v?.trim())
    .map(([k, v]) => `- ${k}: ${v}`)
    .join('\n')

  return `# ${estudio.denominacion || 'Estudio'}

## Identidad
- Abogado/a responsable: ${estudio.abogadoResponsable || '—'}
- Matrícula: ${estudio.matricula || '—'}
- Domicilio: ${estudio.domicilio || '—'}
- Teléfono: ${estudio.telefono || '—'}
- Email: ${estudio.email || '—'}
${estudio.estiloRedaccion ? `\n## Estilo de redacción\n${estudio.estiloRedaccion}` : ''}
${estudio.pieFirma ? `\n## Pie de firma\n${estudio.pieFirma}` : ''}
${lineasContexto ? `\n## Contexto laboral\n${lineasContexto}` : ''}
`.trim()
}

export default function FichaCliente() {
  const { id } = useParams<{ id: string }>()
  const [data, setData] = useState<ClienteResumen | null>(null)
  const [loading, setLoading] = useState(true)
  const [runbook, setRunbook] = useState<Record<string, boolean>>({})
  const [copiado, setCopiado] = useState(false)
  const [descargando, setDescargando] = useState(false)

  useEffect(() => {
    if (!id) return
    usuarioService.listClientes().then(async clientes => {
      const cliente = clientes.find(c => c.usuario.id === id)
      if (cliente?.estudio.id) {
        const progreso = await progresoService.recalcularProgreso(cliente.estudio.id)
        setData({ ...cliente, progreso })
      } else {
        setData(cliente ?? null)
      }
      setLoading(false)
    })
  }, [id])

  const toggleRunbook = (itemId: string) =>
    setRunbook(prev => ({ ...prev, [itemId]: !prev[itemId] }))

  const runbookCompletados = RUNBOOK.filter(r => runbook[r.id]).length

  const copiarContexto = () => {
    if (!data) return
    navigator.clipboard.writeText(generarContextoMd(data))
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
  }

  const descargarZip = async () => {
    if (!data || descargando) return
    setDescargando(true)
    try {
      const nombre = data.estudio.denominacion || 'estudio'
      const archivos: Record<string, Uint8Array> = {
        [`${nombre}/perfil_estudio.md`]: strToU8(generarContextoMd(data)),
      }

      await Promise.all(data.documentos.map(async doc => {
        const storagePath = doc.storagePath ?? `${doc.estudioId}/${doc.carpeta}/${doc.id}-${doc.nombre}`
        const { data: blob, error } = await supabase.storage.from('modelos').download(storagePath)
        if (error || !blob) return
        archivos[`${nombre}/modelos/${doc.carpeta}/${doc.nombre}`] = new Uint8Array(await blob.arrayBuffer())
      }))

      zip(archivos, (err, bytes) => {
        if (err) return
        const url = URL.createObjectURL(new Blob([bytes], { type: 'application/zip' }))
        const a = document.createElement('a')
        a.href = url
        a.download = `${nombre}.zip`
        a.click()
        URL.revokeObjectURL(url)
      })
    } finally {
      setDescargando(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-2 border-teal/30 border-t-teal rounded-full animate-spin" />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="p-8 text-center text-text-dim">
        <p>Cliente no encontrado.</p>
        <Link to="/admin/clientes" className="text-teal text-sm mt-2 inline-block hover:underline">
          Volver a la lista
        </Link>
      </div>
    )
  }

  const { usuario, estudio, configuracion, documentos, progreso, alta } = data
  const carpetas = carpetasDeSkills(configuracion.skillIds)

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-5xl">
      {/* Back */}
      <Link to="/admin/clientes" className="flex items-center gap-1.5 text-sm text-text-dim hover:text-text mb-6 transition-colors w-fit">
        <ArrowLeft className="w-4 h-4" />
        Volver a clientes
      </Link>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-6 md:mb-8">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-text">{estudio.denominacion || 'Sin nombre'}</h1>
          <p className="text-text-dim mt-1 text-sm">{estudio.abogadoResponsable} · {usuario.email}</p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className={cn(
            'text-xs px-3 py-1.5 rounded-full border font-medium',
            alta.estado === 'agendada' ? 'text-teal bg-teal/8 border-teal/20' :
            alta.estado === 'realizada' ? 'text-text-dim bg-bg-3 border-border' :
            'text-text-faint bg-bg-3 border-border'
          )}>
            {LABELS_ESTADO_ALTA[alta.estado]}
          </span>
          <div className="flex items-center gap-2 bg-bg-card border border-border px-3 py-1.5 rounded-full">
            <div className="w-16 h-1.5 bg-bg rounded-full overflow-hidden">
              <div className="h-full bg-success rounded-full" style={{ width: `${progreso.porcentaje}%` }} />
            </div>
            <span className="text-xs text-teal font-medium">{progreso.porcentaje}%</span>
          </div>
        </div>
      </div>

      {/* Reunión agendada */}
      {alta.estado === 'agendada' && (
        <div className="flex items-center gap-3 bg-teal/5 border border-teal/20 rounded-2xl p-4 mb-6">
          <CalendarDays className="w-5 h-5 text-teal shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-teal">Alta agendada</p>
            <p className="text-sm text-text-dim mt-0.5">Reunión confirmada vía Calendly</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_300px] gap-5">
        {/* Columna principal */}
        <div className="space-y-5">

          {/* 1. perfil_estudio.md */}
          <div className="bg-bg-card border border-border rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-text">perfil_estudio.md</h3>
              <button
                onClick={copiarContexto}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border',
                  copiado
                    ? 'text-teal bg-teal/8 border-teal/20'
                    : 'text-text-dim bg-bg-3 border-border hover:text-teal hover:border-teal/30'
                )}
              >
                {copiado ? <><Check className="w-3.5 h-3.5" /> Copiado</> : <><Copy className="w-3.5 h-3.5" /> Copiar</>}
              </button>
            </div>

            <pre className="text-xs text-text-dim bg-bg-3 rounded-lg p-4 overflow-auto max-h-64 whitespace-pre-wrap leading-relaxed border border-border/50">
              {generarContextoMd(data)}
            </pre>
          </div>

          {/* 2. Estructura de Drive */}
          <div className="bg-bg-card border border-border rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <FolderOpen className="w-4 h-4 text-text-dim" />
              <h3 className="text-sm font-semibold text-text">Estructura Drive a crear</h3>
            </div>
            <pre className="text-xs text-text-dim bg-bg-3 rounded-lg p-4 leading-relaxed border border-border/50 font-mono">
{`${estudio.denominacion || '<ESTUDIO>'}/
├── perfil_estudio.md
├── modelos/
│   ├── telegramas/
│   ├── demandas/
│   ├── escritos/
│   ├── liquidaciones/
│   ├── impugnaciones/
│   ├── honorarios/
│   └── comunicaciones/        (opcional)
├── datos/
│   └── escalas-cct/
└── clientes/                  (vacía — una subcarpeta por cliente)`}
            </pre>
          </div>

          {/* 3. Mapa modelos → carpeta */}
          <div className="bg-bg-card border border-border rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-text-dim" />
                <h3 className="text-sm font-semibold text-text">Modelos → carpeta Drive</h3>
              </div>
              <button
                onClick={descargarZip}
                disabled={descargando}
                className="flex items-center gap-1.5 text-xs text-text-dim border border-border px-3 py-1.5 rounded-lg hover:border-teal/30 hover:text-teal transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {descargando
                  ? <div className="w-3.5 h-3.5 border border-text-dim border-t-teal rounded-full animate-spin" />
                  : <Download className="w-3.5 h-3.5" />
                }
                {descargando ? 'Descargando...' : 'ZIP'}
              </button>
            </div>
            {documentos.length === 0 ? (
              <p className="text-sm text-text-faint">El cliente no subió modelos aún.</p>
            ) : (
              <div className="space-y-3">
                {carpetas.map(c => {
                  const docs = documentos.filter(d => d.carpeta === c.carpeta)
                  if (docs.length === 0) return null
                  return (
                    <div key={c.carpeta}>
                      <p className="text-sm font-medium text-text-dim mb-1.5">
                        modelos/<span className="text-teal">{c.carpeta}/</span>
                        <span className="text-text-faint ml-1 font-normal">
                          ({LABEL_CARPETA[c.carpeta] ?? c.carpeta})
                        </span>
                      </p>
                      <div className="space-y-1 pl-3">
                        {docs.map(doc => (
                          <div key={doc.id} className="flex items-center gap-2 text-sm text-text-dim">
                            <span className="text-teal/50">·</span>
                            {doc.nombre}
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

        </div>

        {/* Columna runbook */}
        <div>
          <div className="bg-bg-card border border-border rounded-2xl p-5 xl:sticky xl:top-8">
            <h3 className="text-sm font-semibold text-text mb-1">Runbook del alta</h3>
            <p className="text-sm text-text-dim mb-4">Tildá cada paso durante la reunión.</p>

            <div className="flex items-center gap-2 mb-4">
              <div className="flex-1 h-1.5 bg-bg rounded-full overflow-hidden">
                <div
                  className="h-full bg-success rounded-full transition-all duration-300"
                  style={{ width: `${(runbookCompletados / RUNBOOK.length) * 100}%` }}
                />
              </div>
              <span className="text-sm text-text-dim tabular-nums">{runbookCompletados}/{RUNBOOK.length}</span>
            </div>

            <div className="space-y-2">
              {RUNBOOK.map(item => (
                <button
                  key={item.id}
                  onClick={() => toggleRunbook(item.id)}
                  className={cn(
                    'w-full flex items-start gap-3 p-3 rounded-xl text-left transition-all',
                    runbook[item.id] ? 'bg-teal/5' : 'hover:bg-bg-3'
                  )}
                >
                  {runbook[item.id] ? (
                    <CheckSquare className="w-4 h-4 text-teal shrink-0 mt-0.5" />
                  ) : (
                    <Square className="w-4 h-4 text-text-faint shrink-0 mt-0.5" />
                  )}
                  <span className={cn(
                    'text-sm leading-relaxed',
                    runbook[item.id] ? 'text-text-dim line-through' : 'text-text'
                  )}>
                    {item.label}
                  </span>
                </button>
              ))}
            </div>

            {runbookCompletados === RUNBOOK.length && (
              <div className="mt-4 bg-teal/8 border border-teal/20 rounded-xl p-3 text-center">
                <p className="text-sm text-teal font-medium">¡Alta completada!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
