import { describe, expect, it } from 'vitest'
import { calculateSlots } from './slots'

describe('calculateSlots (B-02)', () => {
  const now = new Date('2026-10-24T10:00:00.000Z') // Saturday
  const monday = new Date('2026-10-26T00:00:00.000Z')
  const tuesday = new Date('2026-10-27T00:00:00.000Z')

  const sampleRules = [
    {
      weekday: 1, // Monday
      startTime: '09:00',
      endTime: '12:00',
      modality: 'online' as const,
    },
  ]

  it('generates slots based on availability rules and duration', () => {
    const slots = calculateSlots({
      rules: sampleRules,
      exceptions: [],
      existingAppointments: [],
      durationMin: 60,
      rangeStart: monday,
      rangeEnd: monday,
      minBookingNoticeHours: 12,
      now,
    })

    expect(slots.length).toBe(3) // 09:00-10:00, 10:00-11:00, 11:00-12:00
    expect(slots[0].startsAt.toISOString()).toContain('09:00')
    expect(slots[0].endsAt.toISOString()).toContain('10:00')
  })

  it('excludes slots overlapping with existing appointments', () => {
    const apt = {
      startsAt: new Date('2026-10-26T10:00:00.000Z'),
      endsAt: new Date('2026-10-26T11:00:00.000Z'),
      status: 'confirmed',
    }

    const slots = calculateSlots({
      rules: sampleRules,
      exceptions: [],
      existingAppointments: [apt],
      durationMin: 60,
      rangeStart: monday,
      rangeEnd: monday,
      now,
    })

    expect(slots.length).toBe(2) // 09:00 and 11:00, 10:00 is excluded
  })

  it('excludes slots when day is blocked by exception', () => {
    const blockException = {
      date: '2026-10-26',
      startTime: null,
      endTime: null,
      kind: 'block' as const,
    }

    const slots = calculateSlots({
      rules: sampleRules,
      exceptions: [blockException],
      existingAppointments: [],
      durationMin: 60,
      rangeStart: monday,
      rangeEnd: monday,
      now,
    })

    expect(slots.length).toBe(0)
  })

  it('respects minimum booking notice', () => {
    // Current time is Monday 08:00, rule is 09:00, notice is 12 hours
    const closeNow = new Date('2026-10-26T08:00:00.000Z')
    const slots = calculateSlots({
      rules: sampleRules,
      exceptions: [],
      existingAppointments: [],
      durationMin: 60,
      rangeStart: monday,
      rangeEnd: monday,
      minBookingNoticeHours: 12,
      now: closeNow,
    })

    expect(slots.length).toBe(0)
  })
})
