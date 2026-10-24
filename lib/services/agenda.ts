import 'server-only'
import { and, asc, desc, eq, gte, inArray, lte } from 'drizzle-orm'
import { z } from 'zod'
import { calculateSlots } from '@/lib/agenda/slots'
import { db } from '@/lib/db'
import {
  appointment,
  availabilityException,
  availabilityRule,
  bond,
  coverage,
  patientProfile,
  professionalAgendaSettings,
  professionalProfile,
  serviceType,
  serviceTypeCoverage,
  user,
} from '@/lib/db/schema'
import {
  canPatientReschedule,
  canRequestAppointment,
  isLateCancellation,
  meetsBookingNotice,
  requestExpiresAt,
} from '@/lib/policies/agenda'
import type { Session } from '@/lib/session'
import { videoProvider } from '@/lib/video'
import { requireRoleIn } from './_base'
import {
  getOpenBondForPatient,
  getPatientProfileId,
  getProfessionalProfileId,
} from './bond-access'
import {
  ForbiddenError,
  InvalidInputError,
  NotFoundError,
  RuleViolationError,
} from './errors'

// ==========================================
// Service Types (B-01)
// ==========================================

export const createServiceTypeSchema = z.object({
  name: z.string().trim().min(2, 'El nombre debe tener al menos 2 caracteres.'),
  durationMin: z.number().int().min(15).max(180),
  modality: z.enum(['in_person', 'online', 'both']),
  fee: z.number().int().nonnegative().optional().nullable(),
  isFirstConsultation: z.boolean().default(false),
  coverageIds: z.array(z.string().uuid()).default([]),
})

export type CreateServiceTypeInput = z.infer<typeof createServiceTypeSchema>

export async function listServiceTypes(professionalId: string) {
  const types = await db
    .select()
    .from(serviceType)
    .where(and(eq(serviceType.professionalId, professionalId), eq(serviceType.active, true)))
    .orderBy(asc(serviceType.name))

  const typeIds = types.map((t) => t.id)
  if (typeIds.length === 0) return []

  const coverages = await db
    .select({
      serviceTypeId: serviceTypeCoverage.serviceTypeId,
      coverageId: coverage.id,
      coverageName: coverage.name,
    })
    .from(serviceTypeCoverage)
    .innerJoin(coverage, eq(serviceTypeCoverage.coverageId, coverage.id))
    .where(inArray(serviceTypeCoverage.serviceTypeId, typeIds))

  const coveragesByType = new Map<string, { id: string; name: string }[]>()
  for (const c of coverages) {
    const list = coveragesByType.get(c.serviceTypeId) ?? []
    list.push({ id: c.coverageId, name: c.coverageName })
    coveragesByType.set(c.serviceTypeId, list)
  }

  return types.map((t) => ({
    ...t,
    coverages: coveragesByType.get(t.id) ?? [],
  }))
}

export async function createServiceType(session: Session, rawInput: CreateServiceTypeInput) {
  requireRoleIn(session, 'professional')
  const input = createServiceTypeSchema.parse(rawInput)
  const profId = await getProfessionalProfileId(session.user.id)
  if (!profId) throw new NotFoundError('Perfil no encontrado.')

  const [created] = await db
    .insert(serviceType)
    .values({
      professionalId: profId,
      name: input.name,
      durationMin: input.durationMin,
      modality: input.modality,
      fee: input.fee ?? null,
      isFirstConsultation: input.isFirstConsultation,
    })
    .returning()

  if (input.coverageIds.length > 0) {
    await db.insert(serviceTypeCoverage).values(
      input.coverageIds.map((cId) => ({
        serviceTypeId: created.id,
        coverageId: cId,
      })),
    )
  }

  return created
}

// ==========================================
// Availability Rules & Exceptions (B-01)
// ==========================================

