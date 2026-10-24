import type { Db } from '..'
import { clinicalRecordRequest } from '../schema/clinical'
import { closingSummary, weeklySummary } from '../schema/summaries'
import { DAY, ago, ids, insertAll, isoDate, seedId, weekMonday } from './ids'

export async function seedSummaries(db: Db): Promise<void> {
  await insertAll(db, weeklySummary, [
    {
      id: seedId('weekly:p1:-2'),
      bondId: ids.bond('p1-pro1'),
      weekStart: isoDate(weekMonday(-2)),
      data: { sessions: 0, cancelledSessions: 1, journalEntries: 1, averageMood: 3 },
      aiText:
        'Semana con un turno cancelado y una entrada en el diario sobre el hábito de revisar el correo por la noche.',
      sharedWithPatient: false,
      generatedAt: ago(13 * DAY),
    },
    {
      id: seedId('weekly:p1:-1'),
      bondId: ids.bond('p1-pro1'),
      weekStart: isoDate(weekMonday(-1)),
      data: { sessions: 1, cancelledSessions: 0, journalEntries: 2, averageMood: 3 },
      aiText:
        'Se retomó el trabajo en sesión. En el diario aparece un conflicto laboral y una mejora del sueño con la respiración.',
      professionalAnnotation: 'Buen momento para reforzar la asertividad con pedidos fuera de horario.',
      sharedWithPatient: true,
      generatedAt: ago(6 * DAY),
    },
    {
      id: seedId('weekly:p2:-1'),
      bondId: ids.bond('p2-pro3'),
      weekStart: isoDate(weekMonday(-1)),
      data: { sessions: 1, cancelledSessions: 0, journalEntries: 1, averageMood: 2 },
      aiText: 'Sesión de lectura de la carta y una entrada en el diario sobre una foto familiar.',
      sharedWithPatient: false,
      generatedAt: ago(6 * DAY),
    },
  ])

  await insertAll(db, closingSummary, [
    {
      id: ids.closingSummary('p5-pro5'),
      bondId: ids.bond('p5-pro5'),
      status: 'approved',
      requestedByPatientAt: ago(33 * DAY),
      content:
        'Carolina cursó cuatro sesiones de tratamiento por conductas alimentarias. Se trabajó regulación emocional y valores. Al cierre no registra atracones en las últimas semanas y cuenta con un plan de prevención de recaídas.',
      approvedAt: ago(30 * DAY),
    },
  ])

  await insertAll(db, clinicalRecordRequest, [
    {
      id: seedId('record-request:p5'),
      bondId: ids.bond('p5-pro5'),
      requestedAt: ago(20 * DAY),
      dueAt: new Date(ago(20 * DAY).getTime() + 10 * DAY),
      fulfilledAt: ago(15 * DAY),
    },
  ])
}
