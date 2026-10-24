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
| Registro clínico (inicio, impresiones, evolución) | — | — (ver P-02) | C, L *propio vínculo*, enmienda (sin editar ni borrar) | — |
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

- **R-01 — Datos del paciente sin vínculo:** el profesional ve solo nombre de pila, edad, provincia, temas iniciales y el mensaje de solicitud (P-08).
- **R-02 — Datos del paciente con vínculo activo:** el profesional ve el perfil completo, necesidades, motivo de inicio, experiencias pasadas y diario.
- **R-03 — Vínculo finalizado:** el profesional conserva acceso de **solo lectura** al registro clínico (obligación legal de custodia). Pierde acceso a entradas nuevas del diario y a la mensajería.
- **R-04 — Registro clínico inalterable:** las entradas no se editan ni se borran. Las correcciones se hacen con una **enmienda** vinculada, con autor y fecha (Ley 26.529).
- **R-05 — Progreso visible para el paciente** si el profesional **no** lo bloqueó **y** el paciente eligió verlo. La recomendación del profesional se muestra como un mensaje, pero no obliga.
- **R-06 — Mayoría de edad:** el registro exige una fecha de nacimiento de 18 años o más.
- **R-07 — Edición del diario:** el paciente puede corregir una entrada durante 15 minutos. Después queda fija, porque el profesional puede haberla leído. Valor configurable por Admin.
- **R-08 — Consentimiento:** no se activa un vínculo sin que el paciente acepte la versión vigente del consentimiento informado. Se guarda la versión aceptada y la fecha.
- **R-09 — Chat pre-vínculo:** lo inicia solo el paciente registrado. El profesional puede cerrarlo o bloquearlo (P-12).
- **R-10 — Turnos:** solo pacientes con vínculo activo pueden solicitar turnos de seguimiento. La "primera consulta" puede solicitarse con la solicitud de vínculo pendiente (pendiente de confirmación).
- **R-11 — Auditoría:** todo acceso de lectura o escritura a datos clínicos queda registrado (quién, qué, cuándo).
