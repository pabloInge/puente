import 'server-only'
import { and, asc, desc, eq, isNull, or } from 'drizzle-orm'
import { z } from 'zod'
import { logAudit } from '@/lib/audit'
import { hashContent } from '@/lib/crypto'
import { db } from '@/lib/db'
import {
  appointment,
  clinicalEntry,
  clinicalRecordRequest,
  clinicalTemplate,
  patientProfile,
  professionalProfile,
  type ClinicalSection,
  type TemplateSection,
} from '@/lib/db/schema'
import { recordCopyDueAt } from '@/lib/policies/clinical-record'
import type { Session } from '@/lib/session'
import { requireRoleIn } from './_base'
import {
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

// ==========================================
// Clinical Entries (C-01)
// ==========================================

export const clinicalSectionSchema = z.object({
  title: z.string().trim().min(1, 'El título de la sección es obligatorio.'),
  body: z.string().trim().min(1, 'El contenido de la sección no puede estar vacío.'),
})

export const createClinicalEntrySchema = z.object({
  bondId: z.string().uuid(),
  kind: z.enum(['starting_point', 'first_impressions', 'evolution']),
  appointmentId: z.string().uuid().optional().nullable(),
  templateId: z.string().uuid().optional().nullable(),
  content: z.array(clinicalSectionSchema).min(1, 'La entrada debe tener al menos una sección.'),
})

export type CreateClinicalEntryInput = z.infer<typeof createClinicalEntrySchema>

export async function listClinicalEntries(session: Session, bondId: string) {
  const access = await requireBondAccess(session, bondId, 'read-historical')

  const entries = await db
    .select({
      id: clinicalEntry.id,
      bondId: clinicalEntry.bondId,
      authorProfessionalId: clinicalEntry.authorProfessionalId,
      kind: clinicalEntry.kind,
      amendsEntryId: clinicalEntry.amendsEntryId,
      appointmentId: clinicalEntry.appointmentId,
      templateId: clinicalEntry.templateId,
      content: clinicalEntry.content,
      contentHash: clinicalEntry.contentHash,
      authorLicenseSnapshot: clinicalEntry.authorLicenseSnapshot,
      createdAt: clinicalEntry.createdAt,
    })
    .from(clinicalEntry)
    .where(eq(clinicalEntry.bondId, access.bond.id))
    .orderBy(asc(clinicalEntry.createdAt))

  // Audit read (R-11)
  await logAudit({
    actorUserId: session.user.id,
    action: 'read',
    entity: 'clinical_entry',
    bondId: access.bond.id,
  })

  // Validate integrity hashes (R-04)
  return entries.map((e) => {
    const computedHash = hashContent(e.content)
    const isTampered = computedHash !== e.contentHash
    return {
      ...e,
      isTampered,
    }
  })
}

export async function createClinicalEntry(session: Session, rawInput: CreateClinicalEntryInput) {
  requireRoleIn(session, 'professional')
  const input = createClinicalEntrySchema.parse(rawInput)

  const access = await requireBondAccess(session, input.bondId, 'write', { party: 'professional' })
  const profId = access.professionalId

  // Snapshot of author license
  const [prof] = await db
    .select({ licenseNumber: professionalProfile.licenseNumber, licenseJurisdiction: professionalProfile.licenseJurisdiction })
    .from(professionalProfile)
    .where(eq(professionalProfile.id, profId))
    .limit(1)

  const licenseSnapshot = prof
    ? `${prof.licenseJurisdiction ?? ''} ${prof.licenseNumber ?? ''}`.trim()
    : null

  const contentHash = hashContent(input.content)

  const [created] = await db
    .insert(clinicalEntry)
    .values({
      bondId: access.bond.id,
      authorProfessionalId: profId,
      kind: input.kind,
      appointmentId: input.appointmentId ?? null,
      templateId: input.templateId ?? null,
      content: input.content,
      contentHash,
      authorLicenseSnapshot: licenseSnapshot,
    })
    .returning()

  // Audit creation (R-11)
  await logAudit({
    actorUserId: session.user.id,
    action: 'create',
    entity: 'clinical_entry',
    entityId: created.id,
    bondId: access.bond.id,
  })

  return created
}

export const createAmendmentSchema = z.object({
  bondId: z.string().uuid(),
  amendsEntryId: z.string().uuid(),
  content: z.array(clinicalSectionSchema).min(1),
})

export type CreateAmendmentInput = z.infer<typeof createAmendmentSchema>

export async function createAmendment(session: Session, rawInput: CreateAmendmentInput) {
  requireRoleIn(session, 'professional')
  const input = createAmendmentSchema.parse(rawInput)

  const access = await requireBondAccess(session, input.bondId, 'write', { party: 'professional' })
  const profId = access.professionalId

  // Verify target entry exists in this bond
  const [target] = await db
    .select()
    .from(clinicalEntry)
    .where(and(eq(clinicalEntry.id, input.amendsEntryId), eq(clinicalEntry.bondId, access.bond.id)))
    .limit(1)

  if (!target) throw new NotFoundError('Entrada a enmendar no encontrada.')

  const [prof] = await db
    .select({ licenseNumber: professionalProfile.licenseNumber, licenseJurisdiction: professionalProfile.licenseJurisdiction })
    .from(professionalProfile)
    .where(eq(professionalProfile.id, profId))
    .limit(1)

  const licenseSnapshot = prof
    ? `${prof.licenseJurisdiction ?? ''} ${prof.licenseNumber ?? ''}`.trim()
    : null

  const contentHash = hashContent(input.content)

  const [created] = await db
    .insert(clinicalEntry)
    .values({
      bondId: access.bond.id,
      authorProfessionalId: profId,
      kind: 'amendment',
      amendsEntryId: input.amendsEntryId,
      content: input.content,
      contentHash,
      authorLicenseSnapshot: licenseSnapshot,
    })
    .returning()

  // Audit amendment (R-11)
  await logAudit({
    actorUserId: session.user.id,
    action: 'amend',
    entity: 'clinical_entry',
    entityId: created.id,
    bondId: access.bond.id,
  })

  return created
}

// ==========================================
// Clinical Templates (C-02)
// ==========================================

export async function listClinicalTemplates(session: Session) {
  requireRoleIn(session, 'professional')
  const profId = await getProfessionalProfileId(session.user.id)
  if (!profId) throw new NotFoundError('Perfil no encontrado.')

  return db
    .select()
    .from(clinicalTemplate)
    .where(
      or(
        isNull(clinicalTemplate.ownerProfessionalId),
        eq(clinicalTemplate.ownerProfessionalId, profId),
      ),
    )
    .orderBy(asc(clinicalTemplate.name))
}

export const createTemplateSchema = z.object({
  name: z.string().trim().min(2, 'El nombre debe tener al menos 2 caracteres.'),
  entryKind: z.enum(['starting_point', 'first_impressions', 'evolution']),
  sections: z.array(
    z.object({
      title: z.string().trim().min(1),
      hint: z.string().trim().optional(),
    }),
  ),
})

export type CreateTemplateInput = z.infer<typeof createTemplateSchema>

export async function createClinicalTemplate(session: Session, rawInput: CreateTemplateInput) {
  requireRoleIn(session, 'professional')
  const input = createTemplateSchema.parse(rawInput)
  const profId = await getProfessionalProfileId(session.user.id)
  if (!profId) throw new NotFoundError('Perfil no encontrado.')

  const [created] = await db
    .insert(clinicalTemplate)
    .values({
      ownerProfessionalId: profId,
      name: input.name,
      entryKind: input.entryKind,
      sections: input.sections,
    })
    .returning()

  return created
}

// ==========================================
// Clinical Record Copy Requests (C-04)
// ==========================================

export async function requestClinicalRecordCopy(session: Session, bondId: string) {
  requireRoleIn(session, 'patient')
  const access = await requireBondAccess(session, bondId, 'read-historical', { party: 'patient' })

  const now = new Date()
  const dueAt = recordCopyDueAt(now) // 48h limit (R-14)

  const [created] = await db
    .insert(clinicalRecordRequest)
    .values({
      bondId: access.bond.id,
      requestedAt: now,
      dueAt,
    })
    .returning()

  await logAudit({
    actorUserId: session.user.id,
    action: 'request_copy',
    entity: 'clinical_record_request',
    entityId: created.id,
    bondId: access.bond.id,
  })

  return created
}

export async function fulfillClinicalRecordCopy(session: Session, requestId: string, exportUrl: string) {
  requireRoleIn(session, 'professional')
  const profId = await getProfessionalProfileId(session.user.id)
  if (!profId) throw new NotFoundError('Perfil no encontrado.')

  const [req] = await db
    .select()
    .from(clinicalRecordRequest)
    .where(eq(clinicalRecordRequest.id, requestId))
    .limit(1)

  if (!req) throw new NotFoundError('Solicitud de copia no encontrada.')

  const [updated] = await db
    .update(clinicalRecordRequest)
    .set({
      fulfilledAt: new Date(),
      exportUrl,
      updatedAt: new Date(),
    })
    .where(eq(clinicalRecordRequest.id, requestId))
    .returning()

  await logAudit({
    actorUserId: session.user.id,
    action: 'export',
    entity: 'clinical_record_request',
    entityId: req.id,
    bondId: req.bondId,
  })

  return updated
}

export async function listClinicalRecordRequestsForProfessional(session: Session) {
  requireRoleIn(session, 'professional')
  const profId = await getProfessionalProfileId(session.user.id)
  if (!profId) throw new NotFoundError('Perfil no encontrado.')

  return db
    .select({
      id: clinicalRecordRequest.id,
      bondId: clinicalRecordRequest.bondId,
      requestedAt: clinicalRecordRequest.requestedAt,
      dueAt: clinicalRecordRequest.dueAt,
      fulfilledAt: clinicalRecordRequest.fulfilledAt,
      exportUrl: clinicalRecordRequest.exportUrl,
      patientFirstName: patientProfile.firstName,
      patientLastName: patientProfile.lastName,
    })
    .from(clinicalRecordRequest)
    .innerJoin(patientProfile, eq(patientProfile.id, patientProfile.id))
    .orderBy(asc(clinicalRecordRequest.dueAt))
}
