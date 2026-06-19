# AutomatizaLaw — MVP Onboarding

## Qué es esto
Aplicación web de onboarding para estudios jurídicos que quieren adoptar un asistente de IA (Claude Desktop). El cliente completa un wizard de 6 pasos; al finalizar, un operador humano agenda una reunión de alta y deja el asistente funcionando.

Stack: React 19 + TypeScript + Vite + Tailwind CSS v4 + Supabase (auth, DB, Storage).

---

## Estructura del proyecto

```
src/
  context/
    AuthContext.tsx       — Auth state, signIn/signUp/logout, refreshPerfil()
    RoadmapContext.tsx    — Estado completo del wizard (estudio, docs, config, progreso, alta)
  pages/
    Login.tsx
    cliente/
      RoadmapLayout.tsx           — Shell del wizard (stepper + contenido)
      steps/
        Bienvenida.tsx            — Paso 1
        DatosEstudio.tsx          — Paso 2: identidad del estudio
        ModulosConectores.tsx     — Paso 3: skills (acordeón) + upload de modelos por skill
        ChecklistTecnico.tsx      — Paso 4
        RevisionFinal.tsx         — Paso 5
        AgendarAlta.tsx           — Paso 6: Calendly + detección de booking
    admin/
      ListaClientes.tsx           — Primera columna: nombre del cliente (no del estudio)
      FichaCliente.tsx
      Solicitudes.tsx
      Agenda.tsx                  — Embed de Google Calendar (debe ser público para que todos lo vean)
  components/
    layout/
      TopBarCliente.tsx
      SidebarAdmin.tsx
    roadmap/
      NavPasos.tsx
      PasoIndicador.tsx
    shared/
      CalendarBooking.tsx         — Widget inline de Calendly
  services/
    interfaces.ts                 — Contratos de servicio (TypeScript interfaces)
    supabase.ts                   — Implementación real con Supabase
    mock.ts                       — Implementación mock (no activa)
    index.ts                      — Re-exporta desde supabase.ts (cambiar aquí para mockear)
  types/index.ts
  data/skills.ts                  — Catálogo declarativo de skills (13 skills, 4 bloques)
  lib/
    supabase.ts                   — Cliente Supabase (createClient)
    utils.ts                      — cn(), formatBytes(), LABEL_CARPETA, LABELS_ESTADO_ALTA
```

---

## Base de datos Supabase

**Proyecto:** `ddxqnwbzluqikasdhbyv` (nombre: "12-tablas")

### Tablas principales

| Tabla | Descripción | Columnas clave |
|-------|-------------|----------------|
| `perfiles` | 1:1 con `auth.users` | `id` (= auth.uid), `nombre`, `email`, `rol`, `estado`, `estudio_id` |
| `estudios` | Datos del estudio jurídico | `id` (UUID), `perfil_id`, `denominacion`, `abogado_responsable`, `matricula`, `domicilio`, `telefono`, `email_estudio`, `estilo_redaccion`, `pie_firma`, `contexto` (jsonb) |
| `documentos` | Archivos modelo subidos | `id` (UUID), `estudio_id`, `carpeta` (text), `nombre`, `tamano`, `fecha`, `storage_path` |
| `configuracion_modulos` | Skills activas | `estudio_id`, `modulos` (jsonb array de SkillId), `conectores` (jsonb — columna legacy, ya no se usa) |
| `checklist_tecnico` | Checks técnicos del cliente | `estudio_id`, `claude_desktop`, `plan_activo`, `google_workspace`, `buena_internet`, `disponibilidad_reunion` |
| `progreso_roadmap` | Progreso calculado y cacheado | `estudio_id`, `pasos` (jsonb), `porcentaje`, `identidad_completa`, `tiene_documentos`, `checklist_completo`, `desbloqueado` |
| `altas` | Reuniones de alta agendadas | `id`, `estudio_id`, `fecha`, `hora_inicio`, `hora_fin`, `link_meet`, `estado`, `notas` |