export async function getAvailability(professionalId: string) {
  const rules = await db
    .select()
    .from(availabilityRule)
    .where(eq(availabilityRule.professionalId, professionalId))
    .orderBy(asc(availabilityRule.weekday), asc(availabilityRule.startTime))

  const exceptions = await db
    .select()
    .from(availabilityException)
    .where(eq(availabilityException.professionalId, professionalId))
    .orderBy(asc(availabilityException.date))

  const [settings] = await db
    .select()
    .from(professionalAgendaSettings)
    .where(eq(professionalAgendaSettings.professionalId, professionalId))
    .limit(1)

  return { rules, exceptions, settings }
}

// ==========================================
// Calculate Free Slots (B-02)
// ==========================================

export async function getAvailableSlots(
  professionalId: string,
  serviceTypeId: string,
  rangeStart: Date,
  rangeEnd: Date,
) {
  const [st] = await db
    .select()
    .from(serviceType)
    .where(and(eq(serviceType.id, serviceTypeId), eq(serviceType.professionalId, professionalId)))
    .limit(1)

  if (!st) throw new NotFoundError('Tipo de atención no encontrado.')

  const { rules, exceptions, settings } = await getAvailability(professionalId)

  // Fetch existing appointments in this range
  const existingApts = await db
    .select({
      startsAt: appointment.startsAt,
      endsAt: appointment.endsAt,
      status: appointment.status,
    })
    .from(appointment)
    .where(
      and(
        eq(appointment.professionalId, professionalId),
        gte(appointment.startsAt, rangeStart),
        lte(appointment.endsAt, rangeEnd),
      ),
    )

  return calculateSlots({
    rules: rules.map((r) => ({
      weekday: r.weekday,
      startTime: r.startTime,
      endTime: r.endTime,
      modality: r.modality,
    })),
    exceptions: exceptions.map((e) => ({
      date: e.date,
      startTime: e.startTime,
      endTime: e.endTime,
      kind: e.kind,
    })),
    existingAppointments: existingApts,
    durationMin: st.durationMin,
    rangeStart,
    rangeEnd,
    minBookingNoticeHours: settings?.minBookingNoticeHours ?? 12,
  })
}

// ==========================================
// Appointments: Request, Confirm, Cancel, Reschedule (B-02, B-03)
// ==========================================

export const requestAppointmentSchema = z.object({
  professionalId: z.string().uuid(),
  serviceTypeId: z.string().uuid(),
  startsAt: z.string().datetime(),
  modality: z.enum(['in_person', 'online', 'both']),
})

export type RequestAppointmentInput = z.infer<typeof requestAppointmentSchema>

export async function requestAppointment(session: Session, rawInput: RequestAppointmentInput) {
  requireRoleIn(session, 'patient')
  const input = requestAppointmentSchema.parse(rawInput)
  const patientId = await getPatientProfileId(session.user.id)
  if (!patientId) throw new NotFoundError('Perfil de paciente no encontrado.')

  const [st] = await db
    .select()
    .from(serviceType)
    .where(and(eq(serviceType.id, input.serviceTypeId), eq(serviceType.professionalId, input.professionalId)))
    .limit(1)

  if (!st) throw new NotFoundError('Servicio no encontrado.')

  // Check bond status
  const openBond = await getOpenBondForPatient(session)
  const bondWithPro = openBond?.professionalId === input.professionalId ? openBond : null

  const allowedBond = canRequestAppointment({
    bondStatus: bondWithPro?.status ?? null,
    isFirstConsultation: st.isFirstConsultation,
  })

  if (!allowedBond.ok) {
    throw new RuleViolationError(allowedBond.rule, allowedBond.message)
  }

  const startsAt = new Date(input.startsAt)
  const now = new Date()

  // Check notice
  const allowedNotice = meetsBookingNotice(startsAt, now)
  if (!allowedNotice.ok) {
    throw new RuleViolationError(allowedNotice.rule, allowedNotice.message)
  }

  const endsAt = new Date(startsAt.getTime() + st.durationMin * 60 * 1000)
  const expiresAt = requestExpiresAt(now, startsAt)

  // Create appointment in 'requested' status
  const [created] = await db
    .insert(appointment)
    .values({
      professionalId: input.professionalId,
      patientId,
      bondId: bondWithPro?.id ?? null,
      serviceTypeId: input.serviceTypeId,
      startsAt,
      endsAt,
      modality: input.modality,
      status: 'requested',
      expiresAt,
    })
    .returning()

  return created
}

