import { DAY_MS, DEFAULT_RULES } from './defaults'
import { allow, deny, type PolicyResult } from './result'

export type ConversationStatus = 'pre_bond' | 'bond' | 'closed' | 'blocked'

/** R-09: máximo de conversaciones pre-vínculo abiertas por paciente. */
export function canStartPreBondConversation(
  openPreBondCount: number,
  max: number = DEFAULT_RULES.maxPreBondConversations,
): PolicyResult {
  if (openPreBondCount < max) return allow()
  return deny(
    'R-09',
    'too_many_open_conversations',
    `Ya tenés ${max} conversaciones abiertas con profesionales. Esperá una respuesta o cerrá alguna para iniciar otra.`,
  )
}

export type PatientSendInput = {
  status: ConversationStatus
  /** Mensajes del paciente enviados desde que se abrió la conversación. */
  patientMessagesBeforeReply: number
  professionalHasReplied: boolean
}

/** R-09 y P-12: tope de mensajes del paciente hasta la primera respuesta. */
export function canPatientSendMessage(
  input: PatientSendInput,
  maxBeforeReply: number = DEFAULT_RULES.maxMessagesBeforeReply,
): PolicyResult {
  if (input.status === 'blocked') {
    return deny('R-09', 'conversation_blocked', 'Esta conversación fue bloqueada por el profesional.')
  }
  if (input.status === 'closed') {
    return deny('R-09', 'conversation_closed', 'Esta conversación está cerrada.')
  }
  if (
    input.status === 'pre_bond' &&
    !input.professionalHasReplied &&
    input.patientMessagesBeforeReply >= maxBeforeReply
  ) {
    return deny(
      'R-09',
      'awaiting_first_reply',
      'Ya enviaste el máximo de mensajes. Esperá la respuesta del profesional para seguir escribiendo.',
    )
  }
  return allow()
}

export function canProfessionalSendMessage(status: ConversationStatus): PolicyResult {
  if (status === 'blocked' || status === 'closed') {
    return deny('R-09', 'conversation_not_open', 'La conversación no admite nuevos mensajes.')
  }
  return allow()
}

/** R-09: una conversación pre-vínculo se cierra sola tras 30 días sin actividad. */
export function isConversationInactive(
  lastActivityAt: Date,
  now: Date = new Date(),
  days: number = DEFAULT_RULES.chatInactivityDays,
): boolean {
  return now.getTime() - lastActivityAt.getTime() >= days * DAY_MS
}