### Convenciones de columnas

- DB usa snake_case; TypeScript usa camelCase — hay mappers (`rowToEstudio`, `rowToDocumento`, etc.) en `supabase.ts`
- `configuracion_modulos.modulos` es el array de skillIds (la columna `conectores` existe en DB pero ya no se lee ni escribe)
- `checklist_tecnico`: `claude_desktop`, `plan_activo`, `google_workspace`, `buena_internet`, `disponibilidad_reunion`
- `estudios.contexto` es jsonb — existe en DB pero ya no se usa en el wizard actual

### RLS (Row Level Security)

Todas las tablas tienen RLS habilitado. El patrón estándar es:

```sql
-- Helper function
create function get_estudio_id() returns uuid as $$
  select estudio_id from perfiles where id = auth.uid()
$$ language sql stable security definer;

-- Política típica
create policy "cliente_su_tabla" on nombre_tabla
  using (estudio_id = get_estudio_id());
```

**Problema conocido — chicken-and-egg en estudios:**
Cuando un cliente nuevo crea su estudio, `perfiles.estudio_id` es NULL, así que `get_estudio_id()` devuelve NULL y el INSERT falla con 403. **Solución:** función SECURITY DEFINER `crear_estudio_inicial` que hace el INSERT en `estudios` + UPDATE en `perfiles.estudio_id` atómicamente:

```sql
create function crear_estudio_inicial(p_denominacion text, ...) returns uuid
language plpgsql security definer as $$
declare v_id uuid;
begin
  insert into estudios (denominacion, ..., perfil_id)
  values (p_denominacion, ..., auth.uid())
  returning id into v_id;
  update perfiles set estudio_id = v_id where id = auth.uid();
  return v_id;
end;
$$;
```

El frontend llama: `supabase.rpc('crear_estudio_inicial', { p_denominacion: ..., ... })`

### Storage

- Bucket activo: `modelos` (privado, 10 MB por archivo, acepta pdf/doc/docx/txt)
- Bucket legacy: `documentos` (privado, existe en DB pero ya no se usa en el código — no borrar por si tiene archivos históricos)
- Path: `{estudioId}/{carpeta}/{docId}-{nombre}`
- Los archivos se suben **en el momento en que el cliente los selecciona** (no al dar Continuar)
- Capacidad estimada: 13 skills × 1 modelo × 200 clientes ≈ 300–900 MB → free tier (1 GB) ajustado; Pro ($25/mes, 100 GB) recomendado para escalar

### Columnas en DB no usadas en el frontend

- `estudios.jurisdiccion` y `estudios.fuero_principal` — existen en la tabla pero no se leen ni escriben desde el wizard actual
- `configuracion_modulos.conectores` — legacy, siempre vacío, no se toca
- `estudios.contexto` (jsonb) — existe pero el wizard ya no lo usa

---

## Capa de servicios

**Interfaces en `services/interfaces.ts`** — contratos TypeScript puros.

**Implementaciones:**
- `services/supabase.ts` — producción (activa)
- `services/mock.ts` — datos estáticos en memoria
- Para cambiar: editar la línea de re-export en `services/index.ts`

**Servicios clave:**

### `estudioService.saveEstudio(estudioId, data)`
- `estudioId === ''` → nuevo cliente → llama `rpc('crear_estudio_inicial')` → retorna nuevo UUID
- `estudioId !== ''` → cliente existente → `UPDATE estudios`
- **Retorna el estudio ID efectivo** (siempre string, nunca void)

### `progresoService.recalcularProgreso(estudioId)`
Hace **5 queries en paralelo** a `estudios`, `documentos`, `checklist_tecnico`, `configuracion_modulos` y `progreso_roadmap`. Calcula flags localmente y hace UPSERT en `progreso_roadmap`. Siempre retorna un `ProgresoRoadmap` válido aunque el UPSERT falle.

