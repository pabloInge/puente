import { mockSummaryWriter } from './mock-writer'
import type { SummaryWriter } from './types'

export * from './types'

/** Para pasar a IA, cambiá esta línea. El generador solo recibe agregados, nunca texto del diario. */
export const summaryWriter: SummaryWriter = mockSummaryWriter
