# Estructura de Drive del estudio — la crea José en el alta

Se crea en **"Mi unidad"** del Google Drive de cada estudio. Una sola carpeta raíz (el "cerebro"), con todo adentro.

```
📁 <Estudio – Laboral>/                  ← carpeta raíz, en Mi unidad
│
├── 📄 perfil_estudio.md                 ← el cerebro: identidad, jurisdicción, criterios, plazos, firma
│
├── 📁 modelos/                          ← ENTRADAS: lo que el agente LEE (compartido, igual para todos los clientes)
│   ├── 📁 telegramas/                   → Telegrama / Carta Documento
│   ├── 📁 demandas/                     → Demanda Laboral
│   ├── 📁 escritos/                     → Escritos de Trámite
│   ├── 📁 liquidaciones/                → Liquidación de Rubros (la Calculadora Indemnizatoria)
│   ├── 📁 impugnaciones/                → Impugnación Pericial
│   ├── 📁 honorarios/                   → Contrato de Honorarios
│   └── 📁 comunicaciones/   (opcional)  → Respuesta a Clientes
│
├── 📁 datos/
│   └── 📁 escalas-cct/                  → Liquidación (escala del CCT, para diferencias salariales)
│
└── 📁 clientes/                         ← SALIDAS: lo que el agente GUARDA (una carpeta por cliente)
    └── 📁 <Cliente / Carátula>/         → borradores generados para ESE cliente
```

## 1) Lo que José SUBE para que el agente lea

| Carpeta                   | Qué pone José adentro                                                                      | Skill que la usa          | ¿Obligatoria? |
| ------------------------- | ------------------------------------------------------------------------------------------ | ------------------------- | ------------- |
| `perfil_estudio.md`       | El perfil del estudio (lo completa en el alta)                                             | Todas (Paso 0)            | **Sí**        |
| `modelos/telegramas/`     | Modelos de telegramas / cartas documento                                                   | Telegrama                 | Sí            |
| `modelos/demandas/`       | Demandas por tipo + ofrecimiento de prueba                                                 | Demanda                   | Sí            |
| `modelos/escritos/`       | Poder, traslados, cédulas, oficios y acreditación, acuerdos, recursos, ejecución, rebeldía | Escritos de Trámite       | Sí            |
| `modelos/liquidaciones/`  | La **Calculadora Indemnizatoria** (Excel modelo)                                           | Liquidación               | Sí            |
| `modelos/impugnaciones/`  | Un modelo de impugnación de pericia                                                        | Impugnación Pericial      | Sí            |
| `modelos/honorarios/`     | Contrato de honorarios + pacto de cuota litis                                              | Contrato de Honorarios    | Sí            |
| `modelos/comunicaciones/` | Plantillas de mensajes al cliente                                                          | Respuesta a Clientes      | Opcional      |
| `datos/escalas-cct/`      | Escala(s) del CCT vigentes                                                                 | Liquidación (diferencias) | Recomendada   |

## 2) Dónde el agente GUARDA

Todo lo que el agente genera va a **`clientes/<Cliente>/`**, la carpeta de ese cliente/expediente — nunca a una carpeta común. José crea la carpeta madre `clientes/` vacía en el alta; la subcarpeta de cada cliente se crea al abrir el expediente.

Guardan archivo en la carpeta del cliente: **Telegrama, Demanda, Escritos de Trámite, Liquidación (Excel), Impugnación Pericial, Contrato de Honorarios, Preparación Testimonial, Alegato.**

## 3) Skills que NO usan carpeta de Drive

- **Responden solo en el chat** (no guardan archivo): Triage de Consultas, Jurisdicción y Competencia, Respuesta a Clientes, Análisis de Contestación, Investigación Jurídica.
- **Plazos Procesales** no toca Drive: agenda 2 recordatorios en **Google Calendar**.

## Resumen para el alta

José, en "Mi unidad", crea: la carpeta raíz + `perfil_estudio.md`, las 7 subcarpetas de `modelos/` (6 obligatorias + comunicaciones opcional), `datos/escalas-cct/`, y `clientes/` vacía. Sube los modelos del estudio a cada subcarpeta y la Calculadora Indemnizatoria a `modelos/liquidaciones/`. Después conecta el Drive y prueba una skill.