**Fórmula de `desbloqueado`:** `identidadCompleta && checklistCompleto`
(los modelos ya no bloquean el agendamiento — si faltan, se avisa pero se puede continuar)

**`pasosBase`:** `[1, 2, 3, 4, 5, 6]` — 6 pasos, porcentaje sobre 6.

### `altaService.reservarAlta(estudioId, fecha, horaOLink)`
- `fecha` puede ser `''` (cuando viene de Calendly, solo guardamos la URI)
- `horaOLink` puede ser la Calendly event URI — se guarda en `notas`

---

## RoadmapContext

Estado central del wizard. Carga todo en paralelo al montar (`useEffect` sobre `activeEstudioId`).

**`activeEstudioId`** — estado local separado del auth state. Razón: cuando un cliente nuevo crea su estudio, `usuario.estudioId` no se actualiza hasta que llamamos `refreshPerfil()`. El sync ocurre vía `useEffect` sobre `usuario?.estudioId`.

**Carga inicial usa `recalcularProgreso`**, no `getProgreso`, para evitar progreso cacheado obsoleto.

**`marcarAltaAgendada(calendlyUri)`:**
1. Llama `altaService.reservarAlta`
2. Actualiza estado local `alta`
3. Llama `completarPaso(6)`

---

## Wizard — 6 pasos

| Paso | Componente | Datos guardados |
|------|-----------|-----------------|
| 1 | Bienvenida | — |
| 2 | DatosEstudio | `estudios` (identidad) |
| 3 | ModulosConectores | `configuracion_modulos` + `documentos` + Storage |
| 4 | ChecklistTecnico | `checklist_tecnico` |
| 5 | RevisionFinal | marca paso 5 completo |
| 6 | AgendarAlta | `altas` (vía Calendly) |

**Paso 3 — Skills y modelos:**
- Todas las skills siempre activas (no seleccionables)
- Acordeón por skill, todos cerrados por defecto
- Cada skill muestra: número (círculo morado), nombre, descripción, ícono de estado
  - `CheckCircle2` verde (`text-success`) = tiene al menos 1 archivo subido, o no requiere modelo
  - `Clock` ámbar = modelo esperado pero aún sin archivo
- Al expandir: zona de upload del modelo de la skill
- Si hay skills con modelo sin subir al dar Continuar → popup de advertencia (renderizado con `createPortal` para evitar que el `backdrop-blur` del header sticky lo descentre)
- Al guardar: `saveConfiguracion({ skillIds: SKILLS.map(s => s.id) })`

**Lógica de estado de skill (`ModulosConectores.tsx`):**
```tsx
const modelo = skill.modelos[0] ?? null
const docs = modelo ? documentos.filter(d => d.carpeta === modelo.carpeta) : []
const tieneArchivo = !modelo || docs.length > 0  // verde si: sin modelo requerido O tiene ≥1 archivo
```
El popup de advertencia filtra: `skill.modelos[0]` existe y `docs.length === 0`.

**Desbloqueo del paso 6 (AgendarAlta):** `progreso.desbloqueado` requiere:
- `identidadCompleta`: los 6 campos obligatorios de `estudios` no vacíos
- `checklistCompleto`: los 5 checks de `checklist_tecnico` en true

**Modelos faltantes:** no bloquean, pero `RevisionFinal` muestra advertencia amarilla con link al paso 3.

---

## Skills — catálogo (13 skills, 4 bloques)

`src/data/skills.ts` exporta `SKILLS` — array ordenado para mostrar en UI. El orden está definido por `SKILL_ORDER` al final del archivo.

### Orden de presentación y necesidad de modelo

