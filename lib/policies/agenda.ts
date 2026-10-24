import { DEFAULT_RULES, HOUR_MS } from './defaults'
import type { BondStatus } from './patient-visibility'
import { allow, deny, type PolicyResult } from './result'

const OPEN_BOND_STATUSES: readonly BondStatus[] = ['requested', 'awaiting_consent', 'active']

export type RequestAppointmentInput = {
  /** Estado del vínculo del paciente con ese profesional, o null si no hay. */
  bondStatus: BondStatus | null
  isFirstConsultation: boolean
}

/**
 * R-10: solo pacientes con vínculo activo piden turnos de seguimiento.
 * La primera consulta puede pedirse junto con la solicitud de vínculo.
 */
export function canRequestAppointment(input: RequestAppointmentInput): PolicyResult {
  if (input.bondStatus === 'active') return allow()

  if (
    input.isFirstConsultation &&
    input.bondStatus !== null &&
    OPEN_BOND_STATUSES.includes(input.bondStatus)
  ) {
    return allow()
  }

  return deny(
    'R-10',
    'appointment_requires_bond',
    input.isFirstConsultation
      ? 'Para pedir la primera consulta, primero enviá una solicitud de vínculo.'
      : 'Solo podés pedir turnos de seguimiento con un profesional con quien tengas un vínculo activo.',
  )
}

/** R-10: anticipación mínima para solicitar. */
export function meetsBookingNotice(
  startsAt: Date,
  now: Date = new Date(),
  hours: number = DEFAULT_RULES.minBookingNoticeHours,
): PolicyResult {
  if (startsAt.getTime() - now.getTime() >= hours * HOUR_MS) return allow()
  return deny(
    'R-10',
    'insufficient_notice',
    `Los turnos se piden con al menos ${hours} horas de anticipación.`,
  )
}

/** R-10: cancelar o reprogramar con menos de 24 h es una cancelación tardía. */
export function isLateCancellation(
  startsAt: Date,
  now: Date = new Date(),
  hours: number = DEFAULT_RULES.minCancelNoticeHours,
): boolean {
  return startsAt.getTime() - now.getTime() < hours * HOUR_MS
}

/** R-10: vence a las 48 h o 2 h antes del inicio, lo que ocurra primero. */
export function requestExpiresAt(
  requestedAt: Date,
  startsAt: Date,
  expiryHours: number = DEFAULT_RULES.requestExpiryHours,
  beforeStartHours: number = DEFAULT_RULES.requestExpiryBeforeStartHours,
): Date {
  const byAge = requestedAt.getTime() + expiryHours * HOUR_MS
  const byStart = startsAt.getTime() - beforeStartHours * HOUR_MS
  return new Date(Math.min(byAge, byStart))
}

export function isRequestExpired(expiresAt: Date, now: Date = new Date()): boolean {
  return now.getTime() >= expiresAt.getTime()
}

/** R-10 y P-05: el paciente reprograma una sola vez por turno. */
export function canPatientReschedule(
  patientRescheduleCount: number,
  max: number = DEFAULT_RULES.maxPatientReschedules,
): PolicyResult {
  if (patientRescheduleCount < max) return allow()
  return deny(
    'R-10',
    'reschedule_limit',
    'Este turno ya se reprogramó una vez. Si no podés asistir, cancelalo y pedí uno nuevo.',
  )
}
