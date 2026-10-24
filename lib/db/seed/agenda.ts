import type { Db } from '..'
import { appointment } from '../schema/agenda'
import type { BondKey } from './connections'
import { MINUTE, artTime, fromNow, ids, insertAll, seedId } from './ids'

type Status = 'requested' | 'confirmed' | 'cancelled' | 'completed'

export type SeedAppointment = {
  key: string
  bond: BondKey
  pat: number
  pro: number
  service: 'first' | 'session'
  start: Date
  durationMin: number
  modality: 'in_person' | 'online'
  status: Status
  cancelledBy?: 'patient'
  cancelReason?: string
  late?: boolean
  expiresAt?: Date
}

const FIRST_MIN = 50
const SESSION_MIN = 45

// Weekly slots follow each professional's availability rules (day: 0 = Monday).
function weekly(
  bond: BondKey,
  pat: number,
  pro: number,
  modality: 'in_person' | 'online',
  day: number,
  time: string,
  weeks: { week: number; status: Status; extra?: Partial<SeedAppointment> }[],
  firstWeek: number,
): SeedAppointment[] {
  return weeks.map(({ week, status, extra }, i) => {
    const service = week === firstWeek ? 'first' : 'session'
    return {
      key: `${bond}:${i + 1}`,
      bond,
      pat,
      pro,
      service,
      start: artTime(week, day, time),
      durationMin: service === 'first' ? FIRST_MIN : SESSION_MIN,
      modality,
      status,
      ...extra,
    }
  })
}

export const APPOINTMENTS: SeedAppointment[] = [
  ...weekly('p1-pro1', 1, 1, 'online', 1, '10:00', [
    { week: -5, status: 'completed' },
    { week: -4, status: 'completed' },
    { week: -3, status: 'completed' },
    {
      week: -2,
      status: 'cancelled',
      extra: { cancelledBy: 'patient', cancelReason: 'Imprevisto laboral', late: true },
    },
    { week: -1, status: 'completed' },
    { week: 1, status: 'confirmed' },
  ], -5),
  {
    key: 'p1-pro1:7',
    bond: 'p1-pro1',
    pat: 1,
    pro: 1,
    service: 'session',
    start: artTime(1, 4, '15:00'),
    durationMin: SESSION_MIN,
    modality: 'online',
    status: 'requested',
    expiresAt: fromNow(36 * 60 * MINUTE),
  },
  ...weekly('p2-pro3', 2, 3, 'in_person', 3, '15:00', [
    { week: -3, status: 'completed' },
    { week: -2, status: 'completed' },
    { week: -1, status: 'completed' },
    { week: 1, status: 'confirmed' },
  ], -3),
  ...weekly('p5-pro5', 5, 5, 'online', 2, '10:00', [
    { week: -9, status: 'completed' },
    { week: -8, status: 'completed' },
    { week: -7, status: 'completed' },
    { week: -6, status: 'completed' },
  ], -9),
]

export async function seedAgenda(db: Db): Promise<void> {
  await insertAll(
    db,
    appointment,
    APPOINTMENTS.map((a) => ({
      id: ids.appointment(a.key),
      professionalId: ids.pro(a.pro),
      patientId: ids.pat(a.pat),
      bondId: ids.bond(a.bond),
      serviceTypeId: ids.service(a.pro, a.service),
      startsAt: a.start,
      endsAt: new Date(a.start.getTime() + a.durationMin * MINUTE),
      modality: a.modality,
      status: a.status,
      cancelledBy: a.cancelledBy ?? null,
      cancelReason: a.cancelReason ?? null,
      lateCancellation: a.late ?? false,
      expiresAt: a.expiresAt ?? null,
      videoRoomName:
        a.modality === 'online' && (a.status === 'confirmed' || a.status === 'completed')
          ? `puente-${seedId(`room:${a.key}`).slice(0, 12)}`
          : null,
    })),
  )
}
