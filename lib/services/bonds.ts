import 'server-only'
import { and, desc, eq, inArray } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '@/lib/db'
import {
  appointment,
  bond,
  consentAcceptance,
  consentVersion,
  conversation,
  intake,
  pastExperience,
  patientProfile,
  professionalProfile,
  user,
} from '@/lib/db/schema'
import {
  canActivateBond,
  canOpenBond,
  OPEN_BOND_STATUSES,
} from '@/lib/policies/bond'
import { toPatientPreview } from '@/lib/policies/patient-visibility'
import type { Session } from '@/lib/session'
import { requireRoleIn } from './_base'
import {
  getOpenBondForPatient,
  getPatientProfileId,
  getProfessionalProfileId,
  requireBondAccess,
} from './bond-access'
import {
  ForbiddenError,
  InvalidInputError,
  NotFoundError,
  RuleViolationError,
} from './errors'

export const requestBondSchema = z.object({
  professionalId: z.string().uuid(),
  requestMessage: z.string().trim().min(5, 'El mensaje debe tener al menos 5 caracteres.').max(2000),
})

export type RequestBondInput = z.infer<typeof requestBondSchema>

export async function requestBond(session: Session, rawInput: RequestBondInput) {
  requireRoleIn(session, 'patient')
  const input = requestBondSchema.parse(rawInput)

  const patientId = await getPatientProfileId(session.user.id)
  if (!patientId) throw new NotFoundError('Perfil de paciente no encontrado.')

  // Check R-12: only one open bond allowed per patient
  const existingBond = await getOpenBondForPatient(session)
  const allowed = canOpenBond(existingBond?.status ?? null)
  if (!allowed.ok) {
    throw new RuleViolationError(allowed.rule, allowed.message)
  }

  // Check professional exists and is published
  const [prof] = await db
    .select()
    .from(professionalProfile)
    .where(eq(professionalProfile.id, input.professionalId))
    .limit(1)

  if (!prof || !prof.isPublished) {
    throw new NotFoundError('El profesional no está disponible para recibir solicitudes.')
  }

  // Create the bond
  const [newBond] = await db
    .insert(bond)
    .values({
      patientId,
      professionalId: input.professionalId,
      status: 'requested',
      requestMessage: input.requestMessage,
      requestedAt: new Date(),
    })
    .returning()

  // Link or create conversation
  const [existingConv] = await db
    .select()
    .from(conversation)
    .where(
      and(
        eq(conversation.patientId, patientId),
        eq(conversation.professionalId, input.professionalId),
      ),
    )
    .limit(1)

  if (existingConv) {
    await db
      .update(conversation)
      .set({ bondId: newBond.id, updatedAt: new Date() })
      .where(eq(conversation.id, existingConv.id))
  } else {
    await db.insert(conversation).values({
      patientId,
      professionalId: input.professionalId,
      bondId: newBond.id,
      status: 'pre_bond',
      patientMessagesBeforeReply: 0,
      lastMessageAt: new Date(),
    })
  }

  return newBond
}

export async function listBondRequestsForProfessional(session: Session) {
  requireRoleIn(session, 'professional')
  const profId = await getProfessionalProfileId(session.user.id)
  if (!profId) throw new NotFoundError('Perfil de profesional no encontrado.')

  const requests = await db
    .select({
      id: bond.id,
      status: bond.status,
      requestMessage: bond.requestMessage,
      requestedAt: bond.requestedAt,
      patientId: bond.patientId,
      firstName: patientProfile.firstName,
      birthDate: user.birthDate,
      city: patientProfile.city,
      province: patientProfile.province,
      initialTopics: patientProfile.initialTopics,
    })
    .from(bond)
    .innerJoin(patientProfile, eq(bond.patientId, patientProfile.id))
    .innerJoin(user, eq(patientProfile.userId, user.id))
    .where(and(eq(bond.professionalId, profId), eq(bond.status, 'requested')))
    .orderBy(desc(bond.requestedAt))

  // R-01: PatientPreview sanitization (only safe attributes)
  return requests.map((r) => ({
    id: r.id,
    status: r.status,
    requestMessage: r.requestMessage,
    requestedAt: r.requestedAt,
    preview: toPatientPreview({
      firstName: r.firstName,
      birthDate: r.birthDate,
      province: r.province,
      initialTopics: r.initialTopics,
      requestMessage: r.requestMessage,
    }),
  }))
}

