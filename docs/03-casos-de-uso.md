# 03 — Casos de uso

Formato: **Actor** · **Precondición** · **Flujo principal** · **Alternativas / errores** · **Reglas**.

---

## Módulo A — Identidad y perfiles

### CU-A-01 Registrarse
- **Actor:** Visitante
- **Flujo:** elige el rol (paciente o profesional), carga email, contraseña, nombre y fecha de nacimiento, y acepta los términos y la política de privacidad (datos sensibles, Ley 25.326). Se crea la cuenta y se redirige al onboarding del rol.
- **Errores:** email ya registrado; menor de 18 (R-06); contraseña débil.

### CU-A-02 Iniciar y cerrar sesión
- **Actor:** Paciente, Profesional, Admin
- **Flujo:** email y contraseña. Redirige al panel del rol.

### CU-A-03 Completar perfil profesional (onboarding)
- **Actor:** Profesional
- **Flujo:** foto, bio, matrícula (número y jurisdicción), ramas (catálogo, varias), enfoque teórico, modalidad (presencial, online o ambas), ubicación (provincia, localidad, dirección opcional), idiomas, honorarios de referencia y coberturas o programas aceptados. Publica el perfil.
- **Reglas:** el perfil no aparece en búsquedas hasta completar los campos obligatorios. Muestra "Matrícula no verificada" (P-03).

### CU-A-04 Editar perfil profesional
- **Actor:** Profesional · los cambios impactan en el perfil público.

### CU-A-05 Completar perfil del paciente
- **Actor:** Paciente
- **Flujo:** datos personales (nombre, apellido, DNI, fecha de nacimiento, género opcional, teléfono, provincia, localidad, cobertura o programa, contacto de emergencia), y **temas iniciales** en texto libre (una o varias razones).
- **Reglas:** R-01 y R-02 definen qué ve el profesional.

### CU-A-06 Registrar experiencias pasadas
- **Actor:** Paciente
- **Flujo:** agrega tratamientos anteriores con período, motivo, resultado o percepción, y profesional, que puede ser **de la plataforma** (selección) o **externo** (nombre libre). Puede adjuntar un resumen de cierre recibido en la plataforma.

---

## Módulo B — Búsqueda y conexión

### CU-B-01 Buscar profesionales por filtros
- **Actor:** Visitante, Paciente
- **Flujo:** filtra por rama, modalidad, provincia o localidad, cobertura o programa estatal, rango de honorarios, idioma y "con disponibilidad esta semana". Ve un listado de tarjetas.

### CU-B-02 Buscar en lenguaje natural (mock)
- **Actor:** Visitante, Paciente
- **Flujo:** escribe lo que le pasa ("Me cuesta dormir desde que perdí mi trabajo"). El motor de recomendación (mock) interpreta el texto, sugiere ramas y temas detectados y devuelve profesionales recomendados con el motivo de cada recomendación.
- **Reglas:** la interfaz deja claro que es una sugerencia orientativa, no un diagnóstico.

### CU-B-03 Ver perfil público del profesional
- **Actor:** Visitante, Paciente
- **Flujo:** ve los datos públicos, las ramas, las atenciones y la próxima disponibilidad. Las acciones "Enviar mensaje" y "Solicitar vínculo" piden inicio de sesión si es visitante.

### CU-B-04 Iniciar chat con un profesional (primera interacción)
- **Actor:** Paciente · **Precondición:** sesión iniciada
- **Flujo:** se crea una conversación en estado `previa`. El paciente envía un mensaje y el profesional responde.
- **Alternativas:** el profesional cierra o bloquea la conversación (R-09).

### CU-B-05 Solicitar vínculo terapéutico
- **Actor:** Paciente
- **Flujo:** desde el perfil o el chat, envía la solicitud con un mensaje y, opcionalmente, una solicitud de "primera consulta" en un turno disponible. Estado `solicitado`.

### CU-B-06 Aceptar o rechazar un vínculo
- **Actor:** Profesional
- **Flujo:** ve la solicitud con los datos parciales (R-01) y **acepta** o **rechaza** con un motivo opcional.
- **Al aceptar:** el paciente recibe el **consentimiento informado** (CU-B-07). El vínculo pasa a `activo` al aceptarlo.

### CU-B-07 Aceptar consentimiento informado
- **Actor:** Paciente
- **Flujo:** lee la versión vigente (encuadre, confidencialidad y sus límites, uso de la plataforma, teleconsulta, tratamiento de datos) y la acepta. Se guardan la versión, la fecha y la IP (R-08).

### CU-B-08 Romper el vínculo
- **Actor:** Paciente o Profesional
- **Flujo:** confirma la finalización con un motivo. El vínculo pasa a `finalizado`. Se cancelan los turnos futuros. Se ofrece al profesional generar el **resumen de cierre** (CU-F-04) y al paciente solicitarlo (CU-F-05).
- **Reglas:** R-03.

