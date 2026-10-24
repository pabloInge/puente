# Datos de demo

Se cargan con `pnpm db:seed` (después de `pnpm db:migrate`). El script es idempotente: cada fila tiene un id determinístico y se inserta con `ON CONFLICT DO NOTHING`, así que correrlo dos veces no duplica nada. Se niega a correr con `NODE_ENV=production`.

**Contraseña de todas las cuentas:** `Puente-Demo-2025`

Los turnos se generan relativos a la semana actual (hora de Argentina). Para volver a "ahora" hay que sembrar sobre una base limpia: una segunda corrida no mueve las fechas ya cargadas.

## Cuentas

| Rol | Email | Caso |
| --- | --- | --- |
| Admin | `admin@puente.demo` | Catálogos, consentimientos, plantillas, usuarios y auditoría |
| Paciente 1 | `sofia.molina@puente.demo` | Vínculo **activo** con Lucía Ferrari: 6 semanas de historia, diario, indicaciones, resúmenes y progreso |
| Paciente 2 | `tomas.acosta@puente.demo` | Vínculo **activo** con Valentina Ríos, con historia y resúmenes propios |
| Paciente 3 | `julieta.navarro@puente.demo` | Vínculo **solicitado** (`requested`) con Martín Quiroga, con mensajes previos al vínculo sin responder |
| Paciente 4 | `matias.gimenez@puente.demo` | Vínculo en **espera de consentimiento** (`awaiting_consent`) con Joaquín Benítez |
| Paciente 5 | `carolina.luna@puente.demo` | Vínculo **finalizado** (`ended`) con Camila Sosa, con resumen de cierre aprobado y pedido de copia de historia clínica |
| Profesional 1 | `lucia.ferrari@puente.demo` | Atiende al paciente 1 (online, cognitivo-conductual) |
| Profesional 2 | `martin.quiroga@puente.demo` | Tiene la solicitud pendiente del paciente 3 |
| Profesional 3 | `valentina.rios@puente.demo` | Atiende al paciente 2 |
| Profesional 4 | `joaquin.benitez@puente.demo` | Espera el consentimiento del paciente 4 |
| Profesional 5 | `camila.sosa@puente.demo` | Vínculo finalizado con el paciente 5 |
| Profesionales 6 a 10 | `<nombre>.<apellido>@puente.demo` | Perfiles publicados y con disponibilidad, sin vínculos: sirven para probar búsqueda y solicitudes nuevas |

Los emails se arman en minúsculas y sin tildes ni espacios (`emailFor` en `lib/db/seed/people.ts`).

## Qué carga cada módulo

- `catalogs.ts`: ramas, enfoques teóricos, coberturas y programas con bonificaciones, consentimiento v1, términos, privacidad, 3 plantillas globales y configuración por defecto.
- `people.ts`: usuarios, cuentas con contraseña, perfiles profesionales (atenciones, disponibilidad, coberturas) y perfiles de pacientes.
- `connections.ts`: vínculos en todos los estados, conversaciones previas al vínculo y de vínculo con mensajes, aceptaciones de consentimiento e intake.
- `agenda.ts`: turnos realizados, cancelado, próximos y pendientes de confirmar.
- `clinical.ts`: entradas de historia clínica con hash de contenido, enmiendas y pedido de copia.
- `follow-up.ts`: diario del paciente, indicaciones y actualizaciones de progreso.
- `summaries.ts`: resúmenes semanales y resumen de cierre aprobado.
