# 05 — Arquitectura

## 1. Stack

| Capa | Elección | Motivo |
|------|----------|--------|
| Framework | Next.js 16 (App Router), React 19, TypeScript | Ya instalado. Server Components y Server Actions |
| Base de datos | Neon Postgres | Integración recomendada, serverless, branching |
| ORM | Drizzle | Tipado, migraciones, estándar del stack Neon |
| Auth | Better Auth (email + contraseña) | Roles propios, sesiones, hashing integrado |
| UI | Tailwind v4 + shadcn/ui con tokens estilo Fluent 2 | Ya instalado. Permite cambiar la marca por tokens |
| Datos en cliente | SWR | Polling del chat y del diario, caché |
| Archivos | Vercel Blob (privado) | Fotos, recursos, PDF exportados |
| Videollamada | Jitsi embebido (demo), P-04 | Sin cuenta ni costo |
| Tareas programadas | Vercel Cron → Route Handler | Cierre semanal y recordatorios |
| PDF | `@react-pdf/renderer` en el servidor | Exportar resumen de cierre e historia clínica |
| IA (futuro) | AI SDK + AI Gateway detrás de una interfaz | Hoy mock (P-06) |
| Email (opcional) | Resend | Recordatorios (P-09) |

**Integraciones a conectar:** Neon (obligatoria), Blob (desde el commit de recursos) y Resend (opcional).
**Variable de entorno requerida:** `BETTER_AUTH_SECRET`.

## 2. Estructura de carpetas

```
app/
  (public)/                 # layout público
    page.tsx                # landing y buscador
    buscar/page.tsx         # resultados, filtros, lenguaje natural
    profesionales/[id]/page.tsx
  (auth)/
    ingresar/page.tsx
    registro/page.tsx
  paciente/                 # layout con navegación de paciente (guard de rol)
    page.tsx                # inicio: próximos turnos, indicaciones, diario
    diario/
    tratamiento/
    turnos/
    mensajes/[conversationId]/
    profesionales/          # vínculos y solicitudes
    progreso/
    historial/              # experiencias pasadas y resúmenes de cierre
    perfil/
  profesional/
    page.tsx                # inicio: agenda del día, solicitudes, diarios no leídos
    solicitudes/
    pacientes/
      [bondId]/
        page.tsx            # ficha y línea de tiempo
        historia-clinica/
        diario/
        indicaciones/
        resumenes/
        progreso/
        cierre/
    agenda/
    mensajes/[conversationId]/
    plantillas/
    perfil/
  admin/
    ramas/ coberturas/ consentimientos/ plantillas/ configuracion/ usuarios/ auditoria/
  sesion/[appointmentId]/   # sala de videollamada
  api/
    auth/[...all]/route.ts
    cron/weekly-summaries/route.ts
    cron/reminders/route.ts
    export/closing-summary/[id]/route.ts
    public/v1/...           # API de interoperabilidad (ver §7)

components/
  ui/                       # primitivas (shadcn). ÚNICA capa con estilos de marca
  layout/                   # shells por rol, navegación inferior (mobile) y lateral (desktop)
  domain/                   # componentes de negocio (no definen colores propios)
    search/ bond/ chat/ agenda/ clinical/ journal/ indications/ summaries/ progress/

lib/
  db/schema.ts, db/index.ts, db/seed.ts
  auth.ts, auth-client.ts, session.ts      # helpers requireRole()
  services/                 # lógica de dominio y autorización (un archivo por módulo)
  policies/                 # reglas R-xx como funciones puras y testeables
  recommendation/           # interfaz RecommendationEngine + mockEngine
  summaries/                # agregador semanal + interfaz SummaryWriter (mock o IA)
  video/                    # interfaz VideoProvider + jitsiProvider
  audit.ts
docs/
```

## 3. Principios de implementación

- **Autorización en el servidor, en la capa `services/`.** Cada función recibe la sesión y valida el rol, la propiedad y el estado del vínculo. Ninguna consulta de datos clínicos se hace fuera de `services/`.
- **Scoping por usuario** en cada consulta (no hay RLS con Better Auth).
- **Políticas como funciones puras** (`canSeeFullPatientProfile`, `isProgressVisible`, etc.) reutilizadas por la UI y los servicios.
- **Interfaces reemplazables** para todo lo mockeado o tercerizado: `RecommendationEngine`, `SummaryWriter`, `VideoProvider`, `Notifier`.
- **Server Actions** para las mutaciones y **SWR** para las vistas vivas (chat, diario, notificaciones). Polling de 5 a 10 s en la demo; migrable a websockets.
- **Zona horaria:** se guarda en UTC y se muestra en `America/Argentina/Buenos_Aires`.

## 4. Sistema de diseño intercambiable

Requisito: concepto inspirado en Fluent 2, con la marca reemplazable en cualquier momento.

