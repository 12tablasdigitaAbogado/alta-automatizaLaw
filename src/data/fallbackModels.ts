// Modelos por defecto que 12 Tablas provee cuando el estudio no sube los suyos.
// Los archivos viven en src/assets/<carpeta>/<nombre>.docx y Vite los sirve con
// URLs hasheadas al hacer el build.

// keys ejemplo: "/src/assets/telegramas/telegrama-art-80.docx"
const raw = import.meta.glob('../assets/*/*.{docx,doc,pdf,txt,xlsx,xls}', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>

export interface FallbackModel {
  nombre: string   // filename original
  label: string    // filename sin extensión, para mostrar
  url: string      // URL servida por Vite
  carpeta: string  // la carpeta padre → coincide con skills.ts
}

const porCarpeta: Record<string, FallbackModel[]> = {}

for (const [path, url] of Object.entries(raw)) {
  const partes = path.split('/')
  const nombre = partes[partes.length - 1]
  const carpeta = partes[partes.length - 2]
  if (!porCarpeta[carpeta]) porCarpeta[carpeta] = []
  porCarpeta[carpeta].push({
    nombre,
    label: nombre.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' '),
    url,
    carpeta,
  })
}

// Orden alfabético para que sea estable.
for (const c of Object.keys(porCarpeta)) {
  porCarpeta[c].sort((a, b) => a.nombre.localeCompare(b.nombre))
}

export function fallbacksDeCarpeta(carpeta: string): FallbackModel[] {
  return porCarpeta[carpeta] ?? []
}

export function tieneFallbacks(carpeta: string): boolean {
  return (porCarpeta[carpeta]?.length ?? 0) > 0
}

export const FALLBACKS_POR_CARPETA = porCarpeta