### CU-B-09 Mensajería durante el vínculo
- **Actor:** Paciente, Profesional
- **Flujo:** la conversación pasa a estado `vinculo`. Admite texto y adjuntos.

---

## Módulo C — Agenda y turnos

### CU-C-01 Definir tipos de atención
- **Actor:** Profesional
- **Flujo:** crea atenciones con nombre (ej. "Primera consulta", "Sesión individual"), duración, modalidad, honorario de referencia y coberturas aplicables.

### CU-C-02 Definir disponibilidad
- **Actor:** Profesional
- **Flujo:** carga franjas recurrentes (día, desde, hasta, modalidad) y **excepciones** (bloqueo de fechas o franjas extra). Configura la anticipación mínima para reservar y para cancelar (P-05).

### CU-C-03 Solicitar turno
- **Actor:** Paciente
- **Flujo:** elige la atención, ve los turnos libres calculados y solicita uno. Estado `solicitado`. El turno queda **reservado provisionalmente**.
- **Reglas:** R-10.

### CU-C-04 Confirmar o rechazar turno
- **Actor:** Profesional · `solicitado` pasa a `confirmado` o `rechazado`.

### CU-C-05 Cancelar turno
- **Actor:** Paciente o Profesional
- **Reglas:** el paciente solo puede cancelar fuera de la anticipación mínima. Dentro de ella, se marca como "cancelación tardía". El profesional puede cancelar siempre, con un motivo.

### CU-C-06 Reprogramar turno
- **Actor:** Paciente (solicita) o Profesional (propone)
- **Flujo:** se crea un turno nuevo `solicitado` enlazado al original, que queda `reprogramado`. Si se rechaza, el original vuelve a `confirmado`.

### CU-C-07 Recibir recordatorios
- **Actor:** Sistema
- **Flujo:** notificación interna 24 h y 1 h antes del turno. El email es opcional (P-09).

### CU-C-08 Marcar turno realizado o ausente
- **Actor:** Profesional · después de la hora del turno. Un turno realizado habilita el registro de la nota de sesión vinculada.

### CU-C-09 Realizar sesión online
- **Actor:** Paciente, Profesional
- **Flujo:** desde el turno confirmado online, el botón "Entrar a la sesión" se habilita 10 minutos antes y abre la sala de videollamada embebida (P-04). La sala es única por turno.

---

## Módulo D — Registro clínico (historia clínica)

### CU-D-01 Registrar punto de inicio
- **Actor:** Profesional · **Precondición:** vínculo activo
- **Flujo:** texto libre o basado en plantilla. Única por vínculo; las ampliaciones se hacen como enmiendas.

### CU-D-02 Registrar primeras impresiones
- **Actor:** Profesional · igual que CU-D-01.

### CU-D-03 Registrar nota de evolución (cambios y mejoras)
- **Actor:** Profesional
- **Flujo:** nota de texto libre o con plantilla, opcionalmente asociada a un turno realizado. Puede incluir una actualización de progreso (CU-F-06).

### CU-D-04 Enmendar una entrada
- **Actor:** Profesional
- **Flujo:** agrega una enmienda a una entrada existente. El original permanece visible y marcado como "enmendado" (R-04).

### CU-D-05 Gestionar plantillas
- **Actor:** Profesional (propias), Admin (globales) (P-10)
- **Flujo:** nombre, tipo de entrada a la que aplica y estructura con secciones de texto.

### CU-D-06 Ver historia clínica completa
- **Actor:** Profesional
- **Flujo:** línea de tiempo con todas las entradas, enmiendas, turnos y resúmenes del vínculo.

### CU-D-07 Solicitar copia de historia clínica
- **Actor:** Paciente → Profesional (P-02)
- **Flujo:** el paciente solicita; el profesional exporta y entrega. Queda registrado.

---

## Módulo E — Registro del paciente y tratamiento

### CU-E-01 Registrar necesidades y motivo de inicio
- **Actor:** Paciente
- **Flujo:** al activarse el vínculo, completa una sola vez qué necesita y por qué decide iniciar tratamiento. Después es solo lectura.

### CU-E-02 Escribir en el diario
- **Actor:** Paciente · **Precondición:** al menos un vínculo activo (P-01)
- **Flujo:** crea entradas cuando lo necesite, de tipo **conflicto**, **necesidad** u **otro**. Lleva texto y un estado de ánimo opcional. Se agrupan por semana.
- **Reglas:** R-07. No puede ocultarlas.

### CU-E-03 Ver diario del paciente en tiempo real
- **Actor:** Profesional
- **Flujo:** ve las entradas nuevas con un indicador de "no leídas".

