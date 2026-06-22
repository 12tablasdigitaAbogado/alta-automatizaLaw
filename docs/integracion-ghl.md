# Integración con GoHighLevel (GHL)

Documento de planificación para conectar la app de onboarding (AutomatizaLaw) con GoHighLevel como CRM, sistema de pagos y calendario.

**Estado:** propuesta, pendiente de credenciales de GHL para implementar.
**Última actualización:** 2026-06-22

---

## 1. Objetivo

Usar GHL como única fuente de verdad **comercial** (contactos, pagos, pipelines, tags, calendario de altas) y mantener Supabase como fuente de verdad **del producto** (estudio, skills, modelos, checklist técnico, alta técnica).

La app no cambia su esencia: el cliente sigue completando el wizard de 6 pasos. Lo que cambia es:
- El cliente **paga antes** en GHL para poder acceder.
- La app **mueve oportunidades de stage** en GHL a medida que el cliente avanza.
- El paso 6 (agendar alta) usa el **calendario de GHL** en vez de Calendly.
- La vista admin de Agenda lee los turnos desde la **API de GHL** en vez del iframe de Google Calendar.

---

## 2. Modelo de datos: quién manda sobre qué

| Concepto | Fuente de verdad | Notas |
|----------|------------------|-------|
| Identidad y login del cliente | **Supabase auth** | Sin cambios. El cliente solo conoce la app. |
| Login del operador | **Supabase auth** | Sin cambios. |
| Contacto (registro CRM) | **GHL** | Se crea automático al pagar. El cliente nunca entra a GHL. |
| Estado de pago | **GHL** | La app refleja un flag `pago_confirmado` actualizado por webhook. |
| Pipeline y stage del cliente | **GHL** | La app empuja cambios de stage vía API a medida que avanza el wizard. |
| Tags del cliente | **GHL** | La app puede agregarlos en hitos clave. |
| Turno de alta (fecha, hora, link Meet) | **GHL** | Webhook `AppointmentCreate` rellena la tabla `altas`. |
| Datos del estudio, skills, documentos, checklist | **Supabase** | Sin cambios. |

**Match cliente ↔ contacto GHL:** por **email**. El cliente se registra en la app con el mismo email del contacto de GHL.

---

## 3. Flujo end-to-end

```
1. Cliente recibe link de checkout de GHL
       ↓
2. Paga en GHL                              → GHL crea/actualiza Contact
       ↓
3. GHL dispara webhook InvoicePaid          → Edge Function de Supabase
       ↓
4. Edge Function:
   - busca o crea perfil en Supabase con ese email
   - marca pago_confirmado = true
   - guarda ghl_contact_id
   - (opcional) envía magic link al cliente
       ↓
5. Cliente entra a la app (login o magic link)
       ↓
6. Wizard se desbloquea (gate de pago en el frontend)
       ↓
7. Cliente avanza pasos                      → app mueve opportunity de stage en GHL
       ↓
8. Paso 6: cliente reserva alta en calendario GHL (embed nativo)
       ↓
9. GHL dispara webhook AppointmentCreate    → Edge Function actualiza tabla altas
       ↓
10. Operador ve la cita en Agenda           → lee desde GET /calendars/events
```

---

## 4. Decisiones tomadas

- **Pago:** único, previo al acceso. No es suscripción.
- **Auth GHL para nuestra app:** Private Integration Token (PIT), guardado server-side. Rotar cada 90 días.
- **API version:** v2 (`services.leadconnectorhq.com`), header `Version: 2021-04-15`. (V1 está fuera de soporte desde diciembre 2025.)
- **Webhook signature:** validar `X-GHL-Signature` (el legacy `X-WH-Signature` queda deprecado el 1 de julio de 2026).
- **Calendario de altas:** **uno solo, compartido entre todos los operadores**.
- **Duración del turno:** **60 minutos**.
- **Reunión:** **Google Meet**, generado automáticamente por GHL.
- **Reserva del cliente en el paso 6:** embed nativo de GHL para arrancar (camino A). Migrar a UI propia con `free-slots` + `create appointment` si más adelante conviene.
- **Vista admin Agenda:** grilla propia leyendo `GET /calendars/events` (reemplaza el iframe de Google Calendar; ya no necesita ser público).
- **Registro de usuarios en la app:** **se mantiene**. Los clientes NO tienen cuenta de GHL — solo aparecen ahí como contactos del CRM.
- **Magic link post-pago (opcional, recomendado):** la Edge Function manda magic link de Supabase al confirmar pago → cero fricción para el cliente.
- **Orden de implementación:** primero pago + pipelines, después calendario (el calendario depende del `ghl_contact_id` que se establece en el flujo de pago).

---

## 5. Lo que tiene que configurar el operador (socio) en GHL

### 5.1. Pipeline de onboarding

Crear un pipeline (sugerencia: "Onboarding AutomatizaLaw") con los siguientes stages (ajustables):

