# 02 — Actores y permisos

## 1. Actores

| Actor | Descripción |
|-------|-------------|
| **Visitante** | Persona sin cuenta. Puede buscar y ver perfiles públicos |
| **Paciente** | Usuario mayor de 18 años registrado como paciente |
| **Profesional** | Psicólogo registrado. Matrícula declarada, sin verificar en esta etapa |
| **Admin** | Configura catálogos, plantillas globales, programas, consentimientos y usuarios |
| **Sistema** | Procesos automáticos: cierre semanal, resúmenes, recordatorios, auditoría |
| **Motor de recomendación** | Servicio reemplazable (mock en la demo) para lenguaje natural y recomendaciones |

Una cuenta tiene **un solo rol**. Si una persona necesita ambos roles, usa dos cuentas. Revisable a futuro.

## 2. Matriz de permisos

Leyenda: **C** crear · **L** leer · **E** editar · **B** borrar o desactivar · **—** sin acceso · *propio* = solo sus registros

| Recurso | Visitante | Paciente | Profesional | Admin |
|---------|-----------|----------|-------------|-------|
| Perfil público del profesional | L | L | CLE *propio* | L, B (suspender) |
| Perfil del paciente | — | CLE *propio* | L parcial sin vínculo, L total con vínculo activo | L (datos de cuenta, no clínicos) |
| Búsqueda y recomendaciones | L | L | — | Config |
| Conversación y mensajes | — | C (inicia), L, E *propio* | L, responde, cierra o bloquea | — |
| Solicitud de vínculo | — | C, cancelar | Aceptar, rechazar | — |
| Vínculo activo | — | L, romper | L, romper | L (metadatos) |
| Consentimiento informado | — | Aceptar | L | CLE (versiones) |
| Tipos de atención y disponibilidad | L (en perfil) | L | CLE *propio* | — |
| Turnos | — | Solicitar, cancelar, pedir reprogramación | Confirmar, rechazar, cancelar, reprogramar, marcar realizado o ausente | — |
| Sesión de videollamada | — | Entrar a su turno confirmado | Entrar a su turno confirmado | — |
| Registro clínico (inicio, impresiones, evolución) | — | Solicitar copia (R-14) | C, L *propio vínculo*, enmienda (sin editar ni borrar), exportar copia | — |
| Plantillas de registro | — | — | CLE *propias*, L globales | CLE globales |
| Indicaciones y recursos | — | L, marcar como vista | CLE *propio vínculo* | — |
| Necesidades y motivo de inicio | — | C (una vez), L | L con vínculo | — |
| Experiencias pasadas | — | CLE *propio* | L con vínculo | — |
| Diario | — | CL *propio*, E en ventana corta (ver regla R-07) | L en tiempo real con vínculo activo | — |
| Resumen semanal | — | L (si el profesional lo comparte) | L, anotar | — |
| Resumen histórico | — | — | L | — |
| Resumen de cierre | — | Solicitar, L cuando esté aprobado, exportar | C, E (borrador), aprobar, exportar | — |
| Progreso | L condicionado | — | CLE | — |
| Catálogos (ramas, programas, coberturas) | — | — | L | CLE |
| Usuarios | — | — | — | L, suspender |
| Registro de auditoría | — | — | — | L |

## 3. Reglas de visibilidad y negocio

- **R-01 — Datos del paciente sin vínculo:** el profesional ve solo nombre de pila, edad (calculada, no la fecha de nacimiento), provincia, temas iniciales y el mensaje de solicitud (P-08).
- **R-02 — Datos del paciente con vínculo activo:** el profesional ve el perfil completo, necesidades, motivo de inicio, experiencias pasadas y diario.
- **R-03 — Vínculo finalizado:** el profesional conserva acceso de **solo lectura** al registro clínico (obligación legal de custodia). Pierde acceso a entradas nuevas del diario y a la mensajería.
- **R-04 — Registro clínico inalterable:** las entradas no se editan ni se borran. Las correcciones se hacen con una **enmienda** vinculada, con autor y fecha (Ley 26.529).
- **R-05 — Progreso visible para el paciente** si el profesional **no** lo bloqueó **y** el paciente eligió verlo. La recomendación del profesional se muestra como un mensaje, pero no obliga.
- **R-06 — Mayoría de edad:** el registro exige una fecha de nacimiento de 18 años o más.
- **R-07 — Edición del diario:** el paciente puede corregir una entrada durante 15 minutos. Después queda fija, porque el profesional puede haberla leído. Valor configurable por Admin.
- **R-08 — Consentimiento:** no se activa un vínculo sin que el paciente acepte la versión vigente del consentimiento informado. Se guarda la versión aceptada y la fecha.
- **R-09 — Chat pre-vínculo:** lo inicia solo el paciente registrado. Máximo 3 conversaciones pre-vínculo abiertas por paciente. Hasta la primera respuesta del profesional, el paciente puede enviar como máximo 3 mensajes. Se cierra sola tras 30 días sin actividad. El profesional puede cerrarla o bloquear al paciente (P-12).
- **R-10 — Turnos:** solo pacientes con vínculo activo pueden solicitar turnos de seguimiento. La "primera consulta" puede solicitarse junto con la solicitud de vínculo. Anticipación mínima para solicitar: 12 h. Cancelar o reprogramar sin penalidad: hasta 24 h antes. Un turno sin confirmar vence a las 48 h o 2 h antes del inicio. Una sola reprogramación por turno a pedido del paciente (P-05).
- **R-11 — Auditoría:** todo acceso de lectura o escritura a datos clínicos queda registrado (quién, qué, cuándo).
- **R-12 — Un vínculo a la vez:** un paciente tiene como máximo un vínculo en estado `requested`, `awaiting_consent` o `active`. Se garantiza con un índice único parcial y se valida en el servicio con un mensaje claro (P-01).
- **R-13 — Cambio de profesional:** al terminar un vínculo, el sistema crea una **experiencia pasada** con el profesional de la plataforma, que el paciente puede completar. El profesional nuevo ve las experiencias pasadas, pero **no** la historia clínica, el diario, las indicaciones ni los resúmenes del vínculo anterior. Solo ve el resumen de cierre si el paciente lo adjunta a la experiencia pasada.
- **R-14 — Copia de historia clínica:** el profesional debe entregarla dentro de las 48 h de solicitada (Ley 26.529, art. 14). La plataforma muestra el vencimiento y registra la entrega (P-02).
- **R-15 — Custodia:** la historia clínica se conserva al menos 10 años desde la última actuación (Ley 26.529, art. 18). No hay borrado físico, ni siquiera al eliminar la cuenta.
