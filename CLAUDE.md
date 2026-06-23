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
Hace **6 queries en paralelo** a `estudios`, `documentos`, `checklist_tecnico`, `configuracion_modulos`, `progreso_roadmap` y `altas`. Calcula flags localmente y hace UPSERT en `progreso_roadmap`. Siempre retorna un `ProgresoRoadmap` válido aunque el UPSERT falle.

**Auto-cura de pasos** — los pasos NO se confían del cache `progreso_roadmap.pasos`; se derivan del estado real de la DB. Esto hace que el progreso sea idempotente y resista race conditions entre `marcarPasoCompleto` (async, sin await) y la recarga del context:

| Paso | Derivado de |
|------|-------------|
| 1 | Existe el row en `estudios` |
| 2 | `identidadCompleta` (6 campos obligatorios del estudio no vacíos) |
| 3 | Hay `skillIds` configurados o algún `documento` cargado |
| 4 | `checklistCompleto` (5 checks en true) |
| 5 | Sin derivación — se marca manualmente desde `RevisionFinal` |
| 6 | Existe un row en `altas` con estado `agendada` o `realizada` |

Además limpia el `pasos[7]` legacy (residuo del bug donde `marcarAltaAgendada` marcaba paso 7 en vez de 6).

**Fórmula de `desbloqueado`:** `identidadCompleta && checklistCompleto`
(los modelos ya no bloquean el agendamiento — si faltan, se avisa pero se puede continuar)

**`pasosBase`:** `[1, 2, 3, 4, 5, 6]` — 6 pasos, porcentaje sobre 6.

### `altaService.reservarAlta(estudioId, fecha, horaOLink)`
- `fecha` puede ser `''` (cuando viene de Calendly, solo guardamos la URI)
- `horaOLink` puede ser la Calendly event URI — se guarda en `notas`

---

## AuthContext

Estado de auth (`usuario`, `loading`, `signIn`, `signUp`, `logout`, `refreshPerfil`). Bootstrap con `supabase.auth.getSession()` + `onAuthStateChange`.

**Timeout de 5s sobre `getSession()`**: si la sesión está colgada por refresh token expirado o lock interno de `supabase-js` (bug conocido tras inactividad larga), se fuerza `signOut()` y se baja `loading` → el user ve el Login en vez de spinner infinito.

**`loading` solo baja después de tener perfil**: el evento `INITIAL_SESSION` de `onAuthStateChange` actúa como red de seguridad, pero solo dispara `finish()` después de `fetchPerfil`. Sin esto, había un flash de Login al refrescar (loading=false con usuario=null mientras el perfil se resolvía).

**Flag `settled`**: previene que `init()` y `INITIAL_SESSION` ejecuten `setLoading(false)` dos veces.

---

## RoadmapContext

Estado central del wizard. Carga todo en paralelo al montar (`useEffect` sobre `activeEstudioId`).

**`activeEstudioId`** — estado local separado del auth state. Razón: cuando un cliente nuevo crea su estudio, `usuario.estudioId` no se actualiza hasta que llamamos `refreshPerfil()`. El sync ocurre vía `useEffect` sobre `usuario?.estudioId`.

**Carga inicial usa `recalcularProgreso`**, no `getProgreso`, para evitar progreso cacheado obsoleto.

**`pasoActivo` nunca retrocede**: el `useEffect` que recarga datos cuando cambia `activeEstudioId` solo bumpea `pasoActivo` hacia adelante (`setPasoActivo(prev => Math.max(prev, ultimo + 1))`). Importante porque al crear el primer estudio se dispara una recarga y, si no fuera por esto, te tiraría de vuelta al paso anterior.

**`completarPaso(n)` tolera `progreso === null`**: si todavía no hay row en `progreso_roadmap` (caso usuario nuevo en Bienvenida), construye un objeto inicial vacío y marca el paso. Sin esto, el check del paso 1 no se mostraba hasta el siguiente reload.

**`marcarAltaAgendada(calendlyUri)`:**
1. Llama `altaService.reservarAlta`
2. Actualiza estado local `alta`
3. Llama `completarPaso(6)` (no 7 — el bug histórico era ese)

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

**Autofill de Chrome en inputs dark**: en `src/index.css` hay una regla para `:-webkit-autofill` + `:autofill` que pinta el fondo con `#1a1a20` (color de `bg-bg-3`, el wrapper estándar de inputs) y el texto con `#e8e8f0` vía `-webkit-text-fill-color`. Sin esto el autofill de Chrome dejaba un rectángulo azul/gris feo dentro de los inputs.

---

## Agendamiento del cliente (paso 6 — GHL Booking + Form)

