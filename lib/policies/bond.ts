import type { BondStatus } from './patient-visibility'
import { allow, deny, type PolicyResult } from './result'

/** R-12: estados que cuentan como vínculo abierto. Debe coincidir con el índice único parcial. */
export const OPEN_BOND_STATUSES = ['requested', 'awaiting_consent', 'active'] as const

export function isOpenBondStatus(status: BondStatus): boolean {
  return (OPEN_BOND_STATUSES as readonly string[]).includes(status)
}

/** R-12: un paciente tiene como máximo un vínculo abierto a la vez (P-01). */
export function canOpenBond(existingStatus: BondStatus | null): PolicyResult {
  if (existingStatus === null || !isOpenBondStatus(existingStatus)) return allow()

  const message =
    existingStatus === 'active'
      ? 'Ya tenés un vínculo activo con un profesional. Para trabajar con otro, primero finalizá el actual.'
      : 'Ya tenés una solicitud de vínculo en curso. Esperá la respuesta o cancelala para enviar otra.'

  return deny('R-12', 'open_bond_exists', message)
}

/** R-08: no se activa un vínculo sin aceptar la versión vigente del consentimiento. */
export function canActivateBond(consentAccepted: boolean): PolicyResult {
  if (consentAccepted) return allow()
  return deny(
    'R-08',
    'consent_required',
    'Para activar el vínculo tenés que aceptar el consentimiento informado vigente.',
  )
}
