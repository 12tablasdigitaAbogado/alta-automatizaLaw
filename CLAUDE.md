# AutomatizaLaw — MVP Onboarding

## Qué es esto
Aplicación web de onboarding para estudios jurídicos que quieren adoptar un asistente de IA (Claude Desktop). El cliente completa un wizard de 6 pasos; al finalizar, un operador humano agenda una reunión de alta y deja el asistente funcionando.

Stack: React 19 + TypeScript + Vite + Tailwind CSS v4 + Supabase (auth, DB, Storage).

---

## Estructura del proyecto

```
src/
  context/
    AuthContext.tsx            — Auth state, signIn/signUp/logout, refreshPerfil()
    RoadmapContext.tsx         — Estado del roadmap externo (6 pasos)
    AltaEstudioContext.tsx     — Estado del wizard de alta (9 instancias) + autosave
  pages/
    Login.tsx
    cliente/
      RoadmapLayout.tsx        — Shell del roadmap externo (stepper + contenido)
      AltaEstudio.tsx          — Wizard de 9 instancias (default: página standalone /alta-estudio;
                                  export AltaEstudioEmbedded para usarlo dentro del paso 2)
      steps/
        Bienvenida.tsx            — Paso 1
        DatosEstudio.tsx          — LEGACY (huérfano — no lo usa nadie desde que paso 2 pasó al wizard)
        ModulosConectores.tsx     — Paso 3: skills read-only agrupadas por etapa (sin uploads)
        ChecklistTecnico.tsx      — Paso 4
        RevisionFinal.tsx         — Paso 5
        AgendarAlta.tsx           — Paso 6: GHL + detección de booking
    admin/
      ListaClientes.tsx
      FichaCliente.tsx
      Solicitudes.tsx
      Agenda.tsx                  — Embed de Google Calendar (público)
  components/
    layout/
      TopBarCliente.tsx
      SidebarAdmin.tsx
    roadmap/
      NavPasos.tsx
      PasoIndicador.tsx
    shared/
      GhlBooking.tsx / GhlForm.tsx
    altaEstudio/
      Field.tsx                   — Renderer polimórfico del wizard de alta
                                    (text/textarea/number/boolean/radio/multi/select/
                                     repeatable/file + sugerencia confirmable)
  services/
    interfaces.ts                 — Contratos + AltaEstudioService
    supabase.ts                   — Impl real (incluye altaEstudioService)
    mock.ts                       — Impl mock (no activa)
    index.ts                      — Re-exporta desde supabase.ts
  types/index.ts                  — Tipos globales + Abogado, Jurisdiccion, RespuestasAlta.
                                    SkillId se re-exporta desde data/skills.ts (fuente única).
  data/
    skills.ts                     — Catálogo declarativo (21 skills, 5 etapas)
    altaEstudio.ts                — Schema del wizard de alta (9 instancias, campos, showIf,
                                    sugerencias por jurisdicción, mapeo carpetas)
    fallbackModels.ts             — Modelos por defecto descubiertos vía import.meta.glob
                                    en src/assets/<carpeta>/*
  lib/
    supabase.ts                   — Cliente Supabase
    utils.ts                      — cn(), formatBytes(), LABEL_CARPETA, LABELS_ESTADO_ALTA
    altaEstudio/
      generator.ts                — Genera perfil_estudio.md + manifiesto de carpetas
                                    + mapeo archivos → carpetas del estudio
  assets/
    telegramas/ demandas/ escritos/ impugnaciones/
    honorarios/ liquidaciones/ comunicaciones/
                                  — Modelos por defecto que se ofrecen cuando el estudio
                                    no sube los suyos. Servidos por Vite con URLs hasheadas.
```

---

## Base de datos Supabase

**Proyecto:** `ddxqnwbzluqikasdhbyv` (nombre: "12-tablas")

### Tablas principales

