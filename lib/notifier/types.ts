/**
 * Tipos de evento que genera cada módulo. Cada pista suma los suyos acá,
 * así el centro de notificaciones y un futuro canal (email, push) comparten el catálogo.
 */
export const NOTIFICATION_TYPES = {
  bondRequested: 'bond.requested',
  bondAwaitingConsent: 'bond.awaiting_consent',
  bondActivated: 'bond.activated',
  bondRejected: 'bond.rejected',
  bondEnded: 'bond.ended',
  appointmentRequested: 'appointment.requested',
  appointmentConfirmed: 'appointment.confirmed',
  appointmentCancelled: 'appointment.cancelled',
  appointmentRescheduled: 'appointment.rescheduled',
  appointmentExpired: 'appointment.expired',
  messageReceived: 'message.received',
  indicationAssigned: 'indication.assigned',
  weeklySummaryReady: 'summary.weekly_ready',
  recordCopyRequested: 'record.copy_requested',
  recordCopyOverdue: 'record.copy_overdue',
} as const

export type NotificationType = (typeof NOTIFICATION_TYPES)[keyof typeof NOTIFICATION_TYPES]

export type NotificationEvent = {
  type: NotificationType | (string & {})
  /** Solo datos mínimos para armar el enlace y el texto. Nunca contenido clínico. */
  payload?: Record<string, unknown>
}

export interface Notifier {
  send(userId: string, event: NotificationEvent): Promise<void>
  sendMany(userIds: string[], event: NotificationEvent): Promise<void>
}