**Capas:**
1. **Tokens** (`app/globals.css`): colores semánticos (`--background`, `--primary`, `--surface-1..3`, `--success`, `--warning`, `--danger`), radios, sombras de elevación estilo Fluent (`--shadow-2/4/8/16`), espaciado y tipografía. **Cambiar la marca = cambiar este archivo.**
2. **Primitivas** (`components/ui`): consumen solo tokens. Se ajustan los componentes de shadcn al lenguaje Fluent: radios de 4 a 8 px, foco visible de 2 px, elevación por sombras suaves, densidad cómoda y targets táctiles de 44 px o más.
3. **Dominio y páginas:** solo usan primitivas y clases semánticas (`bg-background`, `text-muted-foreground`). **Prohibido** usar colores directos o estilos de marca.

**Tipografía:** Fluent usa Segoe UI, que no se puede redistribuir. Se usa una sans humanista equivalente de Google Fonts definida en un solo token (`--font-sans`).
**Iconos:** un solo set (`lucide-react`, ya disponible) envuelto en un componente `Icon` para poder cambiarlo por Fluent Icons sin tocar el dominio.
**Mobile first:** navegación inferior de 4 o 5 ítems por rol en mobile y barra lateral en desktop (≥ 1024 px). Las vistas de detalle usan *sheets* en mobile y paneles en desktop.
**Modo claro y oscuro** con los mismos tokens.

## 5. Seguridad

- Contraseñas y sesiones con Better Auth. Cookies `httpOnly` y `secure`.
- Validación de entrada con Zod en cada Server Action y Route Handler.
- Consultas parametrizadas (Drizzle).
- Blob **privado**: los archivos se sirven por un handler que valida el vínculo.
- Cifrado de columna para el DNI.
- Headers en `next.config`: `X-Content-Type-Options`, `Referrer-Policy`, `Strict-Transport-Security`, `X-Frame-Options: SAMEORIGIN` (la app tiene datos sensibles), `Permissions-Policy` que permite `camera` y `microphone` solo para `self` y el dominio de video, y CSP en modo *report-only* al inicio.
- Rate limit en el registro, el inicio de sesión y los mensajes (en producción).

## 6. Cumplimiento normativo (Argentina)

| Norma | Impacto en el sistema |
|-------|------------------------|
| **Ley 26.529** (Derechos del Paciente, Historia Clínica) y modif. 26.742 | Historia clínica inalterable con enmiendas, autor identificado, fecha y hora, integridad (hash), custodia sin borrado, derecho del paciente a pedir copia (P-02), consentimiento informado |
| **Ley 25.326** (Protección de Datos Personales) | Datos de salud = **datos sensibles**: consentimiento expreso, finalidad declarada, derechos de acceso, rectificación y supresión (con la excepción de la historia clínica), registro de la base ante la AAIP en producción |
| **Ley 26.657** (Salud Mental) | Enfoque de derechos, confidencialidad, consentimiento. Textos del consentimiento redactados en ese marco |
| **Ley 27.553** (Recetas electrónicas y teleasistencia) | Marco de la teleconsulta: plataforma segura y registro de la atención |
| **Ley 25.506** (Firma digital) | En producción, firma electrónica o digital de las entradas clínicas. En la demo, hash de integridad y snapshot de la matrícula |
| **Ley 23.277** (Ejercicio de la psicología) | Futura verificación de matrícula (REFEPS / SISA) |

> Esto es un relevamiento técnico, no un dictamen legal. Validar con asesoría antes de producción.

## 7. Preparación para adopción estatal

- **Modelo:** `coverage` (tipo `public_program`), `benefit` (bonificación), `external_code` y la relación profesional ↔ cobertura ↔ tipo de atención.
- **Búsqueda:** filtro por programa y una etiqueta "Atiende por [programa]" en las tarjetas. Si el paciente tiene una cobertura cargada, se le muestra el precio bonificado.
- **Multi-tenant futuro:** las entidades de catálogo admiten una `jurisdiction`, para que una provincia administre su propio programa.
- **Interoperabilidad:** API de solo lectura (`/api/public/v1`) con profesionales publicados, programas y estadísticas **anonimizadas** de uso. Estructura alineada a recursos HL7 FHIR (`Practitioner`, `HealthcareService`, `Schedule`, `Slot`) para facilitar la integración con la Red Nacional de Salud Digital. En la demo, solo el endpoint de profesionales.
- **Verificación profesional:** el campo `license_verified` y la interfaz `LicenseVerifier` quedan listos para conectar con REFEPS.

## 8. Mocks y su reemplazo

| Mock | Interfaz | Implementación demo | Reemplazo |
|------|----------|---------------------|-----------|
| Lenguaje natural y recomendaciones | `RecommendationEngine.recommend(text, filters)` | Diccionario de palabras clave → ramas y temas, más ranking por coincidencia, disponibilidad y cobertura. Devuelve los motivos | AI SDK (`generateObject`) o embeddings |
| Redacción de resúmenes | `SummaryWriter.write(aggregate)` | Plantilla de texto con los datos agregados | AI SDK vía AI Gateway |
| Videollamada | `VideoProvider.roomFor(appointment)` | Jitsi (`meet.jit.si/<id-aleatorio>`) | Daily, LiveKit o un proveedor estatal |
| Notificaciones | `Notifier.send(user, event)` | Tabla `notification` | Resend o push |