| Tabla | Descripción | Columnas clave |
|-------|-------------|----------------|
| `perfiles` | 1:1 con `auth.users` | `id` (= auth.uid), `nombre`, `email`, `rol`, `estado`, `estudio_id` |
| `estudios` | Datos del estudio jurídico | `id` (UUID), `perfil_id`, `denominacion`, `abogado_responsable`*, `matricula`*, `domicilio`, `domicilio_constituido`, `telefono` (celular), `telefono_fijo`, `email_estudio`, `estilo_redaccion`, `pie_firma`, `reglas_competencia_jurisdiccional`, `criterio_conveniencia_jurisdiccional`, `contexto` (jsonb) |
| `abogados` | Equipo del estudio (Instancia 1 del alta) | `id` (UUID), `estudio_id`, `nombre`, `cuit`, `matricula`, `colegio`, `orden` |
| `jurisdicciones` | Jurisdicciones en las que trabaja (Instancia 2) | `id` (UUID), `estudio_id`, `nombre`, `instancia_previa` (text libre), `ofrecimiento_prueba` (text libre), `presentacion_electronica`, `orden` |
| `respuestas_alta` | Payload jsonb para instancias 3-8 | PK `(estudio_id, instancia_id)`, `payload` (jsonb), `updated_at` |
| `documentos` | Archivos modelo subidos (incluye Instancia 9) | `id` (UUID), `estudio_id`, `carpeta` (text), `nombre`, `tamano`, `fecha`, `storage_path` |
| `configuracion_modulos` | Skills activas | `estudio_id`, `modulos` (jsonb array de SkillId), `conectores` (jsonb — columna legacy, ya no se usa) |
| `checklist_tecnico` | Checks técnicos del cliente | `estudio_id`, `claude_desktop`, `plan_activo`, `google_workspace`, `buena_internet`, `disponibilidad_reunion` |
| `progreso_roadmap` | Progreso calculado y cacheado | `estudio_id`, `pasos` (jsonb), `porcentaje`, `identidad_completa`, `tiene_documentos`, `checklist_completo`, `desbloqueado` |
| `altas` | Reuniones de alta agendadas | `id`, `estudio_id`, `fecha`, `hora_inicio`, `hora_fin`, `link_meet`, `estado`, `notas` |

`*` = columnas legacy que ya no se escriben desde el wizard nuevo (identidad de abogados vive ahora en `abogados`).

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
Hace **8 queries en paralelo** a `estudios`, `documentos`, `checklist_tecnico`, `configuracion_modulos`, `progreso_roadmap`, `altas`, `abogados` (count) y `jurisdicciones` (count). Calcula flags localmente y hace UPSERT en `progreso_roadmap`. Siempre retorna un `ProgresoRoadmap` válido aunque el UPSERT falle.

**Auto-cura de pasos** — los pasos NO se confían del cache `progreso_roadmap.pasos`; se derivan del estado real de la DB:

| Paso | Derivado de |
|------|-------------|
| 1 | Existe el row en `estudios` |
| 2 | `identidadCompleta` (ver criterio nuevo abajo) |
| 3 | Hay `skillIds` configurados o algún `documento` cargado |
| 4 | `checklistCompleto` (5 checks en true) |
| 5 | Sin derivación — se marca manualmente desde `RevisionFinal` |
| 6 | Existe un row en `altas` con estado `agendada` o `realizada` |

**Criterio nuevo de `identidadCompleta`** (cambió al integrar el wizard de 9 instancias): `denominacion + domicilio + telefono + email_estudio` del estudio, **más** `count(abogados) ≥ 1` y `count(jurisdicciones) ≥ 1`. Ya no exige las columnas legacy `abogado_responsable` y `matricula` de `estudios` (esos datos ahora viven en la tabla `abogados`).

**Fórmula de `desbloqueado`:** `identidadCompleta && checklistCompleto`
(los modelos NO bloquean el agendamiento — la pantalla de "Completá tu setup" en `AgendarAlta` solo lista identidad + checklist).