export async function confirmAppointment(session: Session, appointmentId: string) {
  requireRoleIn(session, 'professional')
  const profId = await getProfessionalProfileId(session.user.id)
  if (!profId) throw new NotFoundError('Perfil no encontrado.')

  const [apt] = await db
    .select()
    .from(appointment)
    .where(and(eq(appointment.id, appointmentId), eq(appointment.professionalId, profId)))
    .limit(1)

  if (!apt) throw new NotFoundError('Turno no encontrado.')
  if (apt.status !== 'requested') {
    throw new RuleViolationError('R-10', 'Solo se pueden confirmar turnos solicitados.')
  }

  let videoRoomName: string | null = null
  if (apt.modality === 'online' || apt.modality === 'both') {
    if (videoProvider.isConfigured) {
      const room = await videoProvider.roomFor({
        id: apt.id,
        startsAt: apt.startsAt,
        endsAt: apt.endsAt,
      })
      videoRoomName = room.name
    }
  }

  const [confirmed] = await db
    .update(appointment)
    .set({
      status: 'confirmed',
      videoRoomName,
      updatedAt: new Date(),
    })
    .where(eq(appointment.id, appointmentId))
    .returning()

  return confirmed
}

export async function rejectAppointment(session: Session, appointmentId: string, reason?: string) {
  requireRoleIn(session, 'professional')
  const profId = await getProfessionalProfileId(session.user.id)
  if (!profId) throw new NotFoundError('Perfil no encontrado.')

  const [apt] = await db
    .select()
    .from(appointment)
    .where(and(eq(appointment.id, appointmentId), eq(appointment.professionalId, profId)))
    .limit(1)

  if (!apt) throw new NotFoundError('Turno no encontrado.')

  const [rejected] = await db
    .update(appointment)
    .set({
      status: 'rejected',
      cancelledBy: 'professional',
      cancelReason: reason ?? 'Turno no confirmado',
      updatedAt: new Date(),
    })
    .where(eq(appointment.id, appointmentId))
    .returning()

  return rejected
}

export async function cancelAppointment(session: Session, appointmentId: string, reason: string) {
  const role = session.user.role
  if (role !== 'patient' && role !== 'professional') throw new ForbiddenError('Acceso denegado.')

  const [apt] = await db
    .select()
    .from(appointment)
    .where(eq(appointment.id, appointmentId))
    .limit(1)

  if (!apt) throw new NotFoundError('Turno no encontrado.')

  const late = isLateCancellation(apt.startsAt, new Date())

  const [cancelled] = await db
    .update(appointment)
    .set({
      status: 'cancelled',
      cancelledBy: role,
      cancelReason: reason,
      lateCancellation: late,
      updatedAt: new Date(),
    })
    .where(eq(appointment.id, appointmentId))
    .returning()

  return cancelled
}

export async function rescheduleAppointment(
  session: Session,
  appointmentId: string,
  newStartsAt: string,
) {
  const role = session.user.role
  if (role !== 'patient' && role !== 'professional') throw new ForbiddenError('Acceso denegado.')

  const [apt] = await db
    .select()
    .from(appointment)
    .where(eq(appointment.id, appointmentId))
    .limit(1)

  if (!apt) throw new NotFoundError('Turno no encontrado.')

  if (role === 'patient') {
    const allowed = canPatientReschedule(apt.patientRescheduleCount)
    if (!allowed.ok) throw new RuleViolationError(allowed.rule, allowed.message)
  }

  const [st] = await db
    .select()
    .from(serviceType)
    .where(eq(serviceType.id, apt.serviceTypeId))
    .limit(1)

  const starts = new Date(newStartsAt)
  const ends = new Date(starts.getTime() + (st?.durationMin ?? 50) * 60 * 1000)

  // Mark previous appointment rescheduled
  await db
    .update(appointment)
    .set({ status: 'rescheduled', updatedAt: new Date() })
    .where(eq(appointment.id, appointmentId))

  // Create new appointment
  const [created] = await db
    .insert(appointment)
    .values({
      professionalId: apt.professionalId,
      patientId: apt.patientId,
      bondId: apt.bondId,
      serviceTypeId: apt.serviceTypeId,
      startsAt: starts,
      endsAt: ends,
      modality: apt.modality,
      status: 'confirmed',
      rescheduledFromId: apt.id,
      patientRescheduleCount: apt.patientRescheduleCount + (role === 'patient' ? 1 : 0),
    })
    .returning()

  return created
}