Reemplazamos Calendly por **GoHighLevel (LeadConnector)**. Dos iframes embebidos:

### `components/shared/GhlBooking.tsx`
- Calendar ID: `MCiMeiA5XZrpfOh7XCSX` — **placeholder de prueba, reemplazar por el calendario real del operador para producción**
- Carga el script `https://link.msgsndr.com/js/form_embed.js` una sola vez (guard contra duplicados)
- El `iframe.id` se genera con formato `<BOOKING_ID>_<timestamp>` — `form_embed.js` busca ese patrón para auto-resizear vía postMessage `highlevel.setHeight`
- `minHeight: 1100` como piso por si el resize tarda

### `components/shared/GhlForm.tsx`
- Form ID: `r6H5PT5aGzfofYhDjDRz` — **placeholder ("Lista de espera Agentes"), reemplazar por el form real del cliente**
- Render con todos los `data-*` attrs que espera `form_embed.js`
- Se monta dentro de la rama `yaAgendado` de `AgendarAlta.tsx`, debajo del bloque "¡Reunión agendada!"

### Detección de booking — postMessage

GHL widget "Neo" **no** documenta API pública, pero al confirmar el turno el iframe postea al parent:

```js
e.data = ["msgsndr-booking-complete", { fingerprint: "<id>", calendarId: "<id>" }]
e.origin = "https://api.leadconnectorhq.com"
```

`AgendarAlta.tsx` escucha ese array exacto, filtra por origen GHL (`leadconnectorhq.com` / `msgsndr.com` / `gohighlevel.com`), arma un JSON con `fingerprint`+`calendarId`+`ts` y llama `marcarAltaAgendada(ref)`. El JSON se guarda en `altas.notas`. Hay un `useRef` (`bookingFiredRef`) para evitar doble INSERT si el evento se dispara dos veces.

> **Nota importante:** el widget también hace un POST `bookingCompleted` a `backend.leadconnectorhq.com/calendars/booking-analytics/event/submit` desde **adentro del iframe** — ese request no es visible desde la página padre por cross-origin. Solo el `msgsndr-booking-complete` postMessage llega al parent. Si ese mensaje cambia o desaparece en futuras versiones del widget Neo, el plan B es **webhook GHL "Appointment Booked" → Supabase Edge Function** que haga el UPSERT en `altas` matcheando por contacto/email.

### `altaService.reservarAlta(estudioId, fecha, bookingRef)`

Reescrito tras descubrir que `hora_inicio` es `time` en DB y rechazaba strings arbitrarios:
- Si `bookingRef` empieza con `http` → `link_meet`
- Si no, va a **`notas`** (no a `hora_inicio`)
- `fecha` puede ser `''` (caso GHL: no tenemos fecha en el frontend)

### `altaService.getAlta`

Usa `.maybeSingle()` (antes `.single()` devolvía 406 cuando aún no había alta).

### Agenda admin (`Agenda.tsx`)

Embed de Google Calendar vía `VITE_GOOGLE_CALENDAR_EMBED_URL`. **Reemplazar por el calendario real del operador para producción** — debe estar marcado como **público** en Google Calendar → Configuración → Permisos de acceso para que todos los operadores vean los eventos.

---

## ⚠ Pendiente para producción — IDs y URLs reales

Hoy quedan 3 placeholders de prueba que hay que cambiar antes de salir a producción:

| Qué | Dónde | Valor actual (placeholder) | Acción |
|-----|-------|----------------------------|--------|
| Calendario real del **operador** (vista admin) | `.env` → `VITE_GOOGLE_CALENDAR_EMBED_URL`, consumido en `pages/admin/Agenda.tsx` | URL de calendario de prueba | Reemplazar por el embed del Google Calendar real del equipo de operadores, marcado como **público** |
| Calendario real del **cliente** (paso 6 — booking GHL) | `components/shared/GhlBooking.tsx` → constante `BOOKING_ID` | `MCiMeiA5XZrpfOh7XCSX` | Reemplazar por el ID del calendario real en GHL. Verificar que el listener de `msgsndr-booking-complete` siga llegando con el nuevo calendario |
| Formulario real del **cliente** (paso 6 — luego del booking) | `components/shared/GhlForm.tsx` → constante `FORM_ID` | `r6H5PT5aGzfofYhDjDRz` ("Lista de espera Agentes" — form de prueba) | Reemplazar por el form real del cliente. Si el form cambia de tamaño, ajustar el `height: 2400` del iframe |

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

2. **Fecha/hora del turno de GHL:** el frontend solo recibe `fingerprint`+`calendarId` (no fecha/hora). Esos datos se guardan en `altas.notas` como JSON. Para mostrar fecha y hora en la UI se necesita un webhook GHL "Appointment Booked" → Edge Function → UPDATE en `altas`.