**`pasosBase`:** `[1, 2, 3, 4, 5, 6]` — 6 pasos, porcentaje sobre 6.

### `altaEstudioService.{loadAll, saveInstancia}`
Ver sección "Wizard de alta del estudio (paso 2)" más abajo — routing por instancia hacia distintas tablas.

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

## Roadmap externo — 6 pasos

| Paso | Componente | Datos guardados |
|------|-----------|-----------------|
| 1 | Bienvenida | — |
| 2 | **AltaEstudioEmbedded** (wizard de 9 instancias) | `estudios` + `abogados` + `jurisdicciones` + `respuestas_alta` + `documentos` (Instancia 9) |
| 3 | ModulosConectores (informativo) | `configuracion_modulos` (fija skillIds al continuar) |
| 4 | ChecklistTecnico | `checklist_tecnico` |
| 5 | RevisionFinal | marca paso 5 completo |
| 6 | AgendarAlta | `altas` (vía GHL) |

**Paso 2 (wizard de alta):** el paso ya no es un solo formulario de identidad — renderiza el wizard de 9 instancias descrito en la sección siguiente. Al terminar la última instancia se dispara `onFinalizar={() => setPasoActivo(3)}`. `DatosEstudio.tsx` es legacy, no está enrutado ni importado; se puede borrar.

**Paso 3 — Skills (informativo, sin uploads):**
- Lista read-only de las 21 skills agrupadas por etapa (los uploads ya se pidieron en Instancia 9 del paso 2).
- Cada skill: nombre, descripción, y una línea chica: "N modelos cargados" / "Sin modelo del estudio · usa modelo genérico" / "Modelo opcional".
- Banner ámbar arriba solo si faltan modelos obligatorios (`skill.modelos[0].obligatorio && docs.length === 0`), con botón "Volver al alta e Instancia 9" que hace `setPasoActivo(2)`.
- Sin ícono decorativo de header, sin ícono de estado por skill, sin badge "Nueva" — copy limpio.
- Al continuar: `saveConfiguracion({ skillIds: SKILLS.map(s => s.id) })` (persiste las 21 IDs para que `recalcularProgreso` marque paso 3 completo) → `completarPaso(3)` → paso 4.

**Desbloqueo del paso 6 (AgendarAlta):** `progreso.desbloqueado` requiere:
- `identidadCompleta`: nuevo criterio (ver `progresoService`)
- `checklistCompleto`: los 5 checks de `checklist_tecnico` en true

La pantalla de "Completá tu setup" en `AgendarAlta.tsx` solo lista **identidad + checklist técnico** (los modelos ya no se listan como requisito — no bloquean).

---

## Wizard de alta del estudio (paso 2) — 9 instancias

**Fuente de verdad:** `src/data/altaEstudio.ts` — schema declarativo. Cuando llegue el `formulario-alta-estudio.md`, se reemplaza ese archivo y todo lo demás sigue funcionando sin cambios.

**Componentes:**
- `pages/cliente/AltaEstudio.tsx` — dos exports:
  - `default` (página `/alta-estudio`, standalone con sticky header)
  - `AltaEstudioEmbedded` (embebido dentro del paso 2 del roadmap, sin sticky, con botón "Continuar al siguiente paso" en la última instancia)
- `components/altaEstudio/Field.tsx` — renderer polimórfico. Soporta: `text | textarea | number | boolean | radio | multi | select | repeatable | file`. Cada `FieldDef` puede llevar `showIf(ctx)` (condicional). No hay sugerencias por jurisdicción — el abogado completa los campos manualmente.
- `context/AltaEstudioContext.tsx` — estado + autosave. Al montar carga desde Supabase (`altaEstudioService.loadAll`) y usa localStorage como buffer offline y prime de respuesta rápida. Al pasar de instancia (`setInstanciaActiva`) dispara `saveInstancia` de la actual (fire & forget con feedback vía `saving` y `saveError`).
- `lib/altaEstudio/generator.ts` — funciones puras: `generarPerfilEstudio(respuestas)` → markdown; `generarManifiestoCarpetas(respuestas)` → lista de paths; `mapearArchivosACarpetas(archivos)` para el upload final.

