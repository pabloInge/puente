import 'server-only'
import { and, desc, eq, isNull, sql } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '@/lib/db'
import { journalEntry, patientProfile } from '@/lib/db/schema'
import {
  canEditJournalEntry,
  journalEditableUntil,
  weekStartOf,
} from '@/lib/policies/journal'
import type { Session } from '@/lib/session'
import { requireRoleIn } from './_base'
import {
  getOpenBondForPatient,
  getPatientProfileId,
  requireBondAccess,
} from './bond-access'
import {
  ForbiddenError,
  InvalidInputError,
  NotFoundError,
  RuleViolationError,
} from './errors'

export const createJournalEntrySchema = z.object({
  kind: z.enum(['conflict', 'need', 'other']),
  body: z.string().trim().min(3, 'El texto debe tener al menos 3 caracteres.').max(5000),
  mood: z.number().int().min(1).max(5).optional().nullable(),
})

export type CreateJournalEntryInput = z.infer<typeof createJournalEntrySchema>

export async function listJournalEntriesForPatient(session: Session) {
  requireRoleIn(session, 'patient')
  const patientId = await getPatientProfileId(session.user.id)
  if (!patientId) throw new NotFoundError('Perfil no encontrado.')

  const openBond = await getOpenBondForPatient(session)
  if (!openBond) return { entries: [], hasBond: false }

  const entries = await db
    .select()
    .from(journalEntry)
    .where(and(eq(journalEntry.patientId, patientId), eq(journalEntry.bondId, openBond.id)))
    .orderBy(desc(journalEntry.createdAt))

  const now = new Date()

  return {
    hasBond: true,
    entries: entries.map((e) => ({
      ...e,
      canEdit: canEditJournalEntry(e.editableUntil, now).ok,
    })),
  }
}

export async function createJournalEntry(session: Session, rawInput: CreateJournalEntryInput) {
  requireRoleIn(session, 'patient')
  const input = createJournalEntrySchema.parse(rawInput)

  const patientId = await getPatientProfileId(session.user.id)
  if (!patientId) throw new NotFoundError('Perfil no encontrado.')

  const openBond = await getOpenBondForPatient(session)
  if (!openBond || openBond.status !== 'active') {
    throw new RuleViolationError('R-12', 'Para escribir en el diario tenés que tener un vínculo activo.')
  }

  const now = new Date()
  const weekStart = weekStartOf(now)
  const editableUntil = journalEditableUntil(now)

  const [created] = await db
    .insert(journalEntry)
    .values({
      bondId: openBond.id,
      patientId,
      kind: input.kind,
      body: input.body,
      mood: input.mood ?? null,
      weekStart,
      editableUntil,
    })
    .returning()

  return created
}

export async function updateJournalEntry(
  session: Session,
  entryId: string,
  body: string,
  mood?: number | null,
) {
  requireRoleIn(session, 'patient')
  const patientId = await getPatientProfileId(session.user.id)
  if (!patientId) throw new NotFoundError('Perfil no encontrado.')

  const [entry] = await db
    .select()
    .from(journalEntry)
    .where(and(eq(journalEntry.id, entryId), eq(journalEntry.patientId, patientId)))
    .limit(1)

  if (!entry) throw new NotFoundError('Entrada no encontrada.')

  // R-07 edit window check
  const allowed = canEditJournalEntry(entry.editableUntil, new Date())
  if (!allowed.ok) {
    throw new RuleViolationError(allowed.rule, allowed.message)
  }

  const [updated] = await db
    .update(journalEntry)
    .set({
      body: body.trim(),
      mood: mood !== undefined ? mood : entry.mood,
      updatedAt: new Date(),
    })
    .where(eq(journalEntry.id, entryId))
    .returning()

  return updated
}

export async function listJournalEntriesForProfessional(session: Session, bondId: string) {
  requireRoleIn(session, 'professional')
  const access = await requireBondAccess(session, bondId, 'read-historical', { party: 'professional' })

  // Mark unread entries as read by professional
  await db
    .update(journalEntry)
    .set({ readByProfessionalAt: new Date(), updatedAt: new Date() })
    .where(and(eq(journalEntry.bondId, access.bond.id), isNull(journalEntry.readByProfessionalAt)))

  const entries = await db
    .select()
    .from(journalEntry)
    .where(eq(journalEntry.bondId, access.bond.id))
    .orderBy(desc(journalEntry.createdAt))

  return entries
}
