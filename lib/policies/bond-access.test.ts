import { describe, expect, it } from 'vitest'
import { bondAllowsMode, modeFor } from './bond-access'
import { canActivateBond, canOpenBond, isOpenBondStatus } from './bond'
import type { BondStatus } from './patient-visibility'

describe('bondAllowsMode (R-02, R-03)', () => {
  it('un vínculo activo permite lectura y escritura', () => {
    expect(bondAllowsMode('active', 'read-active').ok).toBe(true)
    expect(bondAllowsMode('active', 'read-historical').ok).toBe(true)
    expect(bondAllowsMode('active', 'write').ok).toBe(true)
  })

  it('un vínculo finalizado conserva solo la lectura histórica', () => {
    expect(bondAllowsMode('ended', 'read-historical').ok).toBe(true)

    const readActive = bondAllowsMode('ended', 'read-active')
    expect(readActive.ok).toBe(false)
    if (!readActive.ok) expect(readActive.rule).toBe('R-03')

    const write = bondAllowsMode('ended', 'write')
    expect(write.ok).toBe(false)
    if (!write.ok) expect(write.rule).toBe('R-03')
  })

  it.each<BondStatus>(['requested', 'awaiting_consent', 'rejected', 'cancelled'])(
    'un vínculo %s no da acceso a nada',
    (status) => {
      for (const mode of ['read-active', 'read-historical', 'write'] as const) {
        const result = bondAllowsMode(status, mode)
        expect(result.ok).toBe(false)
        if (!result.ok) expect(result.rule).toBe('R-02')
      }
    },
  )
})

describe('modeFor', () => {
  it('toda escritura exige vínculo activo', () => {
    expect(modeFor('clinical_record', 'write')).toBe('write')
    expect(modeFor('journal', 'write')).toBe('write')
  })

  it('registro clínico, intake y cierre se leen aun finalizado el vínculo', () => {
    expect(modeFor('clinical_record', 'read')).toBe('read-historical')
    expect(modeFor('intake', 'read')).toBe('read-historical')
    expect(modeFor('closing_summary', 'read')).toBe('read-historical')
  })

  it('diario, mensajes e indicaciones se pierden al finalizar', () => {
    expect(modeFor('journal', 'read')).toBe('read-active')
    expect(modeFor('messaging', 'read')).toBe('read-active')
    expect(modeFor('indications', 'read')).toBe('read-active')
    expect(modeFor('progress', 'read')).toBe('read-active')
  })
})

describe('vínculo único (R-12)', () => {
  it('permite abrir uno sin vínculo o con uno cerrado', () => {
    expect(canOpenBond(null).ok).toBe(true)
    expect(canOpenBond('ended').ok).toBe(true)
    expect(canOpenBond('rejected').ok).toBe(true)
    expect(canOpenBond('cancelled').ok).toBe(true)
  })

  it.each<BondStatus>(['requested', 'awaiting_consent', 'active'])(
    'rechaza abrir otro con uno %s',
    (status) => {
      const result = canOpenBond(status)
      expect(result.ok).toBe(false)
      if (!result.ok) expect(result.rule).toBe('R-12')
    },
  )

  it('los estados abiertos coinciden con el índice único parcial', () => {
    expect(isOpenBondStatus('requested')).toBe(true)
    expect(isOpenBondStatus('awaiting_consent')).toBe(true)
    expect(isOpenBondStatus('active')).toBe(true)
    expect(isOpenBondStatus('ended')).toBe(false)
  })
})

describe('consentimiento (R-08)', () => {
  it('no se activa sin consentimiento aceptado', () => {
    const result = canActivateBond(false)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.rule).toBe('R-08')
    expect(canActivateBond(true).ok).toBe(true)
  })
})