3. **Modelos por defecto:** campo `modeloDefault` definido en `ModeloRequerido` pero sin URLs aún. Cargar archivos en Supabase Storage y completar el campo en `skills.ts`.

---

## Tablas admin — paginación y conteos

`ListaClientes.tsx` y `Solicitudes.tsx` usan **paginación client-side** con `PAGE_SIZE = 20`. Se traen todas las filas y se cortan en memoria con `.slice(desde, hasta)`. No hay paginación server-side (`.range()`) todavía — cuando crezca el volumen, migrar a server-side.

**Conteos:**
- `ListaClientes`: muestra `"X clientes activos"` en el header, y si hay búsqueda agrega `"· N en la búsqueda"`.
- `Solicitudes`: muestra los 3 estados con sus colores (warning/teal/coral) en el header, y un badge con el count al lado de cada tab. Los counts se traen con `select('id', { count: 'exact', head: true })` (3 queries paralelas, sin descargar rows) y se actualizan en cliente al aprobar/rechazar.

**Estructura visual de filas** (ambas tablas): grid de columnas fijas en vez de `flex justify-between`, para que filas con nombres/emails de largo distinto queden alineadas verticalmente entre sí. Cualquier columna fija que tenga texto variable usa `tabular-nums`.

---

## Progreso en la vista admin

**Problema:** `ListaClientes` y `FichaCliente` leían el progreso cacheado del join con `progreso_roadmap`, que podía estar desactualizado si el UPSERT del cliente falló.

**Solución implementada:**
- `FichaCliente`: al cargar, llama `progresoService.recalcularProgreso(estudio.id)` y reemplaza el progreso cacheado con el valor real. El operador tiene RLS `operador_todo_progreso` (ALL) así que el UPSERT siempre funciona desde este lado.
- `ListaClientes`: primero muestra la lista con datos cacheados (respuesta rápida), luego recalcula todos los clientes en background con `Promise.all` y actualiza los porcentajes en pantalla sin bloquear la UI.

---

## Estado del backend (verificado 2026-06-21)

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
- `handle_new_user_auto_activo` — el trigger `handle_new_user` ahora inserta `perfiles.estado = 'activo'` (antes `'pendiente'`). Los nuevos registros entran ya aprobados y van directo al wizard. La pantalla `PendingScreen` de `RoadmapLayout.tsx` solo bloquea ahora a usuarios con estado `'rechazado'`. La tab `Solicitudes` sigue existiendo por si en el futuro se vuelve a habilitar aprobación manual

**Wipe 2026-06-21:** se borraron todos los registros de prueba (auth.users, perfiles, estudios, documentos, configuracion_modulos, checklist_tecnico, progreso_roadmap, altas) excepto el admin `jorgeduje4@gmail.com` (id `43a8b629-4e16-453f-9990-18cc22b4afd8`). Storage `modelos` y `documentos` quedaron limpios (los `.emptyFolderPlaceholder` que crea el dashboard de Supabase también fueron eliminados).

---

## ⚠ Pendiente importante — Revisar estructura de skills y carpetas

Una vez que estén definidas **todas** las skills finales y sus modelos requeridos (no las 13 actuales si cambian), hay que revisar y posiblemente reestructurar:

1. **`src/data/skills.ts`** — el catálogo. Validar IDs, agrupaciones, qué skills llevan modelo (obligatorio/opcional) y cuáles no.
2. **Carpetas en Storage** (`bucket: modelos`) — los nombres de carpeta están hardcodeados en `skills.ts` (`telegramas`, `demandas`, etc.). Si cambian las skills, hay que coordinar con `documentos.carpeta` (text en DB) y revisar que `recalcularProgreso` siga derivando paso 3 correctamente (`docList.length > 0` o `skillIds.length > 0`).
3. **Archivos modelo por defecto (`modeloDefault`)** — campo definido en `ModeloRequerido` pero todavía sin URLs. Cuando se decidan los modelos canónicos, subir a Storage público y completar las URLs en `skills.ts`.
4. **Mapping skill ↔ carpeta** — hoy es 1 skill → 1 modelo → 1 carpeta. Si alguna skill termina necesitando múltiples modelos, hay que extender `ModeloRequerido[]` y la lógica de progreso/checks en `ModulosConectores.tsx` y `recalcularProgreso`.
5. **Bucket `documentos` (legacy)** — sigue existiendo pero sin uso. Decidir si se elimina del proyecto Supabase o se mantiene por compatibilidad histórica.

Esto está pendiente hasta que el negocio cierre el catálogo definitivo de skills/modelos para producción.