export async function acceptBondRequest(session: Session, bondId: string) {
  requireRoleIn(session, 'professional')
  const profId = await getProfessionalProfileId(session.user.id)
  if (!profId) throw new NotFoundError('Perfil no encontrado.')

  const [b] = await db
    .select()
    .from(bond)
    .where(and(eq(bond.id, bondId), eq(bond.professionalId, profId)))
    .limit(1)

  if (!b) throw new NotFoundError('Solicitud de vínculo no encontrada.')
  if (b.status !== 'requested') {
    throw new RuleViolationError('R-01', 'Solo podés aceptar solicitudes en estado pendiente.')
  }

  const [accepted] = await db
    .update(bond)
    .set({
      status: 'awaiting_consent',
      acceptedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(bond.id, bondId))
    .returning()

  // Transition conversation to bond mode
  await db
    .update(conversation)
    .set({ status: 'bond', updatedAt: new Date() })
    .where(eq(conversation.bondId, bondId))

  return accepted
}

export async function rejectBondRequest(session: Session, bondId: string, reason?: string) {
  requireRoleIn(session, 'professional')
  const profId = await getProfessionalProfileId(session.user.id)
  if (!profId) throw new NotFoundError('Perfil no encontrado.')

  const [b] = await db
    .select()
    .from(bond)
    .where(and(eq(bond.id, bondId), eq(bond.professionalId, profId)))
    .limit(1)

  if (!b) throw new NotFoundError('Solicitud no encontrada.')
  if (b.status !== 'requested') {
    throw new RuleViolationError('R-01', 'Solo podés rechazar solicitudes pendientes.')
  }

  const [rejected] = await db
    .update(bond)
    .set({
      status: 'rejected',
      rejectionReason: reason ?? 'El profesional no dispone de cupos en este momento.',
      updatedAt: new Date(),
    })
    .where(eq(bond.id, bondId))
    .returning()

  return rejected
}

export async function acceptConsent(
  session: Session,
  bondId: string,
  metadata: { ip?: string; userAgent?: string } = {},
) {
  requireRoleIn(session, 'patient')
  const patientId = await getPatientProfileId(session.user.id)
  if (!patientId) throw new NotFoundError('Perfil de paciente no encontrado.')

  const [b] = await db
    .select()
    .from(bond)
    .where(and(eq(bond.id, bondId), eq(bond.patientId, patientId)))
    .limit(1)

  if (!b) throw new NotFoundError('Vínculo no encontrado.')
  if (b.status !== 'awaiting_consent') {
    throw new RuleViolationError('R-08', 'El vínculo no está pendiente de consentimiento.')
  }

  // Get current active informed consent
  const [currentConsent] = await db
    .select()
    .from(consentVersion)
    .where(and(eq(consentVersion.kind, 'informed_consent'), eq(consentVersion.isCurrent, true)))
    .limit(1)

  if (!currentConsent) {
    throw new NotFoundError('No se encontró una versión vigente del consentimiento informado.')
  }

  // Register consent acceptance
  await db.insert(consentAcceptance).values({
    bondId: b.id,
    consentVersionId: currentConsent.id,
    ip: metadata.ip ?? null,
    userAgent: metadata.userAgent ?? null,
    acceptedAt: new Date(),
  })

  // Activate bond (R-08)
  const [activated] = await db
    .update(bond)
    .set({
      status: 'active',
      activatedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(bond.id, b.id))
    .returning()

  return activated
}

export const submitIntakeSchema = z.object({
  bondId: z.string().uuid(),
  needs: z.string().trim().min(5, 'Indicá tus necesidades o expectativas con el tratamiento.'),
  reasonToStart: z.string().trim().min(5, 'Contanos qué motivó la consulta.'),
})

export type SubmitIntakeInput = z.infer<typeof submitIntakeSchema>

export async function submitIntake(session: Session, rawInput: SubmitIntakeInput) {
  requireRoleIn(session, 'patient')
  const input = submitIntakeSchema.parse(rawInput)

  const access = await requireBondAccess(session, input.bondId, 'write', { party: 'patient' })

  const [created] = await db
    .insert(intake)
    .values({
      bondId: access.bond.id,
      needs: input.needs,
      reasonToStart: input.reasonToStart,
      submittedAt: new Date(),
    })
    .returning()

  return created
}

export async function breakBond(session: Session, bondId: string, reason: string) {
  const role = session.user.role
  if (role !== 'patient' && role !== 'professional') {
    throw new ForbiddenError('Acceso denegado.')
  }

  const access = await requireBondAccess(session, bondId, 'read-active')
  const b = access.bond

  if (b.status !== 'active' && b.status !== 'awaiting_consent') {
    throw new RuleViolationError('R-13', 'Solo se puede finalizar un vínculo activo o en espera de consentimiento.')
  }

  const now = new Date()

  // 1. Update bond status
  const [endedBond] = await db
    .update(bond)
    .set({
      status: 'ended',
      endedBy: role,
      endReason: reason,
      endedAt: now,
      updatedAt: now,
    })
    .where(eq(bond.id, b.id))
    .returning()

  // 2. Cancel future appointments
  await db
    .update(appointment)
    .set({
      status: 'cancelled',
      cancelReason: 'Vínculo finalizado',
      updatedAt: now,
    })
    .where(
      and(
        eq(appointment.bondId, b.id),
        inArray(appointment.status, ['requested', 'confirmed']),
      ),
    )

  // 3. Close conversation
  await db
    .update(conversation)
    .set({
      status: 'closed',
      closedReason: 'bond_ended',
      updatedAt: now,
    })
    .where(eq(conversation.bondId, b.id))

  // 4. R-13: Create a past experience entry for the patient
  await db.insert(pastExperience).values({
    patientId: b.patientId,
    professionalId: b.professionalId,
    periodFrom: b.activatedAt ? b.activatedAt.toISOString().slice(0, 10) : null,
    periodTo: now.toISOString().slice(0, 10),
    reason: b.requestMessage ?? 'Tratamiento en Puente',
    outcome: reason,
  })

  return endedBond
}
