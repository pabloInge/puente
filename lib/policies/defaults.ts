/**
 * Valores por defecto de las reglas configurables (doc 01 P-05, P-11 y doc 02 R-xx).
 * En runtime, Admin puede sobrescribirlos desde `platform_setting`; las políticas
 * reciben siempre el valor como parámetro y usan estos como respaldo.
 */
export const DEFAULT_RULES = {
  /** R-07: minutos para corregir una entrada del diario. */
  journalEditMinutes: 15,
  /** R-10: anticipación mínima para solicitar un turno. */
  minBookingNoticeHours: 12,
  /** R-10: anticipación mínima para cancelar o reprogramar sin penalidad. */
  minCancelNoticeHours: 24,
  /** R-10: horas hasta que vence un turno sin confirmar. */
  requestExpiryHours: 48,
  /** R-10: el turno sin confirmar vence como máximo X horas antes del inicio. */
  requestExpiryBeforeStartHours: 2,
  /** R-10: reprogramaciones permitidas al paciente por turno. */
  maxPatientReschedules: 1,
  /** R-09: conversaciones pre-vínculo abiertas por paciente. */
  maxPreBondConversations: 3,
  /** R-09: mensajes del paciente antes de la primera respuesta. */
  maxMessagesBeforeReply: 3,
  /** R-09: días sin actividad para cerrar una conversación pre-vínculo. */
  chatInactivityDays: 30,
  /** R-14: horas para entregar la copia de la historia clínica. */
  recordCopyDueHours: 48,
} as const

export type Rules = { -readonly [K in keyof typeof DEFAULT_RULES]: number }

export const HOUR_MS = 60 * 60 * 1000
export const MINUTE_MS = 60 * 1000
export const DAY_MS = 24 * HOUR_MS
