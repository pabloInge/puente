import { createHash } from 'node:crypto'
import type { PgTable } from 'drizzle-orm/pg-core'
import type { Db } from '..'

export const MINUTE = 60_000
export const HOUR = 3_600_000
export const DAY = 24 * HOUR
const ART_OFFSET_HOURS = 3

export const DEMO_PASSWORD = 'Puente-Demo-2025'

/** Deterministic UUID so re-running the seed never duplicates rows. */
export function seedId(name: string): string {
  const h = createHash('sha1').update(`puente-seed:${name}`).digest('hex')
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-5${h.slice(13, 16)}-a${h.slice(17, 20)}-${h.slice(20, 32)}`
}

export const ids = {
  proUser: (n: number) => `demo-pro-${n}`,
  patUser: (n: number) => `demo-pat-${n}`,
  adminUser: 'demo-admin',
  pro: (n: number) => seedId(`pro:${n}`),
  pat: (n: number) => seedId(`pat:${n}`),
  branch: (slug: string) => seedId(`branch:${slug}`),
  coverage: (n: number) => seedId(`coverage:${n}`),
  consent: (kind: string) => seedId(`consent:${kind}:1`),
  template: (key: string) => seedId(`template:${key}`),
  service: (n: number, kind: 'first' | 'session') => seedId(`service:${n}:${kind}`),
  bond: (key: string) => seedId(`bond:${key}`),
  conversation: (key: string) => seedId(`conversation:${key}`),
  appointment: (key: string) => seedId(`appointment:${key}`),
  clinicalEntry: (aptKey: string, kind: string) => seedId(`clinical:${aptKey}:${kind}`),
  closingSummary: (bondKey: string) => seedId(`closing:${bondKey}`),
}

function currentMonday(): Date {
  const art = new Date(Date.now() - ART_OFFSET_HOURS * HOUR)
  const dow = art.getUTCDay()
  return new Date(
    Date.UTC(art.getUTCFullYear(), art.getUTCMonth(), art.getUTCDate() - ((dow + 6) % 7)),
  )
}

/** Monday (calendar date at UTC midnight) of the week `offsetWeeks` from the current one. */
export function weekMonday(offsetWeeks: number): Date {
  return new Date(currentMonday().getTime() + offsetWeeks * 7 * DAY)
}

export function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10)
}

/** Argentina wall-clock time. `dayFromMonday`: 0 = Monday ... 6 = Sunday. */
export function artTime(offsetWeeks: number, dayFromMonday: number, hhmm: string): Date {
  const [h, m] = hhmm.split(':').map(Number)
  return new Date(
    weekMonday(offsetWeeks).getTime() +
      dayFromMonday * DAY +
      (h + ART_OFFSET_HOURS) * HOUR +
      m * 60_000,
  )
}

export const ago = (ms: number) => new Date(Date.now() - ms)
export const fromNow = (ms: number) => new Date(Date.now() + ms)

export async function insertAll<T extends PgTable>(
  db: Db,
  table: T,
  rows: T['$inferInsert'][],
): Promise<void> {
  if (rows.length === 0) return
  await db.insert(table).values(rows).onConflictDoNothing()
}
