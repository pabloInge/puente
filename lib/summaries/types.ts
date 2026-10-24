/** Agregado semanal del vínculo. Es la única entrada del generador: nunca recibe texto crudo del diario. */
export type WeeklyAggregate = {
  /** Lunes de la semana, `YYYY-MM-DD`. */
  weekStart: string
  journal: {
    total: number
    conflict: number
    need: number
    other: number
    /** Promedio del ánimo (1 a 5) o null si no hubo registros. */
    averageMood: number | null
  }
  indications: { assigned: number; seen: number; commented: number }
  appointments: { completed: number; noShow: number; cancelled: number; upcoming: number }
  messages: { fromPatient: number; fromProfessional: number }
}

export type ProgressPoint = { at: string; label: string; value: number | null }

export type HistoricSummaryInput = {
  weeks: WeeklyAggregate[]
  startingPoint: string | null
  progress: ProgressPoint[]
}

export type ClosingSummaryInput = HistoricSummaryInput & {
  reasonToStart: string | null
  startedAt: string | null
  endedAt: string | null
}

export interface SummaryWriter {
  writeWeekly(aggregate: WeeklyAggregate): Promise<string>
  writeHistoric(input: HistoricSummaryInput): Promise<string>
  writeClosing(input: ClosingSummaryInput): Promise<string>
}
