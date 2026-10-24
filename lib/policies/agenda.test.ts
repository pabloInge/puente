import { describe, expect, it } from 'vitest'
import {
  canPatientReschedule,
  canRequestAppointment,
  isLateCancellation,
  isRequestExpired,
  meetsBookingNotice,
  requestExpiresAt,
} from './agenda'

const NOW = new Date('2026-10-24T12:00:00Z')
const hoursFromNow = (h: number) => new Date(NOW.getTime() + h * 60 * 60 * 1000)

describe('solicitar turno (R-10)', () => {
  it('con vínculo activo puede pedir seguimiento', () => {
    expect(canRequestAppointment({ bondStatus: 'active', isFirstConsultation: false }).ok).toBe(true)
  })

  it('sin vínculo activo no puede pedir seguimiento', () => {
    const result = canRequestAppointment({ bondStatus: 'requested', isFirstConsultation: false })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.rule).toBe('R-10')
    expect(canRequestAppointment({ bondStatus: null, isFirstConsultation: false }).ok).toBe(false)
  })

  it('la primera consulta se pide con una solicitud de vínculo abierta', () => {
    expect(canRequestAppointment({ bondStatus: 'requested', isFirstConsultation: true }).ok).toBe(true)
    expect(canRequestAppointment({ bondStatus: 'awaiting_consent', isFirstConsultation: true }).ok).toBe(true)
  })

  it('la primera consulta no se pide sin solicitud ni con un vínculo cerrado', () => {
    expect(canRequestAppointment({ bondStatus: null, isFirstConsultation: true }).ok).toBe(false)
    expect(canRequestAppointment({ bondStatus: 'ended', isFirstConsultation: true }).ok).toBe(false)
    expect(canRequestAppointment({ bondStatus: 'rejected', isFirstConsultation: true }).ok).toBe(false)
  })
})

describe('anticipación y cancelación (R-10)', () => {
  it('exige 12 horas de anticipación para solicitar', () => {
    expect(meetsBookingNotice(hoursFromNow(12), NOW).ok).toBe(true)
    expect(meetsBookingNotice(hoursFromNow(11.9), NOW).ok).toBe(false)
  })

  it('cancelar con menos de 24 horas es tardío', () => {
    expect(isLateCancellation(hoursFromNow(23), NOW)).toBe(true)
    expect(isLateCancellation(hoursFromNow(24), NOW)).toBe(false)
    expect(isLateCancellation(hoursFromNow(48), NOW)).toBe(false)
  })

  it('el paciente reprograma una sola vez', () => {
    expect(canPatientReschedule(0).ok).toBe(true)
    expect(canPatientReschedule(1).ok).toBe(false)
  })
})

describe('vencimiento de solicitudes (R-10)', () => {
  it('vence a las 48 horas si el turno es lejano', () => {
    const expires = requestExpiresAt(NOW, hoursFromNow(24 * 10))
    expect(expires.getTime()).toBe(hoursFromNow(48).getTime())
  })

  it('vence 2 horas antes del inicio si el turno es cercano', () => {
    const expires = requestExpiresAt(NOW, hoursFromNow(20))
    expect(expires.getTime()).toBe(hoursFromNow(18).getTime())
  })

  it('detecta una solicitud vencida', () => {
    const expiresAt = hoursFromNow(10)
    expect(isRequestExpired(expiresAt, hoursFromNow(9))).toBe(false)
    expect(isRequestExpired(expiresAt, hoursFromNow(10))).toBe(true)
  })
})
