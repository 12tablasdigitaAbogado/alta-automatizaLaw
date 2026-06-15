# AutomatizaLaw — MVP Onboarding

## Qué es esto
Aplicación web de onboarding para estudios jurídicos que quieren adoptar un asistente de IA (Claude Desktop). El cliente completa un wizard de 7 pasos; al finalizar, un operador humano agenda una reunión de alta y deja el asistente funcionando.

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
      RoadmapLayout.tsx           — Shell del wizard (sidebar pasos + contenido)
      steps/
        Bienvenida.tsx            — Paso 1
        DatosEstudio.tsx          — Paso 2: identidad del estudio
        ModulosConectores.tsx     — Paso 3: skills + contexto inline
        CargaModelos.tsx          — Paso 4: upload de documentos modelo
        RevisionFinal.tsx         — Paso 5
        ChecklistTecnico.tsx      — Paso 6
        AgendarAlta.tsx           — Paso 7: Calendly + detección de booking
    admin/
      ListaClientes.tsx
      FichaCliente.tsx
      Solicitudes.tsx
      Agenda.tsx
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
  data/skills.ts                  — Catálogo declarativo de skills con campos de contexto
  lib/
    supabase.ts                   — Cliente Supabase (createClient)
    utils.ts                      — cn() helper
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
| `configuracion_modulos` | Skills y conectores elegidos | `estudio_id`, `modulos` (jsonb array de SkillId), `conectores` (jsonb array) |
| `checklist_tecnico` | Checks técnicos del cliente | `estudio_id`, `claude_desktop`, `plan_activo`, `google_workspace`, `buena_internet`, `disponibilidad_reunion` |
| `progreso_roadmap` | Progreso calculado y cacheado | `estudio_id`, `pasos` (jsonb), `porcentaje`, `identidad_completa`, `tiene_documentos`, `checklist_completo`, `desbloqueado` |
| `altas` | Reuniones de alta agendadas | `id`, `estudio_id`, `fecha`, `hora_inicio`, `hora_fin`, `link_meet`, `estado`, `notas` |

### Convenciones de columnas

- DB usa snake_case; TypeScript usa camelCase — hay mappers (`rowToEstudio`, `rowToDocumento`, etc.) en `supabase.ts`
- `configuracion_modulos.modulos` es el array de skillIds (no `skills` ni `skill_ids`)
- `checklist_tecnico`: `claude_desktop`, `plan_activo`, `google_workspace`, `buena_internet`, `disponibilidad_reunion`
- `estudios.contexto` es jsonb (`Record<string, string>`) — campos extra que el asistente necesita por skill

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

- Bucket: `modelos` (privado, RLS habilitado)
- Path: `{estudioId}/{carpeta}/{docId}-{nombre}`
- Política SELECT/INSERT/DELETE en `storage.objects` usando `auth.uid()` vía join a `estudios`

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

### `progresoService.recalcularProgreso(estudioId)` / `computeYGuardar()`
La función privada `computeYGuardar(estudioId)` hace **5 queries en paralelo** a:
1. `estudios` (identidad + contexto en una sola query — ver nota abajo)
2. `documentos`
3. `checklist_tecnico`
4. `configuracion_modulos`
5. `progreso_roadmap` (para leer `pasos` actuales)

Luego calcula las flags de progreso localmente y hace UPSERT en `progreso_roadmap`. Siempre retorna un `ProgresoRoadmap` válido aunque el UPSERT falle.

> **Bug corregido:** antes había 6 queries porque `estudios` se consultaba dos veces (una para identidad, otra para `contexto`). Ahora es una sola query con `select('denominacion, abogado_responsable, ..., contexto')`.

### `altaService.reservarAlta(estudioId, fecha, horaOLink)`
- `fecha` puede ser `''` (cuando viene de Calendly, solo guardamos la URI)
- `horaOLink` puede ser la Calendly event URI — se guarda en `notas`

---

## RoadmapContext

Estado central del wizard. Carga todo en paralelo al montar (`useEffect` sobre `activeEstudioId`).

**`activeEstudioId`** — estado local separado del auth state. Razón: cuando un cliente nuevo crea su estudio, `usuario.estudioId` no se actualiza hasta que llamamos `refreshPerfil()` (que hace `supabase.auth.getUser()` + re-fetch de perfil). El sync ocurre vía `useEffect` sobre `usuario?.estudioId`.

**Carga inicial usa `recalcularProgreso`**, no `getProgreso`, para evitar progreso cacheado obsoleto de sesiones anteriores.

**`marcarAltaAgendada(calendlyUri)`:**
1. Llama `altaService.reservarAlta`
2. Actualiza estado local `alta`
3. Llama `completarPaso(7)` (local + DB async)

