# proyecto-ship — Documentación técnica

Plataforma de psicología con dos enfoques:

1. **Conexión (público):** búsqueda de profesionales y primer contacto entre futuros pacientes y psicólogos, preparada para integrarse con políticas estatales.
2. **Seguimiento (núcleo):** espacio compartido entre profesional y paciente para registrar el tratamiento, el histórico, indicaciones, avances y resúmenes.

## Documentos

| # | Documento | Contenido |
|---|-----------|-----------|
| 01 | [Visión y alcance](./01-vision-y-alcance.md) | Contexto, objetivos, alcance de la demo, definiciones confirmadas, decisiones pendientes |
| 02 | [Actores y permisos](./02-actores-y-permisos.md) | Roles, matriz de permisos, reglas de visibilidad de datos |
| 03 | [Casos de uso](./03-casos-de-uso.md) | Casos de uso detallados por módulo |
| 04 | [Modelo de datos](./04-modelo-de-datos.md) | Entidades, relaciones, máquinas de estado |
| 05 | [Arquitectura](./05-arquitectura.md) | Stack, estructura, sistema de diseño intercambiable, seguridad, cumplimiento legal, preparación estatal |
| 06 | [Plan de commits](./06-plan-de-commits.md) | Funcionalidades ordenadas en commits con criterios de aceptación |

## Convenciones

- Identificadores de casos de uso: `CU-<módulo>-<n>` (ej. `CU-B-03`).
- Decisiones pendientes: `P-<n>`. Ninguna funcionalidad marcada con una pendiente se implementa hasta resolverla.
- Cada commit del plan referencia los casos de uso que cubre.
