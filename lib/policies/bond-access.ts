import { allow, deny, type PolicyResult } from './result'
import type { BondStatus } from './patient-visibility'

/**
 * - `read-active`: lectura de lo que solo existe mientras el vínculo está activo.
 * - `read-historical`: lectura que se conserva tras finalizar el vínculo (R-03).
 * - `write`: cualquier escritura. Solo con vínculo activo.
 */
export type BondAccessMode = 'read-active' | 'read-historical' | 'write'

export type BondResource =
  | 'clinical_record'
  | 'intake'
  | 'closing_summary'
  | 'journal'
  | 'messaging'
  | 'indications'
  | 'weekly_summary'
  | 'progress'

/** R-03: el registro clínico, el intake y el resumen de cierre se conservan de solo lectura. */
const HISTORICAL_RESOURCES: ReadonlySet<BondResource> = new Set([
  'clinical_record',
  'intake',
  'closing_summary',
])

export function modeFor(resource: BondResource, action: 'read' | 'write'): BondAccessMode {
  if (action === 'write') return 'write'
  return HISTORICAL_RESOURCES.has(resource) ? 'read-historical' : 'read-active'
}

export function bondAllowsMode(status: BondStatus, mode: BondAccessMode): PolicyResult {
  if (status === 'active') return allow()

  if (status === 'ended' && mode === 'read-historical') return allow()

  if (status === 'ended') {
    return deny(
      'R-03',
      'bond_ended',
      mode === 'write'
        ? 'El vínculo finalizó. Solo se puede consultar el registro clínico.'
        : 'El vínculo finalizó. Ya no tenés acceso a este contenido.',
    )
  }

  return deny('R-02', 'bond_not_active', 'El vínculo todavía no está activo.')
}