### CU-E-04 Crear indicación
- **Actor:** Profesional
- **Flujo:** título, descripción, tipo (pauta, ejercicio, lectura, otro), recursos adjuntos (archivos o enlaces) y frecuencia o vigencia opcionales.

### CU-E-05 Ver tratamiento e indicaciones
- **Actor:** Paciente
- **Flujo:** lista de indicaciones vigentes y archivadas. Puede marcarlas como vistas y dejar un comentario o feedback.

### CU-E-06 Enviar feedback o recurso
- **Actor:** Profesional
- **Flujo:** por mensaje (CU-B-09) o adjunto a una indicación.

---

## Módulo F — Resúmenes y progreso

### CU-F-01 Generar resumen semanal automático
- **Actor:** Sistema
- **Flujo:** cada lunes a las 00:00 (hora de Argentina) se cierra la semana anterior por vínculo activo. Se genera un resumen con las entradas del diario por tipo, la evolución del estado de ánimo, las indicaciones vistas o comentadas, los turnos y los mensajes. Se guarda y se acumula.
- **Opcional:** el botón "Redactar con IA" genera un texto narrativo (mock, P-06).

### CU-F-02 Ver resumen semanal
- **Actor:** Profesional · puede agregar anotaciones privadas al resumen.

### CU-F-03 Ver resumen histórico
- **Actor:** Profesional
- **Flujo:** vista consolidada de todo el vínculo: punto de inicio, línea de tiempo de progreso, resúmenes semanales acumulados, hitos y la redacción opcional con IA.

### CU-F-04 Generar y aprobar resumen de cierre
- **Actor:** Profesional
- **Flujo:** se crea un borrador precargado con datos del vínculo. El profesional lo edita y lo **aprueba**. Al aprobarlo queda visible para el paciente y es inmutable.

### CU-F-05 Solicitar y exportar resumen de cierre
- **Actor:** Paciente
- **Flujo:** solicita el resumen al concluir el tratamiento. Cuando está aprobado, lo ve y lo **exporta en PDF**. Puede adjuntarlo a experiencias pasadas para futuros profesionales.

### CU-F-06 Registrar progreso
- **Actor:** Profesional
- **Flujo:** define el formato por paciente (P-11) y registra actualizaciones con fecha y una nota opcional.

### CU-F-07 Configurar visibilidad del progreso
- **Actor:** Profesional
- **Flujo:** elige por paciente entre **permitir que el paciente decida**, **recomendar verlo o no verlo** (con un mensaje) o **bloquear**.

### CU-F-08 Elegir ver el progreso
- **Actor:** Paciente
- **Flujo:** activa o desactiva "Ver mi progreso". Si está bloqueado, ve un aviso. Si hay una recomendación, la ve antes de decidir (R-05).

---

## Módulo G — Administración

### CU-G-01 Gestionar catálogo de ramas
### CU-G-02 Gestionar programas estatales y coberturas (obras sociales, prepagas, programas públicos y bonificaciones)
### CU-G-03 Gestionar versiones del consentimiento informado y términos
### CU-G-04 Gestionar plantillas globales de registro clínico
### CU-G-05 Configurar parámetros (anticipación de turnos, ventana de edición del diario, día de cierre semanal, activación de la búsqueda en lenguaje natural)
### CU-G-06 Gestionar usuarios (listar, suspender o reactivar, sin acceso a datos clínicos)
### CU-G-07 Consultar registro de auditoría

---

## Trazabilidad con los requisitos originales

| Requisito original | Casos de uso |
|--------------------|--------------|
| Perfil profesional definido y ramas | CU-A-03, CU-A-04, CU-G-01 |
| Perfil del paciente y temas iniciales | CU-A-05 |
| Búsquedas, primeras interacciones y oportunidades de conexión | CU-B-01, CU-B-03, CU-B-04 |
| Búsqueda por rama y lenguaje natural | CU-B-01, CU-B-02 |
| Atenciones y turnos | CU-C-01 a CU-C-09 |
| Confirmar el vínculo | CU-B-05 a CU-B-08 |
| Punto de inicio y primeras impresiones | CU-D-01, CU-D-02 |
| Necesidades y por qué del inicio | CU-E-01 |
| Experiencias pasadas y resumen al concluir | CU-A-06, CU-F-04, CU-F-05 |
| Conflictos y necesidades semanales | CU-E-02 |
| Resumen semanal para el profesional | CU-F-01, CU-F-02 |
| Resumen de todo el histórico | CU-F-03 |
| Registrar cambios y mejoras | CU-D-03, CU-F-06 |
| El paciente ve tratamientos | CU-E-04, CU-E-05 |
| Búsqueda compatible con políticas estatales | CU-B-01, CU-G-02 |
| Visibilidad del progreso condicionada | CU-F-07, CU-F-08 |
