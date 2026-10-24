import 'server-only'
import { and, desc, eq, inArray } from 'drizzle-orm'
import { z } from 'zod'
import { decryptNullable, encryptNullable } from '@/lib/crypto'
import { db } from '@/lib/db'
import {
  branch,
  coverage,
  pastExperience,
  patientProfile,
  professionalBranch,
  professionalCoverage,
  professionalProfile,
  user,
} from '@/lib/db/schema'
import type { Session } from '@/lib/session'
import {
  createContext,
  defineService,
  requireRoleIn,
  toActionResult,
} from './_base'
import { getPatientProfileId, getProfessionalProfileId } from './bond-access'
import {
  ForbiddenError,
  InvalidInputError,
  NotFoundError,
  RuleViolationError,
} from './errors'

// ==========================================
// Professional Profile Schemas & Service
// ==========================================

export const updateProfessionalProfileSchema = z.object({
  displayName: z.string().trim().min(2, 'El nombre debe tener al menos 2 caracteres.'),
  bio: z.string().trim().max(2000).optional().nullable(),
  photoUrl: z.string().url('URL inválida').optional().nullable().or(z.literal('')),
  licenseNumber: z.string().trim().optional().nullable(),
  licenseJurisdiction: z.string().trim().optional().nullable(),
  theoreticalApproach: z.array(z.string()).default([]),
  modality: z.enum(['in_person', 'online', 'both']).default('both'),
  province: z.string().trim().optional().nullable(),
  city: z.string().trim().optional().nullable(),
  address: z.string().trim().optional().nullable(),
  languages: z.array(z.string()).default(['es']),
  feeMin: z.number().int().nonnegative().optional().nullable(),
  feeMax: z.number().int().nonnegative().optional().nullable(),
  acceptsNewPatients: z.boolean().default(true),
  branchIds: z.array(z.string().uuid()).default([]),
  coverageIds: z.array(z.string().uuid()).default([]),
})

export type UpdateProfessionalProfileInput = z.infer<typeof updateProfessionalProfileSchema>

export async function getMyProfessionalProfile(session: Session) {
  requireRoleIn(session, 'professional')
  const profileId = await getProfessionalProfileId(session.user.id)
  if (!profileId) {
    throw new NotFoundError('No se encontró el perfil del profesional.')
  }

  const [prof] = await db
    .select()
    .from(professionalProfile)
    .where(eq(professionalProfile.id, profileId))
    .limit(1)

  if (!prof) throw new NotFoundError('No se encontró el perfil del profesional.')

  const branches = await db
    .select({ branchId: professionalBranch.branchId, name: branch.name, slug: branch.slug })
    .from(professionalBranch)
    .innerJoin(branch, eq(professionalBranch.branchId, branch.id))
    .where(eq(professionalBranch.professionalId, profileId))

  const coverages = await db
    .select({ coverageId: professionalCoverage.coverageId, name: coverage.name, type: coverage.type })
    .from(professionalCoverage)
    .innerJoin(coverage, eq(professionalCoverage.coverageId, coverage.id))
    .where(eq(professionalCoverage.professionalId, profileId))

  return {
    ...prof,
    branches,
    coverages,
  }
}

export async function updateProfessionalProfile(session: Session, rawInput: UpdateProfessionalProfileInput) {
  requireRoleIn(session, 'professional')
  const input = updateProfessionalProfileSchema.parse(rawInput)
  const profileId = await getProfessionalProfileId(session.user.id)
  if (!profileId) throw new NotFoundError('Perfil no encontrado.')

  const [updated] = await db
    .update(professionalProfile)
    .set({
      displayName: input.displayName,
      bio: input.bio ?? null,
      photoUrl: input.photoUrl || null,
      licenseNumber: input.licenseNumber ?? null,
      licenseJurisdiction: input.licenseJurisdiction ?? null,
      theoreticalApproach: input.theoreticalApproach,
      modality: input.modality,
      province: input.province ?? null,
      city: input.city ?? null,
      address: input.address ?? null,
      languages: input.languages,
      feeMin: input.feeMin ?? null,
      feeMax: input.feeMax ?? null,
      acceptsNewPatients: input.acceptsNewPatients,
      updatedAt: new Date(),
    })
    .where(eq(professionalProfile.id, profileId))
    .returning()

  // Sync branches
  await db.delete(professionalBranch).where(eq(professionalBranch.professionalId, profileId))
  if (input.branchIds.length > 0) {
    await db.insert(professionalBranch).values(
      input.branchIds.map((bId) => ({
        professionalId: profileId,
        branchId: bId,
      })),
    )
  }

  // Sync coverages
  await db.delete(professionalCoverage).where(eq(professionalCoverage.professionalId, profileId))
  if (input.coverageIds.length > 0) {
    await db.insert(professionalCoverage).values(
      input.coverageIds.map((cId) => ({
        professionalId: profileId,
        coverageId: cId,
      })),
    )
  }

  return updated
}