**Instancias:**

| # | ID | Guarda en |
|---|----|-----------|
| 1 | `datos-estudio` | `estudios` (identidad + `domicilio_constituido`, `telefono` (celular), `telefono_fijo`, `pie_firma`) + `abogados[]` (delete + insert) |
| 2 | `jurisdiccion-alcance` | `jurisdicciones[]` (delete + insert) + `estudios.reglas_competencia_jurisdiccional` + `estudios.criterio_conveniencia_jurisdiccional` |
| 3 | `mapa-proceso` | `respuestas_alta` payload jsonb |
| 4 | `casos-que-toma` | `respuestas_alta` payload jsonb |
| 5 | `criterios-liquidacion` | `respuestas_alta` payload jsonb |
| 6 | `honorarios` | `respuestas_alta` payload jsonb |
| 7 | `estilo-doctrina` | `respuestas_alta` payload jsonb |
| 8 | `comunicacion-clientes` | `respuestas_alta` payload jsonb |
| 9 | `modelos-plantillas` | files → `documentos` + Storage (bucket `modelos`) vía `documentoService.addDocumento` — **pendiente rediseño más desglosado** |

**Creación del estudio (Instancia 1 sin `estudioId`):** el context detecta `!estudioId && instancia === datos-estudio` y llama `estudioService.saveEstudio('', ...)` (que a su vez llama la RPC `crear_estudio_inicial`) y luego hace un UPDATE post-RPC para columnas nuevas que no pasan por la RPC (`domicilio_constituido`, `telefono_fijo`). Después `refreshPerfil()` para propagar el nuevo `estudioId`.

**Campos por instancia (schema en `src/data/altaEstudio.ts`):**

- **Ins.1 — Datos del estudio:** `denominacion` ("Nombre del estudio"), `domicilio` (real), `domicilioConstituido` (opcional), `telefonoFijo` (opcional), `telefonoCelular` (con ayuda "prefijo sin 0 y número sin 15"), `email`, `cantidadAbogados` (number), `abogados[]` (repeatable: nombre, cuit, matricula, colegio), `pieFirma` (textarea).
- **Ins.2 — Jurisdicción y alcance geográfico:** repeatable `jurisdicciones[]` con `nombre` + `instanciaPrevia` (textarea libre, antes radio + `organismo` — ahora unificado) + `presentacionElectronica` (opcional) + `ofrecimientoPrueba` (textarea libre, antes radio); nivel-instancia `reglasCompetencia` (textarea, obligatorio) y `criterioConveniencia` (textarea, opcional) — ambos aparecen sólo si `jurisdicciones.length > 1` (`showIf`).
- **Ins.3 — Mapa del proceso:** `etapas` (multi, 16 checkboxes desde "Firma pacto honorarios" hasta "Acuerdo conciliatorio en cualquier momento") + `particularidades` (textarea).
- **Ins.4 — Qué casos toma el estudio:** `sectores` (multi: privado/público), `sectoresNoAtender`, `antiguedadMinima` (text libre, opcional), `pisoMontoReclamo` (number, opcional), `consultoOtroAbogado` (textarea con placeholder "Sí · No · Depende"), `otroCriterio` (opcional).
- **Ins.5 — Criterios de liquidación:** `reparacionIntegral` (textarea Sí/No/Depende), `reparacionIntegralCriterio` (opcional), `inconstitucionalidadDerogaciones` (textarea Sí/No/Depende), `preferenciaActualizacion` (opcional), `fechaCalculo` (multi: capital histórico / actualizado presentación), `otroCriterio`.
- **Ins.6 — Honorarios:** `cuotaLitisPorcentaje` (number), `tipoPacto` (multi: pacto cuota litis / contrato honorarios aparte), `condicionParticularPacto` (opcional), `ley27802Postura` (radio: mencionarlo / no mencionarlo / sin preferencia), `otroDato`.
- **Ins.7 — Estilo, doctrina y redacción:** `referenciasDoctrina` (opcional, textarea; PDFs van a Ins.9), `tonoRedaccion` (radio: formal-tradicional / directo), `armadoDemandaPreferencia` (radio: completa / por bloques / sin preferencia, opcional), `otroDato`.
- **Ins.8 — Comunicación con clientes:** `tonoComunicacion` (textarea), `plantillasComunicacion` (radio: sí-cargar / no-usar-estandar), `otroDato`.
- **Ins.9 — Modelos y plantillas:** rediseñada 2026-07 con 9 secciones y ~34 sub-categorías, todas opcionales. Sections agrupadas con nuevo `FieldType='section'` (header + descripción, sin input). Estructura: Demandas · Telegramas/CD · Liquidación · Honorarios · Pericial · Escritos de trámite (11 tipos) · Ofrecimiento de prueba · Alegato y recursos · Otros (escalas CCT, multi-archivo). Cada `fieldId` mapea a una sub-carpeta en `CARPETAS_MODELOS` con paths tipo `modelos/demandas/despido-sin-causa`. **Demandas y Telegramas** tienen un toggle intuitivo arriba (`demandaUsarBaseUnica` / `telegramaUsarBaseUnica`, boolean): si el usuario lo tilda, se muestra un único file field "Modelo base" y se ocultan los per-tipo vía `showIf`; si no, se ocultan el toggle-file base y aparecen los per-tipo. Los flags booleanos se persisten en `respuestas_alta.payload` (el early-return de la Ins.9 en `saveInstancia` fue eliminado — los file fields van a `documentos` vía `documentoService.addDocumento` y los flags no-file caen en el upsert general de `respuestas_alta`).

