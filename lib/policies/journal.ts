import { DEFAULT_RULES, MINUTE_MS } from './defaults'
import { allow, deny, type PolicyResult } from './result'

/** R-07: fecha límite para corregir una entrada del diario. */
export function journalEditableUntil(
  createdAt: Date,
  editMinutes: number = DEFAULT_RULES.journalEditMinutes,
): Date {
  return new Date(createdAt.getTime() + editMinutes * MINUTE_MS)
}

export function canEditJournalEntry(editableUntil: Date, now: Date = new Date()): PolicyResult {
  if (now.getTime() <= editableUntil.getTime()) return allow()
  return deny(
    'R-07',
    'journal_locked',
    'Ya pasó el tiempo para corregir esta entrada. Podés escribir una nueva.',
  )
}

/** Lunes (UTC-3, Argentina) de la semana de una fecha, como `YYYY-MM-DD`. */
export function weekStartOf(date: Date): string {
  const local = new Date(date.getTime() - 3 * 60 * MINUTE_MS)
  const dayFromMonday = (local.getUTCDay() + 6) % 7
  local.setUTCDate(local.getUTCDate() - dayFromMonday)
  return local.toISOString().slice(0, 10)
}
