# Puente — Documentación técnica

Plataforma de psicología para Argentina con dos enfoques:

1. **Conexión (público):** búsqueda de profesionales y primer contacto entre futuros pacientes y psicólogos, preparada para integrarse con políticas estatales.
2. **Seguimiento (núcleo):** espacio compartido entre profesional y paciente para registrar el tratamiento, el histórico, indicaciones, avances y resúmenes.

## Documentos

| # | Documento | Contenido |
|---|-----------|-----------|
| 01 | [Visión y alcance](./01-vision-y-alcance.md) | Contexto, objetivos, alcance de la demo, definiciones y decisiones resueltas |
| 02 | [Actores y permisos](./02-actores-y-permisos.md) | Roles, matriz de permisos, reglas R-01 a R-15 |
| 03 | [Casos de uso](./03-casos-de-uso.md) | Casos de uso por módulo y trazabilidad con los requisitos |
| 04 | [Modelo de datos](./04-modelo-de-datos.md) | Entidades, restricciones, catálogos y máquinas de estado |
| 05 | [Arquitectura](./05-arquitectura.md) | Stack, estructura, diseño intercambiable, seguridad, normativa, preparación estatal |
| 06 | [Roadmap y plan de commits](./06-plan-de-commits.md) | Fases, pistas paralelas, tareas con criterios de aceptación |
| 07 | [Guía de desarrollo](./07-guia-de-desarrollo.md) | Propiedad de archivos, flujo de PR, definición de terminado |

## Convenciones

- Casos de uso: `CU-<módulo>-<n>` (ej. `CU-B-03`).
- Reglas: `R-<n>`. Decisiones: `P-<n>` (todas resueltas).
- Tareas del roadmap: `F1-0n` (fundaciones), `<pista>-0n` (fase 2), `F3-0n` (integración), `F4-0n` (opcionales), `K-n` (contrato).
- Cada tarea referencia los CU y reglas que cubre.
