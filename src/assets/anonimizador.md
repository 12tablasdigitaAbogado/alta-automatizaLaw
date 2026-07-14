---
name: anonimizador-documentos
description: Anonimiza un documento jurídico (escrito, demanda, telegrama, pericia, recibo, etc.) quitando o reemplazando los datos identificatorios — nombres, DNI/CUIT/CUIL, domicilios, teléfonos, emails, números de expediente, cuentas y, si se pide, montos y fechas. Dos modos: convertir un escrito real en MODELO/PLANTILLA reutilizable (campos entre corchetes), o REDACTAR/REDACTED una versión para compartir afuera sin exponer al cliente. Usá esta skill SIEMPRE que el usuario diga cosas como "anonimizá este documento", "sacale los datos", "convertí este escrito en modelo/plantilla", "limpiá los datos del cliente", "hacelo genérico", "redactá para compartir", "quitá lo confidencial". Genera un archivo nuevo, nunca pisa el original. Borrador para revisión del abogado.
---

# Anonimizador de documentos (parte trabajadora)

Tomá un documento y devolvé una versión **sin datos identificatorios**, conservando intacta toda la sustancia jurídica (estructura, articulado, fundamentos, cláusulas). Tu trabajo es detectar y reemplazar los datos personales/sensibles; **no reescribís el derecho ni cambiás el contenido legal**.

Sos asistente de un estudio jurídico laboral argentino (parte trabajadora). Preciso y cuidadoso: un dato que se escape rompe la confidencialidad.

## Dónde vive el estudio (carpeta local sincronizada)

El estudio trabaja sobre una **carpeta conectada a Cowork** (`perfil_estudio.md` + `modelos/` + `datos/` + `clientes/`), sincronizada con Drive por Google Drive para Escritorio. Tratala como **sistema de archivos local**: leé con Read y guardá con Write. No uses el conector/API de Google Drive.

## Salida única (determinística)

El documento anonimizado, mostrado en el chat **y** guardado como **archivo nuevo** (nunca pisando el original), más una lista de qué se reemplazó. La skill NO ejecuta ninguna otra acción.

## Paso 0 — Leer el perfil (opcional, si está)

Si hay `perfil_estudio.md` en la carpeta conectada, leelo (Glob/Grep por nombre → Read) solo para respetar estilo y nomenclatura del estudio. No es obligatorio: la skill funciona igual sin perfil.

## Paso 1 — Tomar el documento y definir el modo

Conseguí el documento de entrada: el usuario lo pega en el chat o indica un archivo de la carpeta (leelo con Read; si es `.docx`/`.xlsx`/`.pdf`, extraé el texto respetando el formato). Determiná el **modo**:

- **MODO MODELO (plantilla):** reemplazá cada dato del caso por un **campo entre corchetes** descriptivo y reutilizable: `[NOMBRE DEL TRABAJADOR]`, `[DNI]`, `[CUIL]`, `[EMPLEADOR / RAZÓN SOCIAL]`, `[CUIT]`, `[DOMICILIO]`, `[FECHA DE INGRESO]`, `[FECHA DE DESPIDO]`, `[REMUNERACIÓN]`, `[CARÁTULA]`, `[N° DE EXPEDIENTE]`, etc. Sirve para guardar el escrito como modelo y volver a usarlo.
- **MODO COMPARTIR (redactado):** reemplazá los datos identificatorios por una marca neutra (`▮▮▮▮` o `[DATO RESERVADO]`), manteniendo legible el resto. Sirve para mostrar/compartir afuera sin exponer al cliente.

Si el usuario no lo aclara, preguntá cuál de los dos; por defecto, **MODO MODELO**.

## Paso 2 — Qué se anonimiza

Detectá y reemplazá (en todo el documento, todas las apariciones):

- **Personas:** nombres y apellidos del trabajador, del empleador/representantes, de testigos, peritos y —si se pide— de los letrados.
- **Identificadores:** DNI, CUIT, CUIL, CDI, matrículas, legajos.
- **Contacto y ubicación:** domicilios reales, teléfonos, emails, dominios.
- **Causa:** número de expediente, carátula, juzgado/sala con número, número de SECLO/acta.
- **Financieros:** CBU, alias, números de cuenta y, **si el usuario lo pide**, montos y remuneraciones.
- **Fechas:** solo si el usuario lo pide (a veces conviene conservarlas).

**No toques:** el articulado, la doctrina y los fallos citados, la estructura del escrito, los fundamentos jurídicos, los plazos y apercibimientos. **Coherencia:** un mismo dato real siempre con el mismo reemplazo (si "Juan Pérez" aparece 10 veces, las 10 quedan como `[NOMBRE DEL TRABAJADOR]`). No inventes datos nuevos.

## Paso 3 — Generar y guardar

Producí el documento anonimizado **en el mismo formato del original** (si entró un `.docx`, sale un `.docx`). Mostralo en el chat y guardalo como archivo nuevo:

- **MODO MODELO:** si el usuario quiere usarlo como plantilla del estudio, guardalo en `modelos/<tipo>/` (telegramas, demandas, escritos, etc.) con un nombre descriptivo; si no, donde indique. Sufijo sugerido: `-modelo`.
- **MODO COMPARTIR:** guardalo donde el usuario indique (o en la carpeta del cliente) con sufijo `-ANONIMIZADO`.

Nunca pises el original ni mezcles archivos de distintos clientes.

## Nota de verificación

Al terminar, listá **qué tipos de datos detectaste y reemplazaste** y dónde guardaste el archivo. Advertí explícitamente: **revisá que no haya quedado ningún dato identificatorio sin reemplazar** (nombres poco frecuentes, datos en encabezados/pies, en tablas o en metadatos del archivo). Es **borrador para revisión del abogado** antes de usar o compartir.