---

## Wizard — 7 pasos

| Paso | Componente | Datos guardados |
|------|-----------|-----------------|
| 1 | Bienvenida | — |
| 2 | DatosEstudio | `estudios` (identidad) |
| 3 | ModulosConectores | `configuracion_modulos` + `estudios.contexto` |
| 4 | CargaModelos | `documentos` + Storage `modelos` |
| 5 | RevisionFinal | marca paso 5 completo |
| 6 | ChecklistTecnico | `checklist_tecnico` |
| 7 | AgendarAlta | `altas` (vía Calendly) |

**Desbloqueo del paso 7 (AgendarAlta):** `progreso.desbloqueado` requiere:
- `identidadCompleta`: los 6 campos obligatorios de `estudios` no vacíos
- `tieneDocumentos`: al menos 1 fila en `documentos`
- `checklistCompleto`: los 5 checks de `checklist_tecnico` en true

---

## CalendarBooking (Calendly)

**Problema de montaje:** Calendly auto-inicializa al cargar el script, pero cuando el componente se monta *después* de que el script ya cargó (navegación SPA o refresh), el widget no aparece.

**Solución:** usar `window.Calendly.initInlineWidget()` manualmente con un `useRef`:

```tsx
const init = () => {
  if (ref.current) {
    ref.current.innerHTML = ''  // evita iframes duplicados
    window.Calendly?.initInlineWidget({ url: CALENDLY_URL, parentElement: ref.current })
  }
}
if (window.Calendly) init()
else { /* crear/escuchar script */ }
```

**Detección de booking:** escuchar `postMessage` desde Calendly:

```tsx
window.addEventListener('message', (e: MessageEvent) => {
  if (e.data?.event === 'calendly.event_scheduled') {
    const uri = e.data?.payload?.event?.uri as string
    marcarAltaAgendada(uri)
  }
})
```

**Limitación:** no tenemos fecha/hora del turno en el frontend. Para obtenerlos se necesita llamar a la Calendly API server-side (Edge Function o n8n webhook) usando la `uri` del evento.

---

## Skills — catálogo declarativo

`src/data/skills.ts` exporta `SKILLS_DISPONIBLES` — array de objetos con:
- `id: SkillId`
- `nombre`, `descripcion`, `icono`
- `carpetas: string[]` — subcarpetas de Drive donde se guardan los modelos
- `contexto: CampoContexto[]` — campos de texto que el cliente debe completar (aparecen inline en el paso 3)

`carpetasDeSkills(skillIds)` — función utilitaria que devuelve las carpetas requeridas según las skills seleccionadas.

Los campos de contexto se renderizan en `ModulosConectores.tsx` con deduplicación: si dos skills comparten un campo (mismo `id`), aparece una sola vez.

---

## Tipos importantes

```typescript
type SkillId = 'alta-caso' | 'telegrama-cd' | 'liquidacion' | 'demanda-laboral' | 'respuesta-telegrama'
type ConectorId = 'google-drive' | 'google-calendar' | 'gmail'  // gmail visible pero no activo en UI

interface ProgresoRoadmap {
  usuarioId: string
  pasos: Record<number, 'pendiente' | 'en-progreso' | 'completo'>
  porcentaje: number
  identidadCompleta: boolean
  tieneDocumentos: boolean
  checklistCompleto: boolean
  desbloqueado: boolean   // true cuando los 3 anteriores son true
}
```

---

## Convenciones de código

- No agregar comentarios salvo cuando el WHY no es obvio
- No crear archivos de documentación durante el desarrollo (usar contexto de conversación)
- IDs de documentos: `crypto.randomUUID()` — la columna `documentos.id` es tipo UUID en Postgres
- Errores de Supabase: `if (error) throw new Error(error.message)` — el contexto los captura implícitamente
- Tailwind v4: sin `tailwind.config.js`, todo en `src/index.css` con `@theme`

---

## Issues conocidos

1. **403 en UPSERTs de `progreso_roadmap` / `checklist_tecnico`:** ocurre a veces, causa no definitivamente identificada. El progreso se calcula localmente en `computeYGuardar` así que el UX no se rompe, pero el cache en DB puede estar desactualizado.

2. **Fecha/hora del turno de Calendly:** la URI del evento (`calendly.event_scheduled`) se guarda en `altas.notas`. Para mostrar fecha y hora en la UI se necesita un webhook Calendly → n8n/Edge Function → Supabase UPDATE en `altas`.

3. **Gmail en conectores:** `gmail` está en el tipo `ConectorId` pero removido de `CONECTORES_DISPONIBLES` en `ModulosConectores.tsx` para no mostrarlo en la UI.
