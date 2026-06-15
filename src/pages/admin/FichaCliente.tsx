import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  ArrowLeft, Copy, Check, CheckSquare, Square,
  CalendarDays, FolderOpen, FileText, Puzzle, Download, ExternalLink
} from 'lucide-react'
import type { ClienteResumen } from '@/types'
import { usuarioService } from '@/services'
import { SKILL_MAP, carpetasDeSkills } from '@/data/skills'
import { LABELS_CONECTOR, LABELS_ESTADO_ALTA, LABEL_CARPETA, formatFecha, cn } from '@/lib/utils'

const RUNBOOK: { id: string; label: string }[] = [
  { id: 'drive-estructura', label: 'Crear estructura de carpetas en Drive del estudio' },
  { id: 'drive-modelos', label: 'Subir modelos del cliente a sus carpetas de Drive' },
  { id: 'contexto-md', label: 'Crear archivo .estudio/contexto.md con el ID de carpeta Drive' },
  { id: 'plugin-instalar', label: 'Instalar el plugin de skills jurídicas en Claude Desktop' },
  { id: 'drive-conectar', label: 'Conectar el conector de Google Drive en Cowork' },
  { id: 'skill-validar', label: 'Probar una skill para validar que lee los modelos del Drive' },
]

function generarContextoMd(data: ClienteResumen, driveId: string): string {
  const { estudio, configuracion, contexto } = data
  const skillNames = configuracion.skillIds
    .map(id => SKILL_MAP[id]?.nombre ?? id)
    .join(', ')

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
## Skills activas
${skillNames || '—'}

## Carpeta Drive
ID: ${driveId || '<ID_CARPETA_DRIVE>'}
Ruta: https://drive.google.com/drive/folders/${driveId || '<ID>'}
`.trim()
}

export default function FichaCliente() {
  const { id } = useParams<{ id: string }>()
  const [data, setData] = useState<ClienteResumen | null>(null)
  const [loading, setLoading] = useState(true)
  const [runbook, setRunbook] = useState<Record<string, boolean>>({})
  const [driveId, setDriveId] = useState('')
  const [copiado, setCopiado] = useState(false)

  useEffect(() => {
    if (!id) return
    usuarioService.listClientes().then(clientes => {
      const cliente = clientes.find(c => c.usuario.id === id)
      setData(cliente ?? null)
      setLoading(false)
    })
  }, [id])

  const toggleRunbook = (itemId: string) =>
    setRunbook(prev => ({ ...prev, [itemId]: !prev[itemId] }))

  const runbookCompletados = RUNBOOK.filter(r => runbook[r.id]).length

  const copiarContexto = () => {
    if (!data) return
    navigator.clipboard.writeText(generarContextoMd(data, driveId))
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
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
  const skillIds = configuracion.skillIds
  const carpetas = carpetasDeSkills(skillIds)

  // Árbol de Drive derivado de las skills
  const subcarpetasModelos = carpetas.map(c => c.carpeta)
  const subcarpetasSalidas = subcarpetasModelos.filter(c => c !== 'intake')

  return (
    <div className="p-8 max-w-5xl">
      {/* Back */}
      <Link to="/admin/clientes" className="flex items-center gap-1.5 text-sm text-text-dim hover:text-text mb-6 transition-colors w-fit">
        <ArrowLeft className="w-4 h-4" />
        Volver a clientes
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-text">{estudio.denominacion || 'Sin nombre'}</h1>
          <p className="text-text-dim mt-1">{estudio.abogadoResponsable} · {usuario.email}</p>
        </div>
        <div className="flex items-center gap-3">
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
              <div className="h-full bg-teal rounded-full" style={{ width: `${progreso.porcentaje}%` }} />
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
            <p className="text-xs text-text-dim mt-0.5">
              {alta.fecha && formatFecha(alta.fecha)} · {alta.horaInicio}–{alta.horaFin}
            </p>
          </div>
          {alta.linkMeet && (
            <a href={alta.linkMeet} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs text-teal border border-teal/30 px-3 py-1.5 rounded-lg hover:bg-teal/8 transition-colors">
              <ExternalLink className="w-3.5 h-3.5" />
              Abrir Meet
            </a>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-5">
        {/* Columna principal */}
        <div className="space-y-5">

          {/* 1. contexto.md */}
          <div className="bg-bg-card border border-border rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-text">contexto.md</h3>
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

            {/* ID de carpeta Drive editable */}
            <div className="mb-3">
              <label className="text-xs text-text-faint mb-1 block">ID de carpeta Drive del estudio</label>
              <input
                type="text"
                value={driveId}
                onChange={e => setDriveId(e.target.value)}
                placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms"
                className="w-full bg-bg-3 border border-border rounded-lg px-3 py-2 text-xs text-text placeholder:text-text-faint outline-none focus:border-teal/50 transition-colors font-mono"
              />
            </div>

            <pre className="text-xs text-text-dim bg-bg-3 rounded-lg p-4 overflow-auto max-h-64 whitespace-pre-wrap leading-relaxed border border-border/50">
              {generarContextoMd(data, driveId)}
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
├── .estudio/
│   └── contexto.md
├── modelos/
${subcarpetasModelos.map((c, i) => `│   ${i < subcarpetasModelos.length - 1 ? '├' : '└'}── ${c}/`).join('\n')}
└── salidas/
${subcarpetasSalidas.map((c, i) => `    ${i < subcarpetasSalidas.length - 1 ? '├' : '└'}── ${c}/`).join('\n')}`}
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
                onClick={() => alert('TODO Fase 2: descargar ZIP con estructura de carpetas derivada de skills')}
                className="flex items-center gap-1.5 text-xs text-text-dim border border-border px-3 py-1.5 rounded-lg hover:border-teal/30 hover:text-teal transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                ZIP
              </button>
            </div>
            {documentos.length === 0 ? (
              <p className="text-xs text-text-faint">El cliente no subió modelos aún.</p>
            ) : (
              <div className="space-y-3">
                {carpetas.map(c => {
                  const docs = documentos.filter(d => d.carpeta === c.carpeta)
                  if (docs.length === 0) return null
                  return (
                    <div key={c.carpeta}>
                      <p className="text-xs font-medium text-text-dim mb-1.5">
                        modelos/<span className="text-teal">{c.carpeta}/</span>
                        <span className="text-text-faint ml-1 font-normal">
                          ({LABEL_CARPETA[c.carpeta] ?? c.carpeta})
                        </span>
                      </p>
                      <div className="space-y-1 pl-3">
                        {docs.map(doc => (
                          <div key={doc.id} className="flex items-center gap-2 text-xs text-text-dim">
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

          {/* 4. Plugin a instalar */}
          <div className="bg-bg-card border border-border rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Puzzle className="w-4 h-4 text-text-dim" />
              <h3 className="text-sm font-semibold text-text">Plugin a instalar</h3>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-text-faint mb-1.5">Skills a activar</p>
                {skillIds.length === 0 ? (
                  <p className="text-xs text-text-faint italic">Sin skills seleccionadas</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {skillIds.map(id => (
                      <span key={id} className="text-xs px-2.5 py-1 bg-teal/8 text-teal rounded-full border border-teal/15">
                        {SKILL_MAP[id]?.nombre ?? id}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              {configuracion.conectores.length > 0 && (
                <div>
                  <p className="text-xs text-text-faint mb-1.5">Conectores a habilitar</p>
                  <div className="flex flex-wrap gap-2">
                    {configuracion.conectores.map(c => (
                      <span key={c} className="text-xs px-2.5 py-1 bg-purple/8 text-purple-light rounded-full border border-purple/15">
                        {LABELS_CONECTOR[c]}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              <p className="text-xs text-text-faint pt-1 border-t border-border">
                El plugin es estático — el mismo archivo para todos los estudios. Lo que varía es la carpeta Drive conectada.
              </p>
            </div>
          </div>
        </div>

        {/* Columna runbook */}
        <div>
          <div className="bg-bg-card border border-border rounded-2xl p-5 sticky top-8">
            <h3 className="text-sm font-semibold text-text mb-1">Runbook del alta</h3>
            <p className="text-xs text-text-dim mb-4">Tildá cada paso durante la reunión.</p>

            <div className="flex items-center gap-2 mb-4">
              <div className="flex-1 h-1.5 bg-bg rounded-full overflow-hidden">
                <div
                  className="h-full bg-teal rounded-full transition-all duration-300"
                  style={{ width: `${(runbookCompletados / RUNBOOK.length) * 100}%` }}
                />
              </div>
              <span className="text-xs text-text-dim tabular-nums">{runbookCompletados}/{RUNBOOK.length}</span>
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
                    'text-xs leading-relaxed',
                    runbook[item.id] ? 'text-text-dim line-through' : 'text-text'
                  )}>
                    {item.label}
                  </span>
                </button>
              ))}
            </div>

            {runbookCompletados === RUNBOOK.length && (
              <div className="mt-4 bg-teal/8 border border-teal/20 rounded-xl p-3 text-center">
                <p className="text-xs text-teal font-medium">¡Alta completada!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
