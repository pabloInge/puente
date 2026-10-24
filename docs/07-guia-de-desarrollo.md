# 07 — Guía de desarrollo

Reglas para que varios agentes trabajen en paralelo sin pisarse.

## 1. Flujo por tarea

1. Tomar una tarea `[ ]` del [roadmap](./06-plan-de-commits.md) cuyas dependencias estén `[x]`. Marcarla `[~]` con `@agente`.
2. Crear la rama `v0/<id-tarea>-<slug>` (ej. `v0/b-02-turnos`) desde `main` actualizado.
3. Leer los documentos que cita la tarea (CU, reglas, modelo).
4. Implementar solo dentro de las carpetas de la pista.
5. Verificar los criterios de aceptación en la preview y correr `test`.
6. Marcar la tarea `[x]` en el roadmap dentro del mismo PR. Abrir el PR con la plantilla de §6.

Una tarea = un PR. Si una tarea crece, se divide en el roadmap antes de seguir.

## 2. Fuente de verdad

| Tema | Documento |
|------|-----------|
| Qué hace cada actor | 02 y 03 |
| Reglas R-xx | 02 §3 (implementadas en `lib/policies`) |
| Tablas y estados | 04 |
| Estructura y patrones | 05 |
| Decisiones P-xx | 01 §5 |

Si el código y la documentación no coinciden, se corrige la documentación **en el mismo PR** y se explica en la descripción. Si una regla no alcanza, no se inventa: se agrega una pregunta en `docs/preguntas.md` y se sigue con el resto de la tarea.

## 3. Propiedad de archivos

### Archivos compartidos (congelados después de F1)

| Archivo | Quién puede cambiarlo |
|---------|-----------------------|
| `app/globals.css`, `components/ui/**` | Solo una tarea de diseño |
| `lib/navigation.ts`, `components/layout/**` | Solo F3 o una tarea de contrato |
| `lib/db/schema/**` | Ver §4 |
| `lib/session.ts`, `lib/services/_base.ts`, `lib/services/bond-access.ts` | Solo una tarea de contrato |
| `lib/policies/**` | Se pueden **agregar** funciones; cambiar una existente requiere una tarea de contrato |
| `lib/db/seed/index.ts` | Nadie; cada pista edita solo su `seed/<módulo>.ts` |
| `package.json`, lockfile | Se puede agregar una dependencia avisando en el PR. Si hay conflicto, se regenera el lockfile |

**Tarea de contrato:** un PR pequeño, aislado, que solo cambia el contrato compartido y se integra antes que el resto. Se registra en el roadmap como `K-<n>`.

### Archivos de pista
Cada pista es dueña de las carpetas listadas en el roadmap. Para usar algo de otra pista, se **importa su servicio** (`lib/services/<x>.ts`); nunca se consulta su tabla directamente ni se edita su componente.

### Puntos de extensión (para no editar archivos ajenos)
- **Línea de tiempo:** `lib/timeline/sources/<pista>.ts`.
- **Widgets de inicio:** `components/domain/<pista>/widgets/`.
- **Seed:** `lib/db/seed/<módulo>.ts`.
- **Tipos de notificación:** `lib/notifier/types/<pista>.ts`.

## 4. Base de datos

- El esquema completo lo crea F1-03. En Fase 2 **no** debería hacer falta cambiarlo.
- Si una pista necesita un cambio: lo hace solo en el archivo de su módulo, agrega una migración aditiva (nunca renombrar ni borrar columnas) y la integra antes que cualquier otra migración pendiente. Dos PR con migraciones no se integran a la vez.
- Nunca se modifica una migración ya integrada.
- Nada de SQL fuera de `lib/services` y `lib/db`.

## 5. Definición de terminado

- [ ] Cumple los criterios de aceptación de la tarea.
- [ ] Autorización en el servicio con test de acceso denegado.
- [ ] Entradas validadas con Zod.
- [ ] Datos clínicos con auditoría (R-11).
- [ ] Sin colores directos: solo tokens y primitivas.
- [ ] Probado en 375 px y 1280 px, en modo claro y oscuro.
- [ ] Estados vacío, de carga y de error.
- [ ] Textos en español rioplatense neutro (vos, sin modismos).
- [ ] Seed de la pista actualizado si agrega datos nuevos.
- [ ] Roadmap actualizado.

## 6. Plantilla de PR

```
## Tarea
<ID> — <título> (link al roadmap)

## Qué cambia
- ...

## CU y reglas cubiertas
CU-..., R-...

## Cambios de contrato o esquema
Ninguno | Descripción

## Cómo probar
Usuario de demo: ...
Pasos: ...

## Pendientes o preguntas
...
```

## 7. Plantilla de instrucción para un agente

```
Sos el agente de la pista <X> del proyecto Puente.
Leé docs/README.md, docs/06-plan-de-commits.md y docs/07-guia-de-desarrollo.md.
Tu tarea es <ID>. Leé los documentos que cita.
Trabajá solo en las carpetas de tu pista. No edites archivos compartidos (guía §3).
Usá los servicios, políticas e interfaces de lib/. Usá el seed para probar.
Al terminar, verificá los criterios de aceptación, marcá la tarea en el roadmap
y abrí un PR con la plantilla de la guía §6.
```

## 8. Orden de integración

1. Tareas de contrato `K-n`.
2. PR con migración (de a uno).
3. Resto de PR de pista, en cualquier orden, rebasando sobre `main`.
