import { DEFAULT_RULES, HOUR_MS } from './defaults'

/** R-14: la copia de la historia clínica se entrega dentro de las 48 h (Ley 26.529, art. 14). */
export function recordCopyDueAt(
  requestedAt: Date,
  hours: number = DEFAULT_RULES.recordCopyDueHours,
): Date {
  return new Date(requestedAt.getTime() + hours * HOUR_MS)
}

export function isRecordCopyOverdue(
  dueAt: Date,
  fulfilledAt: Date | null,
  now: Date = new Date(),
): boolean {
  return fulfilledAt === null && now.getTime() > dueAt.getTime()
}

/** Horas que faltan para el vencimiento (negativo si ya venció). */
export function hoursUntilDue(dueAt: Date, now: Date = new Date()): number {
  return Math.floor((dueAt.getTime() - now.getTime()) / HOUR_MS)
}

/** R-15: la historia clínica se conserva al menos 10 años desde la última actuación. */
export const CLINICAL_RECORD_RETENTION_YEARS = 10