| # | Skill | ID | Modelo |
|---|-------|----|--------|
| 1 | Triage de Consultas | `triage-consultas` | No |
| 2 | Contrato de Honorarios | `contrato-honorarios` | Obligatorio |
| 3 | Respuesta a Clientes | `respuesta-clientes` | Opcional |
| 4 | Telegrama / Carta Documento | `telegrama-cd` | Obligatorio |
| 5 | Jurisdicción y Competencia | `jurisdiccion-competencia` | No |
| 6 | Liquidación de Rubros | `liquidacion-rubros` | Opcional |
| 7 | Demanda Laboral | `demanda-laboral` | Obligatorio |
| 8 | Escritos de Trámite | `escritos-tramite` | Obligatorio |
| 9 | Análisis de Contestación | `analisis-contestacion` | No |
| 10 | Preparación Testimonial | `preparacion-testimonial` | No |
| 11 | Impugnación Pericial | `impugnacion-pericial` | Obligatorio |
| 12 | Alegato | `alegato` | Opcional |
| 13 | Investigación Jurídica | `investigacion-juridica` | No |

**Carpetas en Storage (bucket `modelos`):**
- `telegramas`, `demandas`, `escritos-tramite`, `liquidaciones`
- `impugnaciones`, `alegatos`, `respuestas-clientes`, `honorarios`

**Modelo opcional:** `obligatorio: false, minArchivos: 0` → aparece en el popup de advertencia si no tiene archivo (igual que obligatorio), pero no bloquea el wizard.

**Sin modelo:** `modelos: []` → muestra siempre ícono verde; el acordeón dice "Esta skill no requiere modelo de documento."

> **TODO pendiente:** cargar archivos modelo por defecto en Supabase Storage (bucket público) y agregar las URLs en el campo `modeloDefault` de cada `ModeloRequerido` en `skills.ts`. Cuando estén disponibles, aparecerá un botón "Descargar modelo de ejemplo" en la zona de upload.

---

## Sistema de colores (`src/index.css`)

| Variable | Valor | Uso |
|----------|-------|-----|
| `--color-teal` | `#b07ef5` | Acento principal (morado claro): botones, bordes activos, iconos |
| `--color-teal-hover` | `#c49bf7` | Hover de elementos con teal |
| `--color-teal-soft` | `#8b3ee5` | Variante oscura del morado |
| `--color-purple` | `#8b3ee5` | Alias del morado oscuro |
| `--color-purple-light` | `#b07ef5` | Alias del morado claro |
| `--color-success` | `#00e0cf` | Verde: estados completados, progress bars, checkmarks |
| `--color-coral` | `#c97264` | Errores y alertas rojas |

**Regla de uso:**
- `teal-*` → elementos interactivos/activos (botones, acordeón abierto, selección)
- `success` → estados de completado (paso completo en stepper, progress bar, checklist ✓)
- `coral` → errores y alertas bloqueantes

**Tamaños de texto:** bumpeados en `@theme` (~1px por nivel). `text-sm` = 15px, `text-xs` = 13px, `text-base` = 17px.

---

## CalendarBooking (Calendly)

**Problema de montaje:** Calendly auto-inicializa al cargar el script, pero cuando el componente se monta después de que el script ya cargó (SPA), el widget no aparece.

**Solución:** usar `window.Calendly.initInlineWidget()` manualmente con un `useRef` limpiando `innerHTML` antes de inicializar.

**Detección de booking:** escuchar `postMessage` desde Calendly:
```tsx
if (e.data?.event === 'calendly.event_scheduled') {
  const uri = e.data?.payload?.event?.uri as string
  marcarAltaAgendada(uri)
}
```

**Limitación:** no tenemos fecha/hora del turno en el frontend. La URI del evento se guarda en `altas.notas`. Para mostrar fecha y hora se necesita webhook Calendly → n8n/Edge Function → Supabase UPDATE en `altas`.

**Agenda admin (`Agenda.tsx`):** embed de Google Calendar vía `VITE_GOOGLE_CALENDAR_EMBED_URL`. Para que todos los operadores vean los eventos, el calendario debe estar marcado como **público** en Google Calendar → Configuración → Permisos de acceso.

---

## Tipos importantes

