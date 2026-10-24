import type {
  ClosingSummaryInput,
  HistoricSummaryInput,
  SummaryWriter,
  WeeklyAggregate,
} from './types'

const MOOD_LABELS = ['muy bajo', 'bajo', 'neutro', 'bueno', 'muy bueno'] as const

function moodLabel(average: number | null): string | null {
  if (average === null) return null
  const index = Math.min(4, Math.max(0, Math.round(average) - 1))
  return `${MOOD_LABELS[index]} (${average.toFixed(1)} de 5)`
}

function plural(count: number, one: string, many: string): string {
  return `${count} ${count === 1 ? one : many}`
}

function describeWeek(week: WeeklyAggregate): string[] {
  const lines: string[] = []
  const { journal, indications, appointments, messages } = week

  if (journal.total === 0) {
    lines.push('No hubo entradas en el diario esta semana.')
  } else {
    const parts = [
      journal.conflict > 0 ? plural(journal.conflict, 'conflicto', 'conflictos') : null,
      journal.need > 0 ? plural(journal.need, 'necesidad', 'necesidades') : null,
      journal.other > 0 ? plural(journal.other, 'otra', 'otras') : null,
    ].filter(Boolean)
    lines.push(
      `Hubo ${plural(journal.total, 'entrada', 'entradas')} en el diario (${parts.join(', ')}).`,
    )
    const mood = moodLabel(journal.averageMood)
    if (mood) lines.push(`El ánimo promedio fue ${mood}.`)
  }

  if (indications.assigned > 0) {
    lines.push(
      `De ${plural(indications.assigned, 'indicación', 'indicaciones')}, se vieron ${indications.seen} y se comentaron ${indications.commented}.`,
    )
  }

  if (appointments.completed + appointments.noShow + appointments.cancelled > 0) {
    lines.push(
      `Turnos: ${appointments.completed} realizados, ${appointments.cancelled} cancelados y ${appointments.noShow} ausencias.`,
    )
  }
  if (appointments.upcoming > 0) {
    lines.push(`Hay ${plural(appointments.upcoming, 'turno próximo', 'turnos próximos')}.`)
  }

  if (messages.fromPatient + messages.fromProfessional > 0) {
    lines.push(
      `Se intercambiaron ${messages.fromPatient + messages.fromProfessional} mensajes.`,
    )
  }
  return lines
}

export const mockSummaryWriter: SummaryWriter = {
  async writeWeekly(aggregate) {
    return [`Resumen de la semana del ${aggregate.weekStart}.`, ...describeWeek(aggregate)].join(' ')
  },

  async writeHistoric(input: HistoricSummaryInput) {
    const totalEntries = input.weeks.reduce((sum, w) => sum + w.journal.total, 0)
    const lines = [`Se analizaron ${plural(input.weeks.length, 'semana', 'semanas')} de trabajo.`]
    if (input.startingPoint) lines.push(`Punto de partida: ${input.startingPoint}.`)
    lines.push(`En total hubo ${plural(totalEntries, 'entrada', 'entradas')} en el diario.`)
    const moods = input.weeks.map((w) => w.journal.averageMood).filter((m): m is number => m !== null)
    if (moods.length >= 2) {
      const delta = moods[moods.length - 1] - moods[0]
      const trend = delta > 0.3 ? 'subió' : delta < -0.3 ? 'bajó' : 'se mantuvo estable'
      lines.push(`El ánimo ${trend} entre la primera y la última semana registrada.`)
    }
    return lines.join(' ')
  },

  async writeClosing(input: ClosingSummaryInput) {
    const lines: string[] = []
    if (input.startedAt && input.endedAt) {
      lines.push(`El trabajo se extendió entre el ${input.startedAt} y el ${input.endedAt}.`)
    }
    if (input.reasonToStart) lines.push(`Motivo de inicio: ${input.reasonToStart}.`)
    lines.push(await this.writeHistoric(input))
    return lines.join(' ')
  },
}