export async function completeAppointment(session: Session, appointmentId: string) {
  requireRoleIn(session, 'professional')
  const profId = await getProfessionalProfileId(session.user.id)
  if (!profId) throw new NotFoundError('Perfil no encontrado.')

  const [completed] = await db
    .update(appointment)
    .set({
      status: 'completed',
      updatedAt: new Date(),
    })
    .where(and(eq(appointment.id, appointmentId), eq(appointment.professionalId, profId)))
    .returning()

  return completed
}

export async function markNoShow(session: Session, appointmentId: string) {
  requireRoleIn(session, 'professional')
  const profId = await getProfessionalProfileId(session.user.id)
  if (!profId) throw new NotFoundError('Perfil no encontrado.')

  const [updated] = await db
    .update(appointment)
    .set({
      status: 'no_show',
      updatedAt: new Date(),
    })
    .where(and(eq(appointment.id, appointmentId), eq(appointment.professionalId, profId)))
    .returning()

  return updated
}

// ==========================================
// User List Queries
// ==========================================

export async function getMyAppointmentsForPatient(session: Session) {
  requireRoleIn(session, 'patient')
  const patientId = await getPatientProfileId(session.user.id)
  if (!patientId) throw new NotFoundError('Perfil no encontrado.')

  return db
    .select({
      id: appointment.id,
      professionalId: appointment.professionalId,
      startsAt: appointment.startsAt,
      endsAt: appointment.endsAt,
      modality: appointment.modality,
      status: appointment.status,
      cancelReason: appointment.cancelReason,
      lateCancellation: appointment.lateCancellation,
      videoRoomName: appointment.videoRoomName,
      serviceName: serviceType.name,
      durationMin: serviceType.durationMin,
      fee: serviceType.fee,
      professionalName: professionalProfile.displayName,
      professionalPhotoUrl: professionalProfile.photoUrl,
    })
    .from(appointment)
    .innerJoin(serviceType, eq(appointment.serviceTypeId, serviceType.id))
    .innerJoin(professionalProfile, eq(appointment.professionalId, professionalProfile.id))
    .where(eq(appointment.patientId, patientId))
    .orderBy(desc(appointment.startsAt))
}

export async function getMyAppointmentsForProfessional(session: Session) {
  requireRoleIn(session, 'professional')
  const profId = await getProfessionalProfileId(session.user.id)
  if (!profId) throw new NotFoundError('Perfil no encontrado.')

  return db
    .select({
      id: appointment.id,
      patientId: appointment.patientId,
      bondId: appointment.bondId,
      startsAt: appointment.startsAt,
      endsAt: appointment.endsAt,
      modality: appointment.modality,
      status: appointment.status,
      cancelReason: appointment.cancelReason,
      lateCancellation: appointment.lateCancellation,
      videoRoomName: appointment.videoRoomName,
      serviceName: serviceType.name,
      durationMin: serviceType.durationMin,
      fee: serviceType.fee,
      patientFirstName: patientProfile.firstName,
      patientLastName: patientProfile.lastName,
    })
    .from(appointment)
    .innerJoin(serviceType, eq(appointment.serviceTypeId, serviceType.id))
    .innerJoin(patientProfile, eq(appointment.patientId, patientProfile.id))
    .where(eq(appointment.professionalId, profId))
    .orderBy(desc(appointment.startsAt))
}
