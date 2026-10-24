# 01 — Visión y alcance

## 1. Contexto

Aplicación del rubro psicología para **Argentina**, mobile first con versión web trabajada. Usuarios únicamente **mayores de edad**.

- **Cara pública:** interfaz rápida para que un futuro paciente encuentre un profesional, converse con él y solicite iniciar un vínculo terapéutico. Debe poder adoptarla un sistema estatal o servir de vía para bonificar prestaciones.
- **Plataforma de seguimiento (el fuerte):** el profesional sigue el perfil y la evolución del paciente con todo su histórico. El paciente recibe feedback, indicaciones y recursos, y conserva sus avances.

## 2. Objetivos de la demo

- Demo **funcional**: autenticación real, base de datos real y datos de ejemplo precargados.
- Cubrir **todos** los requisitos de paciente y profesional enumerados. Se profundizan iterativamente.
- Interfaz conceptual inspirada en **Fluent 2**, preparada para reemplazar la identidad visual en cualquier momento (ver [05 — Arquitectura §4](./05-arquitectura.md#4-sistema-de-diseño-intercambiable)).

## 3. Definiciones confirmadas

| Tema | Definición |
|------|------------|
| Roles | Paciente, Profesional y Admin (configuración de la plataforma) |
| Verificación de matrícula | No se verifica por ahora. El campo existe |
| Perfil profesional | Foto, bio, matrícula, ramas, enfoque teórico, modalidad, ubicación, idiomas, honorarios, coberturas/programas |
| Ramas | Catálogo **predefinido** basado en áreas reconocidas de la psicología, administrado por Admin |
| Datos del paciente | Todos los necesarios para su perfil. El profesional los ve **completos solo con vínculo activo** |
| Temas iniciales | **Texto libre**. El paciente indica una o varias razones para iniciar tratamiento |
| Edad | Solo mayores de 18 |
| Búsqueda | Libre sin cuenta. Para conectar (chatear o solicitar vínculo) se requiere registro |
| Filtros | Rama, modalidad, ubicación, cobertura/programa, honorarios, idioma, disponibilidad |
| Lenguaje natural | **Mockeado** en la demo, pero visible y usable. Devuelve recomendaciones según lo escrito |
| Primera interacción | **Chat** con el profesional |
| Recomendaciones | La plataforma muestra activamente recomendaciones según el texto ingresado |
| Vínculo | Lo solicita el paciente; el profesional acepta o rechaza; cualquiera puede romperlo |
| Vínculos simultáneos | **Uno solo a la vez** por paciente (P-01) |
| Mensajería | Antes y durante el vínculo |
| Atención / turno | Atención = tipo de servicio. Turno = franja horaria |
| Disponibilidad | Recurrente (ej. lunes 9 a 13) y excepciones puntuales |
| Reserva | El paciente solicita y el profesional confirma |
| Cancelación / reprogramación | Sí, con reglas. Con recordatorios |
| Pagos | Fuera de alcance |
| Sesiones online | Videollamada **dentro** de la plataforma (Daily, P-04) |
| Registro clínico | Texto libre con **plantillas** opcionales |
| Cambios y mejoras | Notas de evolución |
| Notas del profesional | **Privadas** (ver P-02) |
| Tratamiento | Conjunto de **indicaciones** del profesional visibles para el paciente |
| Feedback | Mensajes y recursos (archivos, enlaces) |
| Necesidades y motivo de inicio | Se cargan **una sola vez** |
| Experiencias pasadas | Tratamientos anteriores con profesionales de la plataforma o externos |
| Diario | Varias entradas, cuando el paciente lo necesite. Se agrupan por semana |
| Visibilidad del diario | El profesional ve las entradas **en el momento**. El paciente **no** puede ocultarlas |
| Resúmenes | Se acumulan. Resumen semanal **automático**. Una IA puede redactarlo (ver P-06) |
| Resumen de cierre | Lo genera y aprueba el profesional. Queda en la plataforma y es **exportable** |
| Progreso | Lo define el profesional |
| Visibilidad del progreso | El paciente elige verlo o no. El profesional puede **bloquearlo** o **recomendar**, según el caso |
| Políticas estatales | Lista para que la adopte un sistema estatal o bonifique prestaciones. Filtrado por programas/coberturas |
| Historia clínica | Tiene **valor legal** |
| Consentimiento informado | Obligatorio al iniciar el vínculo |
| Botón de crisis | No |

## 4. Alcance de la demo

### Incluido
- Registro, inicio de sesión y roles.
- Perfiles de paciente y profesional, perfil público del profesional.
- Búsqueda con filtros, búsqueda en lenguaje natural mockeada y recomendaciones.
- Chat pre-vínculo y durante el vínculo.
- Solicitud, aceptación, rechazo y ruptura del vínculo con consentimiento informado.
- Tipos de atención, disponibilidad, solicitud y confirmación de turnos, cancelación y reprogramación.
- Videollamada dentro de la plataforma.
- Registro clínico (inicio, impresiones, evolución) con plantillas, inalterable.
- Indicaciones y recursos (tratamiento).
- Diario del paciente.
- Resúmenes semanales automáticos, histórico, resumen de cierre exportable.
- Progreso con visibilidad condicionada.
- Panel de administración de catálogos y configuraciones.
- Modelo de datos preparado para programas estatales y bonificaciones.

### Mockeado
- Búsqueda en lenguaje natural y motor de recomendaciones. La interfaz es real y el motor está detrás de una interfaz reemplazable.

### Fuera de alcance
- Pagos y facturación.
- Verificación de matrícula (preparado para REFEPS, ver Arquitectura).
- Integración real con sistemas estatales (solo modelo y API preparados).
- Botón o protocolo de crisis.
- Apps nativas (la web es mobile first y responsive).

## 5. Decisiones resueltas

Todas las decisiones están cerradas. Ninguna bloquea el roadmap.

| ID | Tema | Decisión | Impacto técnico |
|----|------|----------|-----------------|
| P-01 | Profesionales simultáneos | **Un solo vínculo a la vez.** El paciente puede chatear antes del vínculo con varios profesionales, pero solo puede tener **un** vínculo abierto (`requested`, `awaiting_consent` o `active`). Para empezar con otro profesional debe cancelar la solicitud o romper el vínculo actual | Índice único parcial en `bond(patient_id)` (R-12). Diario, indicaciones, resúmenes y progreso pertenecen al vínculo. El profesional nuevo **no** ve la historia clínica ni el diario del vínculo anterior; ve las experiencias pasadas y solo los resúmenes de cierre que el paciente comparta |
| P-02 | Notas privadas y Ley 26.529 | Las notas no se muestran en la app del paciente. El paciente puede **solicitar copia de su historia clínica** y el profesional debe entregarla exportada. Plazo legal: **48 h** (art. 14) | Flujo `clinical_record_request` con indicador de vencimiento de 48 h para el profesional. Exportación en PDF auditada |
| P-03 | Historia clínica sin matrícula verificada | Los perfiles muestran "Matrícula no verificada". Cada entrada guarda la matrícula declarada al momento de escribirla | `license_verified = false`, `author_license_snapshot` en cada entrada |
| P-04 | Proveedor de videollamada | **Daily (Prebuilt)** detrás de `VideoProvider`. Salas privadas por turno, con token de acceso por usuario y vencimiento al terminar el turno. Si falta `DAILY_API_KEY`, la sala muestra un aviso y no se habilita | Se descarta el Jitsi público: desde 2023 `meet.jit.si` exige login y limita los embebidos a 5 minutos. Daily tiene plan gratuito suficiente para la demo. Requiere la variable `DAILY_API_KEY` |
| P-05 | Reglas de agenda | Anticipación mínima para **solicitar**: 12 h. Para **cancelar o reprogramar** sin penalidad: 24 h; después se marca "cancelación tardía". Un turno `requested` sin confirmar **vence** a las 48 h o 2 h antes del inicio, lo que ocurra primero, y libera la franja. El paciente puede reprogramar **una vez** por turno. Los valores los define Admin por defecto y cada profesional puede ajustarlos | Campos en `professional_agenda_settings` y `platform_setting`. Cron de vencimiento junto al de recordatorios |
| P-06 | IA en resúmenes | El resumen semanal es **real por agregación**, sin IA. El botón "Redactar con IA" usa `SummaryWriter` mock. Cuando se use IA real, se envían datos **seudonimizados** (sin nombre, DNI ni contacto) | La interfaz y el mock se construyen en la base. IA real como tarea opcional |
| P-07 | Catálogo de ramas | Se adopta la propuesta de [04 — Modelo §3.1](./04-modelo-de-datos.md#31-catálogo-inicial-de-ramas). Admin puede editarla | Seed del catálogo |
| P-08 | Datos del paciente antes del vínculo | Nombre de pila, edad (no la fecha de nacimiento), provincia, temas iniciales y mensaje de solicitud | Proyección `PatientPreview` en la capa de servicios (R-01) |
| P-09 | Recordatorios | **Notificaciones internas** en la demo (centro de notificaciones con contador). Email con Resend como tarea opcional | `Notifier` con implementación sobre la tabla `notification` |
| P-10 | Plantillas de registro clínico | Admin crea plantillas **globales**. Cada profesional crea las **propias** y puede duplicar una global para adaptarla | `clinical_template.owner_professional_id` nulo para las globales |
| P-11 | Formato del progreso | El profesional elige por paciente: **etapas** (por defecto: Evaluación, Inicio, Desarrollo, Consolidación, Cierre, editables), **porcentaje** o **escala 1 a 10**. Cada actualización lleva una nota opcional. Cambiar el formato no borra el histórico | `progress_settings.format` y `stages`. Las actualizaciones guardan el formato vigente |
| P-12 | Límites del chat pre-vínculo | Lo inicia solo el paciente registrado. Máximo **3 conversaciones pre-vínculo abiertas** a la vez por paciente. Hasta que el profesional responda, el paciente puede enviar como máximo **3 mensajes**. Se cierra automáticamente tras **30 días** sin actividad. El profesional puede cerrarla o bloquear al paciente | Validaciones en el servicio de chat (R-09). Cron diario de cierre por inactividad |