export async function publishProfessionalProfile(session: Session) {
  requireRoleIn(session, 'professional')
  const profileId = await getProfessionalProfileId(session.user.id)
  if (!profileId) throw new NotFoundError('Perfil no encontrado.')

  const [prof] = await db
    .select()
    .from(professionalProfile)
    .where(eq(professionalProfile.id, profileId))
    .limit(1)

  if (!prof) throw new NotFoundError('Perfil no encontrado.')

  const branches = await db
    .select()
    .from(professionalBranch)
    .where(eq(professionalBranch.professionalId, profileId))

  const errors: Record<string, string> = {}
  if (!prof.displayName || prof.displayName.trim().length < 2) errors.displayName = 'El nombre es obligatorio.'
  if (!prof.bio || prof.bio.trim().length < 10) errors.bio = 'La biografía debe tener al menos 10 caracteres.'
  if (!prof.licenseNumber) errors.licenseNumber = 'El número de matrícula es obligatorio para publicar.'
  if (!prof.licenseJurisdiction) errors.licenseJurisdiction = 'La jurisdicción de la matrícula es obligatoria.'
  if (!prof.feeMin) errors.feeMin = 'Los honorarios mínimos son obligatorios.'
  if (branches.length === 0) errors.branchIds = 'Debés seleccionar al menos una rama de atención.'

  if (Object.keys(errors).length > 0) {
    throw new InvalidInputError(errors)
  }

  const [published] = await db
    .update(professionalProfile)
    .set({
      isPublished: true,
      updatedAt: new Date(),
    })
    .where(eq(professionalProfile.id, profileId))
    .returning()

  return published
}

export async function getPublicProfessionalProfile(id: string) {
  const [prof] = await db
    .select()
    .from(professionalProfile)
    .where(eq(professionalProfile.id, id))
    .limit(1)

  if (!prof) throw new NotFoundError('No se encontró el profesional solicitado.')
  if (!prof.isPublished) throw new NotFoundError('Este perfil aún no ha sido publicado.')

  const branches = await db
    .select({ id: branch.id, name: branch.name, slug: branch.slug, description: branch.description })
    .from(professionalBranch)
    .innerJoin(branch, eq(professionalBranch.branchId, branch.id))
    .where(eq(professionalBranch.professionalId, id))

  const coverages = await db
    .select({
      id: coverage.id,
      name: coverage.name,
      type: coverage.type,
      notes: professionalCoverage.notes,
    })
    .from(professionalCoverage)
    .innerJoin(coverage, eq(professionalCoverage.coverageId, coverage.id))
    .where(eq(professionalCoverage.professionalId, id))

  return {
    id: prof.id,
    displayName: prof.displayName,
    bio: prof.bio,
    photoUrl: prof.photoUrl,
    licenseNumber: prof.licenseNumber,
    licenseJurisdiction: prof.licenseJurisdiction,
    licenseVerified: prof.licenseVerified,
    theoreticalApproach: prof.theoreticalApproach,
    modality: prof.modality,
    province: prof.province,
    city: prof.city,
    address: prof.address,
    languages: prof.languages,
    feeMin: prof.feeMin,
    feeMax: prof.feeMax,
    acceptsNewPatients: prof.acceptsNewPatients,
    branches,
    coverages,
  }
}

// ==========================================
// Patient Profile Schemas & Service
// ==========================================

export const updatePatientProfileSchema = z.object({
  firstName: z.string().trim().min(2, 'El nombre debe tener al menos 2 caracteres.'),
  lastName: z.string().trim().min(2, 'El apellido debe tener al menos 2 caracteres.'),
  dni: z.string().trim().min(6, 'DNI inválido.').max(10, 'DNI inválido.').optional().nullable(),
  gender: z.string().trim().optional().nullable(),
  phone: z.string().trim().optional().nullable(),
  province: z.string().trim().optional().nullable(),
  city: z.string().trim().optional().nullable(),
  coverageId: z.string().uuid().optional().nullable(),
  coverageMemberNumber: z.string().trim().optional().nullable(),
  emergencyContactName: z.string().trim().optional().nullable(),
  emergencyContactPhone: z.string().trim().optional().nullable(),
  initialTopics: z.string().trim().max(1000).optional().nullable(),
})

