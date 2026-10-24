import { describe, expect, it } from 'vitest'
import {
  canPatientSendMessage,
  canProfessionalSendMessage,
  canStartPreBondConversation,
  isConversationInactive,
} from './chat'
import { canEditJournalEntry, journalEditableUntil, weekStartOf } from './journal'
import { hoursUntilDue, isRecordCopyOverdue, recordCopyDueAt } from './clinical-record'

describe('conversaciones pre-vínculo (R-09)', () => {
  it('permite hasta 3 abiertas', () => {
    expect(canStartPreBondConversation(2).ok).toBe(true)
    const result = canStartPreBondConversation(3)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.rule).toBe('R-09')
  })

  it('limita los mensajes del paciente hasta la primera respuesta', () => {
    const base = { status: 'pre_bond' as const, professionalHasReplied: false }
    expect(canPatientSendMessage({ ...base, patientMessagesBeforeReply: 2 }).ok).toBe(true)
    expect(canPatientSendMessage({ ...base, patientMessagesBeforeReply: 3 }).ok).toBe(false)
  })

  it('tras la respuesta del profesional ya no hay tope', () => {
    expect(
      canPatientSendMessage({
        status: 'pre_bond',
        professionalHasReplied: true,
        patientMessagesBeforeReply: 10,
      }).ok,
    ).toBe(true)
  })

  it('una conversación bloqueada o cerrada no admite mensajes', () => {
    for (const status of ['blocked', 'closed'] as const) {
      expect(
        canPatientSendMessage({ status, professionalHasReplied: true, patientMessagesBeforeReply: 0 }).ok,
      ).toBe(false)
      expect(canProfessionalSendMessage(status).ok).toBe(false)
    }
    expect(canProfessionalSendMessage('pre_bond').ok).toBe(true)
    expect(canProfessionalSendMessage('bond').ok).toBe(true)
  })

  it('se considera inactiva a los 30 días', () => {
    const now = new Date('2026-10-24T12:00:00Z')
    const day = 24 * 60 * 60 * 1000
    expect(isConversationInactive(new Date(now.getTime() - 29 * day), now)).toBe(false)
    expect(isConversationInactive(new Date(now.getTime() - 30 * day), now)).toBe(true)
  })
})

describe('diario (R-07)', () => {
  const createdAt = new Date('2026-10-24T12:00:00Z')

  it('se puede corregir dentro de los 15 minutos', () => {
    const until = journalEditableUntil(createdAt)
    expect(until.getTime() - createdAt.getTime()).toBe(15 * 60 * 1000)
    expect(canEditJournalEntry(until, new Date(createdAt.getTime() + 14 * 60 * 1000)).ok).toBe(true)
  })

  it('pasado el plazo queda bloqueado', () => {
    const until = journalEditableUntil(createdAt)
    const result = canEditJournalEntry(until, new Date(createdAt.getTime() + 16 * 60 * 1000))
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.rule).toBe('R-07')
  })

  it('la semana empieza el lunes en horario argentino', () => {
    // Sábado 24/10/2026 -> lunes 19/10/2026.
    expect(weekStartOf(new Date('2026-10-24T12:00:00Z'))).toBe('2026-10-19')
    // Lunes 02:00 UTC es todavía domingo en Argentina (UTC-3): pertenece a la semana anterior.
    expect(weekStartOf(new Date('2026-10-19T02:00:00Z'))).toBe('2026-10-12')
    expect(weekStartOf(new Date('2026-10-19T06:00:00Z'))).toBe('2026-10-19')
  })
})

describe('copia de la historia clínica (R-14)', () => {
  const requestedAt = new Date('2026-10-24T12:00:00Z')

  it('vence a las 48 horas', () => {
    expect(recordCopyDueAt(requestedAt).toISOString()).toBe('2026-10-26T12:00:00.000Z')
  })

  it('está vencida solo si no se entregó y pasó el plazo', () => {
    const due = recordCopyDueAt(requestedAt)
    const after = new Date(due.getTime() + 1000)
    expect(isRecordCopyOverdue(due, null, after)).toBe(true)
    expect(isRecordCopyOverdue(due, null, new Date(due.getTime() - 1000))).toBe(false)
    expect(isRecordCopyOverdue(due, new Date(due.getTime() - 1000), after)).toBe(false)
  })

  it('informa las horas restantes', () => {
    const due = recordCopyDueAt(requestedAt)
    expect(hoursUntilDue(due, requestedAt)).toBe(48)
  })
})