**Regla de obligatoriedad:** un campo es `obligatorio: true` salvo que el spec del cliente diga "opcional" explícito.

**Sugerencias por jurisdicción:** eliminadas. El abogado carga manualmente todo para cada jurisdicción.

**`instanciaCompleta` (context):** una instancia se considera completada si todos los obligatorios visibles tienen valor **y** (si no hay obligatorios en absoluto) al menos un campo visible tiene valor. Sin este último check, las instancias con puro texto libre (3, 4, 5, 7, 8, 9) aparecían verdes de arranque.

**Progreso del wizard:** se calcula localmente sobre `INSTANCIAS`. El stepper interno marca ✓ verde solo si `instanciaCompleta` da true.

**Ruta standalone `/alta-estudio`:** sigue viva por si el operador o el cliente quieren accederla directo fuera del roadmap. Usa el mismo context y schema.

**Generación del perfil:** el panel final (última instancia) ofrece descargar:
- `<Estudio>-perfil_estudio.md` — el perfil generado a partir de las respuestas (formato heading + secciones por instancia).
- `<Estudio>-carpetas.txt` — manifiesto de la estructura de carpetas del estudio.

**Punto de integración pendiente** (comentado en `generator.ts`): cuando la orquestación remota esté lista, `_puntoIntegracionBackend` debería subir el `.md` a Drive y crear la estructura de carpetas remota. Hoy la generación es local y descargable.

---

## Skills — catálogo (21 skills, 5 etapas)

`src/data/skills.ts` exporta `SKILLS` — array ordenado según `SKILL_ORDER`. El campo `etapa: EtapaId` reemplazó al viejo `bloque: string`. Constante `ETAPAS: Etapa[]` provee los metadatos de cada agrupación.

### Etapas
1. **Antes de tomar el caso** — Ficha de Primera Consulta, Triage, Jurisdicción y Competencia, Instancia Prejudicial, Estrategia de Caso, Contrato de Honorarios
2. **Intimación y armado** — Telegrama / CD, Liquidación de Rubros, Investigación Jurídica, Plazos Procesales
3. **Demanda y trámite** — Demanda Laboral, Nómina Documental, Ofrecimiento de Prueba, Escritos de Trámite, Análisis de Contestación
4. **Prueba y cierre** — Impugnación Pericial, Preparación Testimonial, Alegato, Recurso de Apelación
5. **Transversales** — Respuesta a Clientes, Anonimizador de Documentos

