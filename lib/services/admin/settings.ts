import 'server-only'
import { and, desc, eq, isNull } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '@/lib/db'
import {
  clinicalTemplate,
  consentVersion,
  platformSetting,
} from '@/lib/db/schema'
import type { Session } from '@/lib/session'
import { requireRoleIn } from '../_base'
import { NotFoundError } from '../errors'

// ==========================================
// Consent Versions (CU-G-03)
// ==========================================

export async function listConsentVersionsAdmin(session: Session) {
  requireRoleIn(session, 'admin')
  return db
    .select()
    .from(consentVersion)
    .orderBy(consentVersion.kind, desc(consentVersion.publishedAt))
}

export async function publishConsentVersion(
  session: Session,
  kind: 'informed_consent' | 'terms' | 'privacy',
  version: string,
  bodyMd: string,
) {
  requireRoleIn(session, 'admin')

  // 1. Mark previous active version for this kind as not current
  await db
    .update(consentVersion)
    .set({ isCurrent: false })
    .where(and(eq(consentVersion.kind, kind), eq(consentVersion.isCurrent, true)))

  // 2. Insert new current version
  const [created] = await db
    .insert(consentVersion)
    .values({
      kind,
      version,
      bodyMd,
      isCurrent: true,
      publishedAt: new Date(),
    })
    .returning()

  return created
}

// ==========================================
// Global Clinical Templates (CU-G-04)
// ==========================================

export const globalTemplateSchema = z.object({
  name: z.string().min(2),
  entryKind: z.enum(['starting_point', 'first_impressions', 'evolution', 'amendment']),
  sections: z.array(
    z.object({
      title: z.string().min(1),
      hint: z.string().optional(),
    }),
  ),
})

export type GlobalTemplateInput = z.infer<typeof globalTemplateSchema>

export async function listGlobalTemplatesAdmin(session: Session) {
  requireRoleIn(session, 'admin')
  return db
    .select()
    .from(clinicalTemplate)
    .where(isNull(clinicalTemplate.ownerProfessionalId))
    .orderBy(clinicalTemplate.entryKind, clinicalTemplate.name)
}

export async function createGlobalTemplate(session: Session, rawInput: GlobalTemplateInput) {
  requireRoleIn(session, 'admin')
  const input = globalTemplateSchema.parse(rawInput)

  const [created] = await db
    .insert(clinicalTemplate)
    .values({
      ownerProfessionalId: null,
      name: input.name,
      entryKind: input.entryKind,
      sections: input.sections,
    })
    .returning()

  return created
}

export async function updateGlobalTemplate(
  session: Session,
  id: string,
  rawInput: Partial<GlobalTemplateInput>,
) {
  requireRoleIn(session, 'admin')

  const [updated] = await db
    .update(clinicalTemplate)
    .set({
      ...rawInput,
      updatedAt: new Date(),
    })
    .where(and(eq(clinicalTemplate.id, id), isNull(clinicalTemplate.ownerProfessionalId)))
    .returning()

  if (!updated) throw new NotFoundError('Plantilla global no encontrada')
  return updated
}

export async function deleteGlobalTemplate(session: Session, id: string) {
  requireRoleIn(session, 'admin')
  await db
    .delete(clinicalTemplate)
    .where(and(eq(clinicalTemplate.id, id), isNull(clinicalTemplate.ownerProfessionalId)))
  return { ok: true }
}

// ==========================================
// Platform Settings (CU-G-05)
// ==========================================

export async function getPlatformSettingsAdmin(session: Session) {
  requireRoleIn(session, 'admin')
  const settings = await db.select().from(platformSetting)

  const map: Record<string, any> = {}
  for (const s of settings) {
    map[s.key] = s.value
  }

  // Provide defaults if not yet persisted in platformSetting
  return {
    advanceBookingHours: map['advance_booking_hours'] ?? 24, // P-05
    cancellationNoticeHours: map['cancellation_notice_hours'] ?? 24, // R-10
    journalEditWindowMinutes: map['journal_edit_window_minutes'] ?? 30, // R-07
    weeklyClosingDay: map['weekly_closing_day'] ?? 1, // Lunes
    naturalLanguageSearchEnabled: map['natural_language_search_enabled'] ?? true,
    ...map,
  }
}

export async function updatePlatformSetting(
  session: Session,
  key: string,
  value: any,
) {
  requireRoleIn(session, 'admin')

  const [updated] = await db
    .insert(platformSetting)
    .values({
      key,
      value,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: platformSetting.key,
      set: {
        value,
        updatedAt: new Date(),
      },
    })
    .returning()

  return updated
}
