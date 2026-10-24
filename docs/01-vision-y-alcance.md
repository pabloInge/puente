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
| Mensajería | Antes y durante el vínculo |
| Atención / turno | Atención = tipo de servicio. Turno = franja horaria |
| Disponibilidad | Recurrente (ej. lunes 9 a 13) y excepciones puntuales |
| Reserva | El paciente solicita y el profesional confirma |
| Cancelación / reprogramación | Sí, con reglas. Con recordatorios |
| Pagos | Fuera de alcance |
| Sesiones online | Videollamada **dentro** de la plataforma |
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

## 5. Decisiones pendientes

| ID | Tema | Por qué importa | Propuesta por defecto |
|----|------|-----------------|-----------------------|
| P-01 | ¿Un paciente puede tener **varios profesionales activos** a la vez? Si cambia de profesional, ¿qué historial ve el nuevo? (pregunta 7 sin responder) | Define si el diario y los datos son del paciente o de cada vínculo | Se permiten varios vínculos activos. Cada vínculo tiene su propio registro clínico. Las experiencias pasadas y el resumen de cierre los comparte el paciente de forma explícita |
| P-02 | **Conflicto legal:** la Ley 26.529 (art. 14) establece que el paciente es titular de su historia clínica y puede pedir una copia. Notas "privadas" no pueden negarse ante esa solicitud | Afecta el diseño de notas y exportación | Las notas no se ven en la app del paciente, pero existe el flujo "Solicitar copia de historia clínica", que el profesional responde exportando. Validar con asesoría legal |
| P-03 | Historia clínica legal **sin matrícula verificada** | Un registro legal exige autor identificado y habilitado | En la demo, los perfiles muestran "Matrícula no verificada" y el registro guarda la matrícula declarada |
| P-04 | **Proveedor de videollamada** | Costo, privacidad y esfuerzo de integración | Jitsi embebido para la demo (sin costo, sin cuenta). Evaluar Daily o LiveKit para producción |
| P-05 | **Reglas concretas** de cancelación y reprogramación | Lógica de agenda | Configurable por profesional: anticipación mínima para cancelar (por defecto 24 h). Admin define el valor por defecto |
| P-06 | Resúmenes con **IA real o mockeada** en la demo | Requiere AI Gateway y consideraciones de privacidad sobre datos de salud | Resumen semanal real por agregación (sin IA). El botón "Redactar con IA" usa un mock tras una interfaz, como la búsqueda en lenguaje natural |
| P-07 | **Listado definitivo de ramas** | Catálogo inicial | Ver propuesta en [04 — Modelo §3.1](./04-modelo-de-datos.md#31-catálogo-inicial-de-ramas-propuesta) |
| P-08 | Qué datos ve el profesional **antes** del vínculo | Privacidad | Nombre de pila, edad, provincia, temas iniciales y mensaje de solicitud |
| P-09 | Canal de **recordatorios** | Email (Resend) o solo notificaciones internas | Notificaciones internas en la demo. Email con Resend como commit opcional |
| P-10 | ¿Quién crea las **plantillas** de registro clínico? | Permisos y modelo | Admin crea plantillas globales; cada profesional crea las suyas |
| P-11 | **Formato del progreso** | UI y modelo | El profesional elige por paciente: etapas con nombre, porcentaje o escala 1 a 10, con una nota opcional en cada actualización |
| P-12 | Reglas del **chat pre-vínculo**: quién lo inicia y si tiene límites | Abuso y carga del profesional | Solo lo inicia el paciente. El profesional puede cerrar o bloquear la conversación |