### Modelos y carpetas (bucket `modelos`)
| Carpeta | Skills que la usan | Obligatoriedad efectiva |
|---------|--------------------|-------------------------|
| `telegramas` | Telegrama / CD | Obligatorio |
| `demandas` | Demanda Laboral | Obligatorio |
| `escritos` | Escritos de Trámite, Ofrecimiento de Prueba, Recurso de Apelación, Alegato | Obligatorio (por Escritos de Trámite / Ofrecimiento / Recurso; Alegato aporta opcional) |
| `impugnaciones` | Impugnación Pericial | Obligatorio |
| `honorarios` | Contrato de Honorarios | Obligatorio |
| `comunicaciones` | Respuesta a Clientes | Opcional |
| `escalas-cct` | Liquidación de Rubros | Opcional |

**Nota renames** (aplicado al pasar de 13 → 21 skills): `escritos-tramite` → `escritos` (compartida entre 4 skills), `respuestas-clientes` → `comunicaciones`, `alegatos` → `escritos` (fusionada). Como la DB fue wipeada el 2026-06-21 no hubo migración de datos; si en el futuro hay clientes preexistentes con carpetas viejas hay que armar migración de strings en `documentos.carpeta`.

**Sin modelo (`modelos: []`):** todas las skills nuevas de las etapas 1 y 5 y la mayoría de las transversales. Aparecen en la lista sin bloque de modelo.

`SKILL_MAP`, `skillsPorEtapa(etapaId)` y `carpetasDeSkills(skillIds)` son los helpers exportados.

### Fallback models (`src/data/fallbackModels.ts`)

Descubre automáticamente los archivos que viven en `src/assets/<carpeta>/*` vía `import.meta.glob('../assets/*/*.{docx,doc,pdf,txt,xlsx,xls}', { eager: true, query: '?url', import: 'default' })`. Vite los sirve con URLs hasheadas en el build.

Los nombres de carpeta en `src/assets/` coinciden 1:1 con las carpetas del bucket `modelos`, así que no hace falta ningún mapeo. Helpers: `fallbacksDeCarpeta(carpeta)`, `tieneFallbacks(carpeta)`, `FALLBACKS_POR_CARPETA`.

Se muestran en el paso 3 dentro de un `<details>` colapsable con descargas individuales (cuando decidas volver a incluirlo en algún punto del flujo — hoy el paso 3 es solo informativo).

**Copy:** eliminar toda referencia a "12 Tablas" en texto user-facing (banner, descripciones, manifiesto descargable, etc.). El comentario en `fallbackModels.ts` es dev-only y puede mencionarlo.

> **TODO pendiente:** el campo `modeloDefault` en `ModeloRequerido` quedó sin uso (ya cubierto por el sistema de fallbacks). Se puede eliminar del schema.

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
// SkillId es fuente única en data/skills.ts; types/index.ts hace re-export.
// 21 skills — ver "Skills — catálogo" arriba para el listado y las etapas.

interface Abogado {
  id?: string
  nombre: string
  cuit?: string
  matricula?: string
  colegio?: string
}

interface Jurisdiccion {
  id?: string
  nombre: string
  instanciaPrevia?: 'si' | 'no' | 'no-se'
  organismo?: string
  ofrecimientoPrueba?: 'en-demanda' | 'acto-separado'
}

// Estado del wizard de alta: respuestas por instancia.
type RespuestasAlta = Record<string, Record<string, unknown>>

interface ConfiguracionModulos {
  skillIds: SkillId[]
}

