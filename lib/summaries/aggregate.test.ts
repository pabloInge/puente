import { describe, expect, it } from 'vitest'
import { aggregateWeeklyData } from './aggregate'

describe('aggregateWeeklyData (E-01)', () => {
  it('correctly aggregates journal, indications, appointments and messages', () => {
    const res = aggregateWeeklyData({
      weekStart: '2026-10-19',
      journalEntries: [
        { kind: 'conflict', mood: 2 },
        { kind: 'conflict', mood: 3 },
        { kind: 'need', mood: 4 },
      ],
      indications: [
        { seen: true, commented: true },
        { seen: true, commented: false },
      ],
      appointments: [
        { status: 'completed' },
        { status: 'confirmed' },
      ],
      messages: [
        { isPatient: true },
        { isPatient: true },
        { isPatient: false },
      ],
    })

    expect(res.weekStart).toBe('2026-10-19')
    expect(res.journal.total).toBe(3)
    expect(res.journal.conflict).toBe(2)
    expect(res.journal.need).toBe(1)
    expect(res.journal.averageMood).toBe(3.0)

    expect(res.indications.assigned).toBe(2)
    expect(res.indications.seen).toBe(2)
    expect(res.indications.commented).toBe(1)

    expect(res.appointments.completed).toBe(1)
    expect(res.appointments.upcoming).toBe(1)

    expect(res.messages.fromPatient).toBe(2)
    expect(res.messages.fromProfessional).toBe(1)
  })

  it('handles empty week with null average mood', () => {
    const res = aggregateWeeklyData({
      weekStart: '2026-10-19',
      journalEntries: [],
      indications: [],
      appointments: [],
      messages: [],
    })

    expect(res.journal.total).toBe(0)
    expect(res.journal.averageMood).toBeNull()
  })
})
