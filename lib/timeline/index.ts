import 'server-only'
import { asc, eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { appointment, clinicalEntry, intake } from '@/lib/db/schema'
import type { TimelineEvent } from './types'

export async function getTimelineEventsForBond(bondId: string): Promise<TimelineEvent[]> {
  const events: TimelineEvent[] = []

  // 1. Clinical entries
  const entries = await db
    .select({
      id: clinicalEntry.id,
      createdAt: clinicalEntry.createdAt,
      kind: clinicalEntry.kind,
      content: clinicalEntry.content,
    })
    .from(clinicalEntry)
    .where(eq(clinicalEntry.bondId, bondId))

  for (const e of entries) {
    events.push({
      id: `entry-${e.id}`,
      date: e.createdAt,
      kind: 'clinical_entry',
      title:
        e.kind === 'starting_point'
          ? 'Punto de inicio'
          : e.kind === 'first_impressions'
            ? 'Primeras impresiones'
            : e.kind === 'evolution'
              ? 'Evolución clínica'
              : 'Enmienda clínica',
      summary: e.content.map((c) => c.title).join(' · '),
      href: `/profesional/pacientes/${bondId}/historia-clinica`,
    })
  }

  // 2. Appointments
  const apts = await db
    .select({
      id: appointment.id,
      startsAt: appointment.startsAt,
      status: appointment.status,
      modality: appointment.modality,
    })
    .from(appointment)
    .where(eq(appointment.bondId, bondId))

  for (const a of apts) {
    events.push({
      id: `apt-${a.id}`,
      date: a.startsAt,
      kind: 'appointment',
      title: `Sesión (${a.modality === 'online' ? 'Online' : 'Presencial'})`,
      summary: `Estado: ${a.status}`,
    })
  }

  // 3. Intake
  const [it] = await db.select().from(intake).where(eq(intake.bondId, bondId)).limit(1)
  if (it) {
    events.push({
      id: `intake-${it.id}`,
      date: it.submittedAt,
      kind: 'bond',
      title: 'Ficha de inicio (Intake)',
      summary: it.reasonToStart,
    })
  }

  return events.sort((a, b) => b.date.getTime() - a.date.getTime())
}