interface ProgresoRoadmap {
  usuarioId: string
  pasos: Record<number, 'pendiente' | 'en-progreso' | 'completo'>
  porcentaje: number
  identidadCompleta: boolean    // ver criterio en progresoService
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

3. **Modelos por defecto:** ya resuelto — viven en `src/assets/<carpeta>/*` y se descubren automáticamente vía `import.meta.glob` en `src/data/fallbackModels.ts`. El campo `modeloDefault` en `ModeloRequerido` quedó sin uso y puede eliminarse.

4. **`DatosEstudio.tsx` legacy:** el componente sigue en el árbol pero no lo usa nadie desde que paso 2 pasa al wizard de 9 instancias. Borrar cuando confirmes que el flujo nuevo cubre todo lo del viejo.

5. **Columnas legacy en `estudios`:** `abogado_responsable` y `matricula` ya no se escriben desde el wizard nuevo (esos datos viven en `abogados`). Todavía se leen en algunos joins de la vista admin (`ListaClientes`, `FichaCliente`) para mostrar "abogado responsable" — habría que migrarlos a leer el primer `abogados` del estudio antes de eliminarlas.

---

## Tablas admin — paginación y conteos

`ListaClientes.tsx` y `Solicitudes.tsx` usan **paginación client-side** con `PAGE_SIZE = 20`. Se traen todas las filas y se cortan en memoria con `.slice(desde, hasta)`. No hay paginación server-side (`.range()`) todavía — cuando crezca el volumen, migrar a server-side.

**Conteos:**
- `ListaClientes`: muestra `"X clientes activos"` en el header, y si hay búsqueda agrega `"· N en la búsqueda"`.
- `Solicitudes`: muestra los 3 estados con sus colores (warning/teal/coral) en el header, y un badge con el count al lado de cada tab. Los counts se traen con `select('id', { count: 'exact', head: true })` (3 queries paralelas, sin descargar rows) y se actualizan en cliente al aprobar/rechazar.

**Estructura visual de filas** (ambas tablas): grid de columnas fijas en vez de `flex justify-between`, para que filas con nombres/emails de largo distinto queden alineadas verticalmente entre sí. Cualquier columna fija que tenga texto variable usa `tabular-nums`.

---

## Impersonation — "Entrar como cliente" (soporte)

Sirve para que un operador reproduzca bugs de UX del cliente ("se me pone la pantalla en negro", "no me guarda") sin pedirle la password. Ver los datos con RLS de operador no alcanza — hay bugs que dependen del estado local del wizard, del context, del render, etc.

**Edge Function `impersonar-cliente`** (Supabase project `ddxqnwbzluqikasdhbyv`, `verify_jwt: true`):
1. Toma el JWT del caller del header `Authorization`.
2. Valida contra `perfiles.rol` (via service_role client) que sea `'operador'` — si no, 403.
3. Lee `perfiles.email` del `clienteUserId` recibido en el body. Rechaza si el target es otro operador o si es el propio caller.
4. Llama `admin.auth.admin.generateLink({ type: 'magiclink', email })` — NO envía mail (generateLink devuelve la URL sin enviarla, ese es el punto).
5. Loggea `{event: 'impersonation', operador, cliente, ts}` en los logs de la function para auditoría.
6. Devuelve `{ url, email }`.

**Botón en `FichaCliente.tsx`** — "Entrar como cliente" en el header, al lado del badge de estado. Invoca la function vía `supabase.functions.invoke('impersonar-cliente', { body: { clienteUserId, redirectTo: window.location.origin } })` y abre la URL en `window.open(..., '_blank')`.

**Advertencia de UX (documentada en el `title` del botón):** el magic link comparte el storage del browser con la sesión de admin. Si el operador abre en pestaña común, la nueva pestaña queda como cliente pero potencialmente **pisa** la sesión de admin en las demás tabs del mismo browser al refrescar. **Usar ventana incógnito o browser distinto** para conservar la sesión de admin en paralelo.

**Cambios de datos:** ninguno por el hecho de entrar. Si el operador toca algo adentro del wizard, escribe como el cliente (mismo `auth.uid()`), así que mirar-y-no-tocar salvo que se quiera arreglar algo puntual.

**Plan B si falla el magic link:** el operador ya tiene RLS `ALL` en casi todas las tablas — puede seguir mirando los datos crudos desde `FichaCliente`. La impersonation es específicamente para reproducir bugs de UI.

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
- `alta_estudio_tables` — crea `abogados`, `jurisdicciones` y `respuestas_alta` con RLS cliente + operador. Cascade delete desde `estudios`.
- `fix_respuestas_alta_updated_at` — el trigger `set_updated_at` setea `NEW.updated_at`, pero la migración original nombró la columna `actualizado_en`. Este fix la renombra a `updated_at` (el service ya la usaba con nombre correcto tras el fix).
- `estudios_add_telefono_fijo_and_domicilio_constituido` (2026-07) — agrega `estudios.telefono_fijo` y `estudios.domicilio_constituido`. La columna `estudios.telefono` conserva el celular (no se renombró para no romper joins admin).
- `jurisdicciones_reshape_instancia_2` (2026-07) — dropea `jurisdicciones.ofrecimiento_prueba` (era radio), agrega `jurisdicciones.reglas_competencia` y `jurisdicciones.presentacion_electronica`, agrega `estudios.criterio_conveniencia_jurisdiccional`.
- `move_reglas_competencia_to_estudios` (2026-07) — mueve `reglas_competencia` de `jurisdicciones` a `estudios.reglas_competencia_jurisdiccional` (pasó a ser transversal, no per-jurisdicción).
- `jurisdicciones_drop_organismo` (2026-07) — dropea `jurisdicciones.organismo`. La instancia previa dejó de ser radio + campo condicional y pasó a ser textarea único que incluye organismo si aplica.
- `jurisdicciones_add_ofrecimiento_prueba_text` (2026-07) — re-agrega `jurisdicciones.ofrecimiento_prueba` como text libre (antes era radio con dos opciones).

**Wipe 2026-06-21:** se borraron todos los registros de prueba (auth.users, perfiles, estudios, documentos, configuracion_modulos, checklist_tecnico, progreso_roadmap, altas) excepto el admin `jorgeduje4@gmail.com` (id `43a8b629-4e16-453f-9990-18cc22b4afd8`). Storage `modelos` y `documentos` quedaron limpios (los `.emptyFolderPlaceholder` que crea el dashboard de Supabase también fueron eliminados).

---

## ⚠ Pendientes para producción

1. **`formulario-alta-estudio.md`** (fuente de verdad de los campos del wizard) — todavía no está en el repo. Cuando llegue, reemplazar el esqueleto en `src/data/altaEstudio.ts` sin tocar el renderer, context ni la capa de servicios.
2. **Mapping skill ↔ carpeta múltiple** — hoy es 1 skill → 0..1 modelo → 1 carpeta (con carpetas compartidas). Si alguna skill termina necesitando múltiples modelos con carpetas distintas, hay que extender `ModeloRequerido[]` y revisar `carpetasDeSkills`.
3. **Generación remota del perfil del estudio** — el `generator.ts` produce el `.md` y el manifiesto en memoria y los ofrece como descarga. Falta la Edge Function que suba el `.md` a Drive y cree la estructura de carpetas remota. Punto marcado como `_puntoIntegracionBackend()` en el generator.
4. **Columnas legacy en `estudios`** — `abogado_responsable`, `matricula`, `contexto`, `jurisdiccion`, `fuero_principal`. Ya no se escriben, algunas todavía se leen. Migrar consumidores y dropear después.
5. **Bucket `documentos` (legacy)** — sigue existiendo pero sin uso. Decidir si se elimina.
6. **Página pública de skills** — el usuario preguntó si querría una `/skills` de marketing con las 21 skills agrupadas por etapa. Hoy solo hay el listado interno del paso 3 del roadmap. Sin decisión.
7. **`DatosEstudio.tsx`** — huérfano. Borrar cuando se confirme.
