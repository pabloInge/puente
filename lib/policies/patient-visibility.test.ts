import { describe, expect, it } from 'vitest'
import { calculateAge, canSeeFullPatientProfile, toPatientPreview } from './patient-visibility'
import { isProgressVisible, patientProgressView } from './progress'

describe('calculateAge', () => {
  const now = new Date('2026-10-24T12:00:00Z')

  it('cuenta años cumplidos', () => {
    expect(calculateAge('1988-03-14', now)).toBe(38)
  })

  it('no suma el año antes del cumpleaños', () => {
    expect(calculateAge('1988-12-01', now)).toBe(37)
  })

  it('el día del cumpleaños ya cuenta', () => {
    expect(calculateAge('2008-10-24', now)).toBe(18)
    expect(calculateAge('2008-10-25', now)).toBe(17)
  })
})

describe('vista previa del paciente (R-01)', () => {
  const source = {
    firstName: 'Lucía',
    birthDate: '1990-05-02',
    province: 'Córdoba',
    initialTopics: 'ansiedad',
    requestMessage: 'Hola, quisiera empezar terapia.',
    // Campos que NO deben salir aunque lleguen en el objeto.
    lastName: 'Pérez',
    dni: '30111222',
    phone: '351555',
  }

  it('devuelve solo los campos permitidos y la edad, nunca la fecha de nacimiento', () => {
    const preview = toPatientPreview(source, new Date('2026-10-24T12:00:00Z'))
    expect(Object.keys(preview).sort()).toEqual(
      ['age', 'firstName', 'initialTopics', 'province', 'requestMessage'].sort(),
    )
    expect(preview.age).toBe(36)
    expect(JSON.stringify(preview)).not.toContain('Pérez')
    expect(JSON.stringify(preview)).not.toContain('30111222')
    expect(JSON.stringify(preview)).not.toContain('1990')
  })

  it('sin fecha de nacimiento la edad es null', () => {
    expect(toPatientPreview({ ...source, birthDate: null }).age).toBeNull()
  })

  it('el perfil completo solo se ve con vínculo activo (R-02)', () => {
    expect(canSeeFullPatientProfile('active')).toBe(true)
    expect(canSeeFullPatientProfile('requested')).toBe(false)
    expect(canSeeFullPatientProfile('awaiting_consent')).toBe(false)
    expect(canSeeFullPatientProfile('ended')).toBe(false)
    expect(canSeeFullPatientProfile(null)).toBe(false)
  })
})

describe('visibilidad del progreso (R-05)', () => {
  it('bloqueado nunca es visible, aunque el paciente quiera verlo', () => {
    expect(isProgressVisible({ visibilityPolicy: 'blocked', patientWantsToSee: true })).toBe(false)
    expect(patientProgressView({ visibilityPolicy: 'blocked', patientWantsToSee: true })).toEqual({
      state: 'blocked',
    })
  })

  it('decide el paciente cuando no está bloqueado', () => {
    expect(isProgressVisible({ visibilityPolicy: 'patient_decides', patientWantsToSee: true })).toBe(true)
    expect(isProgressVisible({ visibilityPolicy: 'patient_decides', patientWantsToSee: false })).toBe(false)
  })

  it('la recomendación orienta pero no obliga', () => {
    expect(
      patientProgressView({ visibilityPolicy: 'recommend_hide', patientWantsToSee: true }),
    ).toEqual({ state: 'visible', recommendation: 'hide' })
    expect(
      patientProgressView({ visibilityPolicy: 'recommend_show', patientWantsToSee: false }),
    ).toEqual({ state: 'hidden', recommendation: 'show' })
  })
})