1. `Pagó - Pendiente onboarding`
2. `Datos del estudio cargados` (paso 2 completo)
3. `Skills/Modelos cargados` (paso 3 completo)
4. `Checklist técnico OK` (paso 4 completo)
5. `Revisión final` (paso 5 completo)
6. `Alta agendada` (paso 6 completo)
7. `Alta realizada` (después de la reunión)
8. `Activo` (cliente funcionando)

### 5.2. Producto / checkout para el pago único

- Crear el producto con el precio del onboarding.
- Decidir cómo cobra: **Payment Link** (recomendado por simplicidad) o **Invoice**.
- Conectar el procesador de pagos (Stripe / NMI / etc.).

### 5.3. Calendario único de altas

- Crear un calendario "Altas AutomatizaLaw".
- **Duración del slot: 60 min.**
- **Tipo:** Round-Robin si querés repartir entre operadores, o Class si cualquiera puede atender el mismo turno.
- **Asignar a todos los operadores** que tomen altas.
- **Conectar Google Meet** como meeting location (cada operador tiene que tener su Google Calendar linkeado a GHL para que se generen los Meet automáticamente).
- Configurar horario de atención, buffer entre citas, antelación mínima.

### 5.4. Tags (opcional)

Crear los tags que usaremos desde la app: `wizard-completo`, `alta-agendada`, `cliente-activo`. También se pueden crear al vuelo desde la API.

### 5.5. Private Integration Token (PIT)

Generar en Settings → Private Integrations → Create New, con scopes:

- `contacts.readonly`, `contacts.write`
- `opportunities.readonly`, `opportunities.write`
- `calendars.readonly`, `calendars/events.readonly`, `calendars/events.write`
- `locations.readonly`
- `payments/orders.readonly` o `invoices.readonly` (según el flujo de cobro elegido)

### 5.6. Webhooks salientes

Configurar en GHL apuntando a la URL de la Edge Function de Supabase (la pasamos cuando esté desplegada). Eventos a suscribir:

- `InvoicePaid` u `OrderPlaced` (según flujo de cobro)
- `AppointmentCreate`
- `AppointmentUpdate`
- `AppointmentDelete`

---

## 6. Datos que el operador tiene que pasarnos

| Dato | Dónde lo saca en GHL |
|------|----------------------|
| **Private Integration Token (PIT)** | Settings → Private Integrations → Create New |
| **Location ID** (sub-account ID) | Settings → Business Profile, o en la URL del dashboard |
| **Pipeline ID** | API call `GET /pipelines` o desde la URL del pipeline |
| **Stage IDs** (uno por cada stage) | Mismo lugar que el pipeline |
| **Calendar ID** (el calendario único de altas) | Settings → Calendars → Calendar Settings |
| **Product ID / Price ID** (del onboarding) | Payments → Products |
| **URL del checkout / payment link** | Payments → Payment Links |
| **Timezone configurada en la sub-cuenta** | Settings → Business Profile |
| **Confirmación de qué evento de pago dispara** | `InvoicePaid` u `OrderPlaced` |

---

## 7. Cambios técnicos en la app

### 7.1. Backend (Supabase)

**Nuevas columnas en `perfiles`** (o tabla separada `acceso_cliente`):
- `ghl_contact_id` (text)
- `pago_confirmado` (bool, default false)
- `pago_fecha` (timestamptz, nullable)
- `pago_monto` (numeric, nullable)
- `ghl_opportunity_id` (text, nullable)

**Columnas adicionales en `altas`:**
- `ghl_appointment_id` (text, unique)
- `ghl_calendar_id` (text)

**Edge Function nueva:** `ghl-webhook`
- Endpoint: `POST /functions/v1/ghl-webhook`
- Valida `X-GHL-Signature`.
- Maneja eventos:
  - `InvoicePaid` / `OrderPlaced` → busca/crea perfil por email, marca `pago_confirmado`, guarda `ghl_contact_id`.
  - `AppointmentCreate` / `AppointmentUpdate` → UPSERT en `altas`.
  - `AppointmentDelete` → marca alta como cancelada.
- (Opcional) envía magic link al confirmar pago.

**Trigger `handle_new_user` ajustado:** si ya existe un perfil con ese email (pre-creado por el webhook), no crear uno nuevo, linkear el `auth.users.id` al existente.

### 7.2. Frontend

**Nuevo servicio `ghlService.ts`** (llama a una Edge Function intermedia, NO a GHL directo — el PIT no debe vivir en el cliente):
- `moverStage(perfilId, stageId)` → actualiza opportunity en GHL.
- `agregarTag(perfilId, tag)` → tag al contacto.
- `getSlotsLibres(desde, hasta)` → (si se migra a UI propia más adelante).

**Mapping de stages:** `src/data/ghlPipeline.ts` con `{ paso1: stageId, paso2: stageId, ... }`.