export type UpdatePatientProfileInput = z.infer<typeof updatePatientProfileSchema>

export async function getMyPatientProfile(session: Session) {
  requireRoleIn(session, 'patient')
  const profileId = await getPatientProfileId(session.user.id)
  if (!profileId) throw new NotFoundError('No se encontró el perfil de paciente.')

  const [patient] = await db
    .select()
    .from(patientProfile)
    .where(eq(patientProfile.id, profileId))
    .limit(1)

  if (!patient) throw new NotFoundError('No se encontró el perfil de paciente.')

  return {
    ...patient,
    dni: decryptNullable(patient.dni),
  }
}

export async function updatePatientProfile(session: Session, rawInput: UpdatePatientProfileInput) {
  requireRoleIn(session, 'patient')
  const input = updatePatientProfileSchema.parse(rawInput)
  const profileId = await getPatientProfileId(session.user.id)
  if (!profileId) throw new NotFoundError('No se encontró el perfil de paciente.')

  const [updated] = await db
    .update(patientProfile)
    .set({
      firstName: input.firstName,
      lastName: input.lastName,
      dni: encryptNullable(input.dni),
      gender: input.gender ?? null,
      phone: input.phone ?? null,
      province: input.province ?? null,
      city: input.city ?? null,
      coverageId: input.coverageId ?? null,
      coverageMemberNumber: input.coverageMemberNumber ?? null,
      emergencyContactName: input.emergencyContactName ?? null,
      emergencyContactPhone: input.emergencyContactPhone ?? null,
      initialTopics: input.initialTopics ?? null,
      updatedAt: new Date(),
    })
    .where(eq(patientProfile.id, profileId))
    .returning()

  return {
    ...updated,
    dni: input.dni ?? null,
  }
}

// ==========================================
// Past Experience Schemas & Service (R-13)
// ==========================================

export const pastExperienceSchema = z.object({
  periodFrom: z.string().optional().nullable(),
  periodTo: z.string().optional().nullable(),
  reason: z.string().trim().min(3, 'El motivo es obligatorio.'),
  outcome: z.string().trim().optional().nullable(),
  professionalId: z.string().uuid().optional().nullable(),
  externalProfessionalName: z.string().trim().optional().nullable(),
  closingSummaryId: z.string().uuid().optional().nullable(),
})

export type PastExperienceInput = z.infer<typeof pastExperienceSchema>

export async function getPastExperiences(session: Session) {
  requireRoleIn(session, 'patient')
  const patientId = await getPatientProfileId(session.user.id)
  if (!patientId) throw new NotFoundError('Perfil no encontrado.')

  return db
    .select({
      id: pastExperience.id,
      patientId: pastExperience.patientId,
      periodFrom: pastExperience.periodFrom,
      periodTo: pastExperience.periodTo,
      reason: pastExperience.reason,
      outcome: pastExperience.outcome,
      professionalId: pastExperience.professionalId,
      externalProfessionalName: pastExperience.externalProfessionalName,
      closingSummaryId: pastExperience.closingSummaryId,
      professionalName: professionalProfile.displayName,
      createdAt: pastExperience.createdAt,
    })
    .from(pastExperience)
    .leftJoin(professionalProfile, eq(pastExperience.professionalId, professionalProfile.id))
    .where(eq(pastExperience.patientId, patientId))
    .orderBy(desc(pastExperience.createdAt))
}

export async function createPastExperience(session: Session, rawInput: PastExperienceInput) {
  requireRoleIn(session, 'patient')
  const input = pastExperienceSchema.parse(rawInput)
  const patientId = await getPatientProfileId(session.user.id)
  if (!patientId) throw new NotFoundError('Perfil no encontrado.')

  const [created] = await db
    .insert(pastExperience)
    .values({
      patientId,
      periodFrom: input.periodFrom ?? null,
      periodTo: input.periodTo ?? null,
      reason: input.reason,
      outcome: input.outcome ?? null,
      professionalId: input.professionalId ?? null,
      externalProfessionalName: input.externalProfessionalName ?? null,
      closingSummaryId: input.closingSummaryId ?? null,
    })
    .returning()

  return created
}

export async function deletePastExperience(session: Session, id: string) {
  requireRoleIn(session, 'patient')
  const patientId = await getPatientProfileId(session.user.id)
  if (!patientId) throw new NotFoundError('Perfil no encontrado.')

  const [deleted] = await db
    .delete(pastExperience)
    .where(and(eq(pastExperience.id, id), eq(pastExperience.patientId, patientId)))
    .returning()

  if (!deleted) throw new NotFoundError('No se encontró la experiencia previa.')
  return deleted
}
