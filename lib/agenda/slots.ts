import { HOUR_MS } from '@/lib/policies/defaults'
import type { Modality } from '@/lib/recommendation/types'

export type AvailabilityRuleItem = {
  weekday: number // 0 = Sunday, 1 = Monday, ... 6 = Saturday
  startTime: string // "HH:MM"
  endTime: string // "HH:MM"
  modality: Modality
}

export type AvailabilityExceptionItem = {
  date: string // "YYYY-MM-DD"
  startTime: string | null
  endTime: string | null
  kind: 'block' | 'extra'
}

export type ExistingAppointmentItem = {
  startsAt: Date
  endsAt: Date
  status: string
}

export type Slot = {
  startsAt: Date
  endsAt: Date
  modality: Modality
}

export type CalculateSlotsOptions = {
  rules: AvailabilityRuleItem[]
  exceptions: AvailabilityExceptionItem[]
  existingAppointments: ExistingAppointmentItem[]
  durationMin: number
  rangeStart: Date
  rangeEnd: Date
  minBookingNoticeHours?: number
  now?: Date
}

function parseTimeToMinutes(timeStr: string): number {
  const [h, m] = timeStr.slice(0, 5).split(':').map(Number)
  return h * 60 + m
}

export function calculateSlots({
  rules,
  exceptions,
  existingAppointments,
  durationMin,
  rangeStart,
  rangeEnd,
  minBookingNoticeHours = 12,
  now = new Date(),
}: CalculateSlotsOptions): Slot[] {
  const slots: Slot[] = []
  const minNoticeTime = now.getTime() + minBookingNoticeHours * HOUR_MS

  // Iterate day by day from rangeStart to rangeEnd
  const current = new Date(rangeStart)
  current.setUTCHours(0, 0, 0, 0)

  const activeAppointments = existingAppointments.filter(
    (a) => a.status !== 'cancelled' && a.status !== 'rejected',
  )

  while (current <= rangeEnd) {
    const weekday = current.getUTCDay()
    const dateStr = current.toISOString().slice(0, 10)

    // Check exceptions for this date
    const dayExceptions = exceptions.filter((e) => e.date === dateStr)
    const isFullDayBlocked = dayExceptions.some(
      (e) => e.kind === 'block' && (!e.startTime || !e.endTime),
    )

    if (!isFullDayBlocked) {
      // 1. Rules for this weekday
      const dayRules = rules.filter((r) => r.weekday === weekday)

      for (const rule of dayRules) {
        const startMin = parseTimeToMinutes(rule.startTime)
        const endMin = parseTimeToMinutes(rule.endTime)

        for (let m = startMin; m + durationMin <= endMin; m += durationMin) {
          const slotStart = new Date(current)
          slotStart.setUTCHours(Math.floor(m / 60), m % 60, 0, 0)

          const slotEnd = new Date(current)
          slotEnd.setUTCHours(Math.floor((m + durationMin) / 60), (m + durationMin) % 60, 0, 0)

          // Check notice window
          if (slotStart.getTime() < minNoticeTime) continue

          // Check if blocked by time-specific exception
          const isBlocked = dayExceptions.some((e) => {
            if (e.kind !== 'block' || !e.startTime || !e.endTime) return false
            const eStart = parseTimeToMinutes(e.startTime)
            const eEnd = parseTimeToMinutes(e.endTime)
            return m < eEnd && m + durationMin > eStart
          })
          if (isBlocked) continue

          // Check if conflicts with active appointment
          const hasOverlap = activeAppointments.some((apt) => {
            return (
              slotStart.getTime() < apt.endsAt.getTime() &&
              slotEnd.getTime() > apt.startsAt.getTime()
            )
          })
          if (hasOverlap) continue

          slots.push({
            startsAt: slotStart,
            endsAt: slotEnd,
            modality: rule.modality,
          })
        }
      }

      // 2. Extra exceptions for this date
      const extraExceptions = dayExceptions.filter(
        (e) => e.kind === 'extra' && e.startTime && e.endTime,
      )
      for (const extra of extraExceptions) {
        const startMin = parseTimeToMinutes(extra.startTime!)
        const endMin = parseTimeToMinutes(extra.endTime!)

        for (let m = startMin; m + durationMin <= endMin; m += durationMin) {
          const slotStart = new Date(current)
          slotStart.setUTCHours(Math.floor(m / 60), m % 60, 0, 0)

          const slotEnd = new Date(current)
          slotEnd.setUTCHours(Math.floor((m + durationMin) / 60), (m + durationMin) % 60, 0, 0)

          if (slotStart.getTime() < minNoticeTime) continue

          const hasOverlap = activeAppointments.some(
            (apt) =>
              slotStart.getTime() < apt.endsAt.getTime() &&
              slotEnd.getTime() > apt.startsAt.getTime(),
          )
          if (hasOverlap) continue

          slots.push({
            startsAt: slotStart,
            endsAt: slotEnd,
            modality: 'both',
          })
        }
      }
    }

    current.setUTCDate(current.getUTCDate() + 1)
  }

  return slots.sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime())
}