**Gate de pago:**
- En `AuthContext` o un wrapper sobre `RoadmapLayout`, chequear `pago_confirmado`.
- Si false → pantalla "Esperando confirmación de pago" con link al checkout.
- Realtime listener sobre `perfiles.pago_confirmado` para desbloquear sin refresh.

**`RoadmapContext.completarPaso(n)`:** después de marcar el paso completo, llamar `ghlService.moverStage()` con el stage correspondiente.

**`CalendarBooking.tsx`:** reemplazar embed de Calendly por embed nativo de GHL. La fecha/hora real llega vía webhook, no se intenta capturar en el frontend.

**`Agenda.tsx`:** reemplazar iframe de Google Calendar por componente que llama `GET /calendars/events` (vía Edge Function) y renderiza grilla propia.

### 7.3. Variables de entorno (server-side, en Edge Functions)

- `GHL_PIT` — Private Integration Token
- `GHL_LOCATION_ID`
- `GHL_PIPELINE_ID`
- `GHL_CALENDAR_ID`
- `GHL_WEBHOOK_SECRET` — para validar firma

---

## 8. Endpoints de GHL que vamos a usar

Base v2: `https://services.leadconnectorhq.com`
Header obligatorio: `Version: 2021-04-15`

| Acción | Endpoint |
|--------|----------|
| Buscar contacto por email | `POST /contacts/search` |
| Listar pipelines | `GET /opportunities/pipelines` |
| Crear/actualizar oportunidad | `POST /opportunities/upsert` |
| Listar calendarios | `GET /calendars/` |
| Slots libres | `GET /calendars/{id}/free-slots` |
| Crear appointment | `POST /calendars/events/appointments` |
| Listar events (agenda admin) | `GET /calendars/events` |
| Agregar tag a contacto | `POST /contacts/{id}/tags` |

---

## 9. Riesgos y consideraciones

1. **PIT no debe vivir en el cliente.** Todas las llamadas a GHL pasan por Edge Functions de Supabase.
2. **Validación de firma del webhook obligatoria.** Sin esto, cualquiera podría disparar "pago confirmado" en nuestra DB.
3. **Email mismatch.** Si el cliente se registra en la app con un email distinto al de GHL, el match falla. Decisión a tomar: ¿bloqueamos signUp para emails que no existan en GHL, o mostramos pantalla "no encontramos tu pago"?
4. **Rotación del PIT cada 90 días.** Recordatorio operativo.
5. **Sincronización inversa.** Si el operador mueve manualmente una opportunity en GHL, la app no se entera automáticamente. Se puede agregar webhook de `OpportunityStageChanged` si esto se vuelve un problema.
6. **API V1 deprecada.** Todo se construye contra v2.

---

## 10. Plan de implementación (cuando tengamos credenciales)

**Fase 1 — Pago y acceso (1-2 días)**
- Crear Edge Function `ghl-webhook` con validación de firma.
- Agregar columnas a `perfiles`.
- Implementar gate de pago en el frontend.
- Test end-to-end: pago en GHL sandbox → cliente puede entrar a la app.

**Fase 2 — Pipelines (1 día)**
- Servicio `ghlService.moverStage`.
- Cablear en `completarPaso` del `RoadmapContext`.
- Mapping en `ghlPipeline.ts`.
- Test: avanzar pasos en la app → opportunity se mueve en GHL.

**Fase 3 — Calendario (2 días)**
- Reemplazar `CalendarBooking` con embed nativo de GHL.
- Webhook `AppointmentCreate` → tabla `altas`.
- Reescribir `Agenda.tsx` con grilla propia + API.
- Test: cliente reserva en la app → operador ve cita en Agenda + Meet generado.

**Total estimado: 4-5 días de trabajo efectivo** una vez que tengamos credenciales y pipeline configurado.

---

## 11. Referencias

- [HighLevel API Docs (developer portal)](https://marketplace.gohighlevel.com/docs/)
- [OAuth 2.0 | HighLevel API](https://marketplace.gohighlevel.com/docs/Authorization/OAuth2.0/index.html)
- [Private Integrations](https://marketplace.gohighlevel.com/docs/Authorization/PrivateIntegrationsToken/)
- [Webhook Integration Guide](https://marketplace.gohighlevel.com/docs/webhook/WebhookIntegrationGuide/)
- [Invoice Paid Webhook](https://marketplace.gohighlevel.com/docs/webhook/InvoicePaid/index.html)
- [Get Pipelines](https://marketplace.gohighlevel.com/docs/ghl/opportunities/get-pipelines/index.html)
- [Search Contacts](https://marketplace.gohighlevel.com/docs/ghl/contacts/search-contacts-advanced/)
- [Calendars API](https://marketplace.gohighlevel.com/docs/ghl/calendars/calendars/)
- [Get Free Slots](https://marketplace.gohighlevel.com/docs/ghl/calendars/get-slots/index.html)
- [Create Appointment](https://marketplace.gohighlevel.com/docs/ghl/calendars/create-appointment/)
