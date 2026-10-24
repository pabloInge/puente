import type { WeeklyAggregate } from './types'

export type AggregateInput = {
  weekStart: string
  journalEntries: { kind: string; mood: number | null }[]
  indications: { seen: boolean; commented: boolean }[]
  appointments: { status: string }[]
  messages: { isPatient: boolean }[]
}

export function aggregateWeeklyData(input: AggregateInput): WeeklyAggregate {
  let conflict = 0
  let need = 0
  let other = 0
  let moodSum = 0
  let moodCount = 0

  for (const j of input.journalEntries) {
    if (j.kind === 'conflict') conflict++
    else if (j.kind === 'need') need++
    else other++

    if (j.mood !== null && j.mood !== undefined) {
      moodSum += j.mood
      moodCount++
    }
  }

  const averageMood = moodCount > 0 ? Number((moodSum / moodCount).toFixed(1)) : null

  let indSeen = 0
  let indCommented = 0
  for (const ind of input.indications) {
    if (ind.seen) indSeen++
    if (ind.commented) indCommented++
  }

  let completedApts = 0
  let noShowApts = 0
  let cancelledApts = 0
  let upcomingApts = 0

  for (const apt of input.appointments) {
    if (apt.status === 'completed') completedApts++
    else if (apt.status === 'no_show') noShowApts++
    else if (apt.status === 'cancelled') cancelledApts++
    else if (apt.status === 'confirmed' || apt.status === 'requested') upcomingApts++
  }

  let fromPatient = 0
  let fromProfessional = 0
  for (const msg of input.messages) {
    if (msg.isPatient) fromPatient++
    else fromProfessional++
  }

  return {
    weekStart: input.weekStart,
    journal: {
      total: input.journalEntries.length,
      conflict,
      need,
      other,
      averageMood,
    },
    indications: {
      assigned: input.indications.length,
      seen: indSeen,
      commented: indCommented,
    },
    appointments: {
      completed: completedApts,
      noShow: noShowApts,
      cancelled: cancelledApts,
      upcoming: upcomingApts,
    },
    messages: {
      fromPatient,
      fromProfessional,
    },
  }
}
