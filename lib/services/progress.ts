import 'server-only'
import { asc, eq } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '@/lib/db'
import {
  DEFAULT_PROGRESS_STAGES,
  progressSettings,
  progressUpdate,
} from '@/lib/db/schema'
import { patientProgressView } from '@/lib/policies/progress'
import type { Session } from '@/lib/session'
import { requireRoleIn } from './_base'
import { requireBondAccess } from './bond-access'
import { ForbiddenError, NotFoundError } from './errors'

export const updateProgressSettingsSchema = z.object({
  format: z.enum(['stages', 'percent', 'scale_10']),
  stages: z.array(z.string()).optional(),
  visibilityPolicy: z.enum([
    'patient_decides',
    'recommend_show',
    'recommend_hide',
    'blocked',
  ]),
  recommendationMessage: z.string().optional().nullable(),
  patientWantsToSee: z.boolean().optional(),
})

export type UpdateProgressSettingsInput = z.infer<typeof updateProgressSettingsSchema>

export async function getProgress(session: Session, bondId: string) {
  const access = await requireBondAccess(session, bondId, 'read-historical')

  let [settings] = await db
    .select()
    .from(progressSettings)
    .where(eq(progressSettings.bondId, access.bond.id))
    .limit(1)

  if (!settings) {
    // Default settings
    settings = {
      bondId: access.bond.id,
      format: 'stages',
      stages: [...DEFAULT_PROGRESS_STAGES],
      visibilityPolicy: 'patient_decides',
      recommendationMessage: null,
      patientWantsToSee: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
  }

  const updates = await db
    .select()
    .from(progressUpdate)
    .where(eq(progressUpdate.bondId, access.bond.id))
    .orderBy(asc(progressUpdate.createdAt))

  // If patient, apply R-05 visibility policy
  if (access.party === 'patient') {
    const view = patientProgressView({
      visibilityPolicy: settings.visibilityPolicy,
      patientWantsToSee: settings.patientWantsToSee,
    })

    return {
      settings,
      view,
      updates: view.state === 'visible' ? updates : [],
    }
  }

  return {
    settings,
    view: { state: 'visible' as const, recommendation: null },
    updates,
  }
}

export async function updateProgressSettings(
  session: Session,
  bondId: string,
  rawInput: UpdateProgressSettingsInput,
) {
  const access = await requireBondAccess(session, bondId, 'read-historical')
  const input = updateProgressSettingsSchema.parse(rawInput)

  if (access.party === 'patient') {
    // Patient can only toggle `patientWantsToSee`
    if (input.patientWantsToSee !== undefined) {
      await db
        .insert(progressSettings)
        .values({
          bondId: access.bond.id,
          format: input.format,
          visibilityPolicy: input.visibilityPolicy,
          patientWantsToSee: input.patientWantsToSee,
        })
        .onConflictDoUpdate({
          target: progressSettings.bondId,
          set: {
            patientWantsToSee: input.patientWantsToSee,
            updatedAt: new Date(),
          },
        })
    }
    return
  }

  // Professional updates all settings
  requireRoleIn(session, 'professional')
  await db
    .insert(progressSettings)
    .values({
      bondId: access.bond.id,
      format: input.format,
      stages: input.stages ?? [...DEFAULT_PROGRESS_STAGES],
      visibilityPolicy: input.visibilityPolicy,
      recommendationMessage: input.recommendationMessage ?? null,
      patientWantsToSee: input.patientWantsToSee ?? false,
    })
    .onConflictDoUpdate({
      target: progressSettings.bondId,
      set: {
        format: input.format,
        stages: input.stages ?? [...DEFAULT_PROGRESS_STAGES],
        visibilityPolicy: input.visibilityPolicy,
        recommendationMessage: input.recommendationMessage ?? null,
        updatedAt: new Date(),
      },
    })
}

export const addProgressUpdateSchema = z.object({
  bondId: z.string().uuid(),
  value: z.number(),
  note: z.string().trim().optional().nullable(),
  clinicalEntryId: z.string().uuid().optional().nullable(),
})

export type AddProgressUpdateInput = z.infer<typeof addProgressUpdateSchema>

export async function addProgressUpdate(session: Session, rawInput: AddProgressUpdateInput) {
  requireRoleIn(session, 'professional')
  const input = addProgressUpdateSchema.parse(rawInput)

  const access = await requireBondAccess(session, input.bondId, 'write', { party: 'professional' })

  const [settings] = await db
    .select()
    .from(progressSettings)
    .where(eq(progressSettings.bondId, access.bond.id))
    .limit(1)

  const [created] = await db
    .insert(progressUpdate)
    .values({
      bondId: access.bond.id,
      format: settings?.format ?? 'stages',
      value: String(input.value),
      note: input.note ?? null,
      clinicalEntryId: input.clinicalEntryId ?? null,
    })
    .returning()

  return created
}