```typescript
type SkillId =
  | 'telegrama-cd' | 'demanda-laboral' | 'escritos-tramite'
  | 'liquidacion-rubros' | 'analisis-contestacion' | 'preparacion-testimonial'
  | 'impugnacion-pericial' | 'alegato' | 'triage-consultas'
  | 'jurisdiccion-competencia' | 'respuesta-clientes' | 'investigacion-juridica'
  | 'contrato-honorarios'

interface ConfiguracionModulos {
  skillIds: SkillId[]   // conectores eliminados del producto
}

interface ProgresoRoadmap {
  usuarioId: string
  pasos: Record<number, 'pendiente' | 'en-progreso' | 'completo'>
  porcentaje: number
  identidadCompleta: boolean
  tieneDocumentos: boolean      // informativo, ya no bloquea desbloqueado
  checklistCompleto: boolean
  desbloqueado: boolean         // identidadCompleta && checklistCompleto
}
```

---

## Convenciones de código

- No agregar comentarios salvo cuando el WHY no es obvio
- IDs de documentos: `crypto.randomUUID()` — la columna `documentos.id` es tipo UUID en Postgres
- Errores de Supabase: `if (error) throw new Error(error.message)`
- Tailwind v4: sin `tailwind.config.js`, todo en `src/index.css` con `@theme`
- Los conectores (Google Drive, Calendar) fueron eliminados del producto completamente (front + back). La columna `conectores` queda en DB como legacy sin uso.

---

## Issues conocidos

1. **403 en UPSERTs de `progreso_roadmap` / `checklist_tecnico`:** ocurre a veces desde el lado cliente, causa no definitivamente identificada. El progreso se calcula localmente en el cliente así que el UX no se rompe, pero el cache en DB puede quedar desactualizado. **Mitigación:** el operador siempre recalcula al abrir `FichaCliente` o `ListaClientes` (ver abajo), lo que actualiza el cache desde el lado del operador donde las políticas RLS funcionan sin problemas.

2. **Fecha/hora del turno de Calendly:** la URI del evento se guarda en `altas.notas`. Para mostrar fecha y hora en la UI se necesita un webhook Calendly → n8n/Edge Function → Supabase UPDATE en `altas`.

3. **Modelos por defecto:** campo `modeloDefault` definido en `ModeloRequerido` pero sin URLs aún. Cargar archivos en Supabase Storage y completar el campo en `skills.ts`.

---

## Progreso en la vista admin

**Problema:** `ListaClientes` y `FichaCliente` leían el progreso cacheado del join con `progreso_roadmap`, que podía estar desactualizado si el UPSERT del cliente falló.

**Solución implementada:**
- `FichaCliente`: al cargar, llama `progresoService.recalcularProgreso(estudio.id)` y reemplaza el progreso cacheado con el valor real. El operador tiene RLS `operador_todo_progreso` (ALL) así que el UPSERT siempre funciona desde este lado.
- `ListaClientes`: primero muestra la lista con datos cacheados (respuesta rápida), luego recalcula todos los clientes en background con `Promise.all` y actualiza los porcentajes en pantalla sin bloquear la UI.

---

## Estado del backend (verificado 2026-06-18)

**Tablas:** todas presentes con RLS habilitado ✅

**Funciones:**
- `crear_estudio_inicial` — INSERT estudio + UPDATE perfiles.estudio_id atómico (SECURITY DEFINER) ✅
- `get_estudio_id` — helper RLS para el cliente ✅
- `get_rol` — helper RLS para distinguir cliente/operador ✅
- `handle_new_user` — trigger que crea el perfil al registrarse ✅
- `set_updated_at` — trigger para updated_at automático ✅

**Políticas RLS:** cliente + operador en todas las tablas ✅

**Migraciones aplicadas:**
- `fix_progreso_pasos_default_6_steps` — corrige el default de `progreso_roadmap.pasos` de 7 a 6 pasos
