import 'server-only'
import { and, desc, eq } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '@/lib/db'
import {
  appointment,
  bond,
  clinicalEntry,
  closingSummary,
  conversation,
  indication,
  indicationComment,
  intake,
  journalEntry,
  message,
  pastExperience,
  patientProfile,
  progressUpdate,
  weeklySummary,
} from '@/lib/db/schema'
import { summaryWriter } from '@/lib/summaries'
import { aggregateWeeklyData } from '@/lib/summaries/aggregate'
import type {
  ClosingSummaryInput,
  HistoricSummaryInput,
  ProgressPoint,
  WeeklyAggregate,
} from '@/lib/summaries/types'
import type { Session } from '@/lib/session'
import { requireRoleIn } from './_base'
import { requireBondAccess } from './bond-access'
import { ForbiddenError, NotFoundError, RuleViolationError } from './errors'

// ==========================================
// Weekly Summaries (E-01)
// ==========================================

export async function listWeeklySummaries(session: Session, bondId: string) {
  const access = await requireBondAccess(session, bondId, 'read-historical')

  const list = await db
    .select()
    .from(weeklySummary)
    .where(eq(weeklySummary.bondId, access.bond.id))
    .orderBy(desc(weeklySummary.weekStart))

  // If patient, only return summaries shared by the professional
  if (access.party === 'patient') {
    return list.filter((s) => s.sharedWithPatient)
  }

  return list
}

export async function generateWeeklySummary(bondId: string, weekStart: string) {
  // Idempotency: check if summary for this week already exists
  const [existing] = await db
    .select()
    .from(weeklySummary)
    .where(and(eq(weeklySummary.bondId, bondId), eq(weeklySummary.weekStart, weekStart)))
    .limit(1)

  if (existing) return existing

  // Fetch week's journal entries
  const jEntries = await db
    .select({ kind: journalEntry.kind, mood: journalEntry.mood })
    .from(journalEntry)
    .where(and(eq(journalEntry.bondId, bondId), eq(journalEntry.weekStart, weekStart)))

  // Fetch indications
  const indList = await db
    .select({
      id: indication.id,
      patientSeenAt: indication.patientSeenAt,
    })
    .from(indication)
    .where(eq(indication.bondId, bondId))

  const indComments = await db.select().from(indicationComment)
  const commentedIndIds = new Set(indComments.map((c) => c.indicationId))

  const mappedIndications = indList.map((i) => ({
    seen: Boolean(i.patientSeenAt),
    commented: commentedIndIds.has(i.id),
  }))

  // Fetch appointments
  const aptList = await db
    .select({ status: appointment.status })
    .from(appointment)
    .where(eq(appointment.bondId, bondId))

  // Fetch messages
  const [b] = await db.select().from(bond).where(eq(bond.id, bondId)).limit(1)
  const [pat] = b
    ? await db.select().from(patientProfile).where(eq(patientProfile.id, b.patientId)).limit(1)
    : [null]

  let msgs: { isPatient: boolean }[] = []
  if (pat) {
    const rawMsgs = await db.select().from(message)
    msgs = rawMsgs.map((m) => ({ isPatient: m.senderUserId === pat.userId }))
  }

  const aggregate = aggregateWeeklyData({
    weekStart,
    journalEntries: jEntries,
    indications: mappedIndications,
    appointments: aptList,
    messages: msgs,
  })

  // Write AI draft (mock)
  const aiText = await summaryWriter.writeWeekly(aggregate)

  const [created] = await db
    .insert(weeklySummary)
    .values({
      bondId,
      weekStart,
      data: aggregate as any,
      aiText,
      sharedWithPatient: false,
    })
    .returning()

  return created
}

export async function annotateWeeklySummary(
  session: Session,
  summaryId: string,
  annotation: string,
  shareWithPatient: boolean,
) {
  requireRoleIn(session, 'professional')

  const [sum] = await db
    .select()
    .from(weeklySummary)
    .where(eq(weeklySummary.id, summaryId))
    .limit(1)

  if (!sum) throw new NotFoundError('Resumen no encontrado.')

  await requireBondAccess(session, sum.bondId, 'write', { party: 'professional' })

  const [updated] = await db
    .update(weeklySummary)
    .set({
      professionalAnnotation: annotation,
      sharedWithPatient: shareWithPatient,
      updatedAt: new Date(),
    })
    .where(eq(weeklySummary.id, summaryId))
    .returning()

  return updated
}

// ==========================================
// Historic Summary (E-02)
// ==========================================

export async function getHistoricSummaryData(session: Session, bondId: string) {
  const access = await requireBondAccess(session, bondId, 'read-historical')

  // 1. Starting point
  const [startEntry] = await db
    .select()
    .from(clinicalEntry)
    .where(
      and(
        eq(clinicalEntry.bondId, access.bond.id),
        eq(clinicalEntry.kind, 'starting_point'),
      ),
    )
    .limit(1)

  const [intakeRec] = await db
    .select()
    .from(intake)
    .where(eq(intake.bondId, access.bond.id))
    .limit(1)

  const startingPoint = startEntry
    ? typeof startEntry.content === 'string'
      ? (startEntry.content as string)
      : Array.isArray(startEntry.content)
        ? (startEntry.content as any[]).map((s: any) => `${s.title}: ${s.body}`).join('\n')
        : null
    : intakeRec?.reasonToStart ?? null

  // 2. Weekly aggregates
  const weeklyList = await db
    .select()
    .from(weeklySummary)
    .where(eq(weeklySummary.bondId, access.bond.id))
    .orderBy(desc(weeklySummary.weekStart))

  const weeks: WeeklyAggregate[] = weeklyList.map((w) => w.data as WeeklyAggregate)

  // 3. Progress points
  const pUpdates = await db
    .select()
    .from(progressUpdate)
    .where(eq(progressUpdate.bondId, access.bond.id))
    .orderBy(progressUpdate.createdAt)

  const progress: ProgressPoint[] = pUpdates.map((p) => ({
    at: p.createdAt.toISOString().slice(0, 10),
    label: p.note ?? `Etapa ${p.value}`,
    value: parseFloat(p.value) || null,
  }))

  return {
    bond: access.bond,
    startingPoint,
    weeks,
    progress,
    weeklyList,
  }
}

export async function generateHistoricDraft(session: Session, bondId: string) {
  requireRoleIn(session, 'professional')
  const data = await getHistoricSummaryData(session, bondId)

  const input: HistoricSummaryInput = {
    weeks: data.weeks,
    startingPoint: data.startingPoint,
    progress: data.progress,
  }

  const draft = await summaryWriter.writeHistoric(input)
  return draft
}

// ==========================================
// Closing Summary (E-04)
// ==========================================

export async function requestClosingSummary(session: Session, bondId: string) {
  const access = await requireBondAccess(session, bondId, 'read-historical')

  const [existing] = await db
    .select()
    .from(closingSummary)
    .where(eq(closingSummary.bondId, access.bond.id))
    .limit(1)

  if (existing) return existing

  const [created] = await db
    .insert(closingSummary)
    .values({
      bondId: access.bond.id,
      status: 'requested',
      requestedByPatientAt: new Date(),
    })
    .returning()

  return created
}

export async function getClosingSummary(session: Session, bondId: string) {
  const access = await requireBondAccess(session, bondId, 'read-historical')

  const [summary] = await db
    .select()
    .from(closingSummary)
    .where(eq(closingSummary.bondId, access.bond.id))
    .limit(1)

  return summary ?? null
}

export async function generateClosingDraft(session: Session, bondId: string) {
  requireRoleIn(session, 'professional')
  const data = await getHistoricSummaryData(session, bondId)

  const closingInput: ClosingSummaryInput = {
    weeks: data.weeks,
    startingPoint: data.startingPoint,
    progress: data.progress,
    reasonToStart: data.startingPoint,
    startedAt: data.bond.createdAt ? data.bond.createdAt.toISOString().slice(0, 10) : null,
    endedAt: data.bond.endedAt ? data.bond.endedAt.toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
  }

  const draft = await summaryWriter.writeClosing(closingInput)
  return draft
}

export async function saveClosingDraft(session: Session, bondId: string, content: string) {
  requireRoleIn(session, 'professional')
  const access = await requireBondAccess(session, bondId, 'write', { party: 'professional' })

  const [existing] = await db
    .select()
    .from(closingSummary)
    .where(eq(closingSummary.bondId, access.bond.id))
    .limit(1)

  if (existing && existing.status === 'approved') {
    throw new RuleViolationError('R-04', 'El resumen de cierre ya fue aprobado y es inmutable.')
  }

  if (existing) {
    const [updated] = await db
      .update(closingSummary)
      .set({
        status: existing.status === 'requested' ? 'requested' : 'draft',
        content,
        updatedAt: new Date(),
      })
      .where(eq(closingSummary.id, existing.id))
      .returning()
    return updated
  } else {
    const [created] = await db
      .insert(closingSummary)
      .values({
        bondId: access.bond.id,
        status: 'draft',
        content,
      })
      .returning()
    return created
  }
}

export async function approveClosingSummary(
  session: Session,
  bondId: string,
  content: string,
) {
  requireRoleIn(session, 'professional')
  const access = await requireBondAccess(session, bondId, 'write', { party: 'professional' })

  const [existing] = await db
    .select()
    .from(closingSummary)
    .where(eq(closingSummary.bondId, access.bond.id))
    .limit(1)

  const now = new Date()

  if (existing) {
    if (existing.status === 'approved') {
      throw new RuleViolationError('R-04', 'El resumen de cierre ya fue aprobado y es inmutable.')
    }

    const [updated] = await db
      .update(closingSummary)
      .set({
        status: 'approved',
        content,
        approvedAt: now,
        updatedAt: now,
      })
      .where(eq(closingSummary.id, existing.id))
      .returning()

    return updated
  } else {
    const [created] = await db
      .insert(closingSummary)
      .values({
        bondId: access.bond.id,
        status: 'approved',
        content,
        approvedAt: now,
      })
      .returning()

    return created
  }
}

export async function attachClosingSummaryToPastExperience(
  session: Session,
  bondId: string,
  summaryId: string,
) {
  const access = await requireBondAccess(session, bondId, 'read-historical')
  if (access.party !== 'patient') {
    throw new ForbiddenError('Solo el paciente puede agregar el resumen a sus antecedentes.')
  }

  const [summary] = await db
    .select()
    .from(closingSummary)
    .where(eq(closingSummary.id, summaryId))
    .limit(1)

  if (!summary || summary.status !== 'approved') {
    throw new NotFoundError('Resumen de cierre aprobado no encontrado.')
  }

  const [patProfile] = await db
    .select()
    .from(patientProfile)
    .where(eq(patientProfile.userId, session.user.id))
    .limit(1)

  if (!patProfile) throw new NotFoundError('Perfil de paciente no encontrado.')

  const [exp] = await db
    .insert(pastExperience)
    .values({
      patientId: patProfile.id,
      professionalId: access.bond.professionalId,
      periodFrom: access.bond.createdAt.toISOString().slice(0, 10),
      periodTo: access.bond.endedAt
        ? access.bond.endedAt.toISOString().slice(0, 10)
        : new Date().toISOString().slice(0, 10),
      reason: 'Tratamiento completado / finalizado',
      outcome: summary.content?.slice(0, 500) ?? 'Resumen de cierre disponible',
      closingSummaryId: summary.id,
    })
    .returning()

  return exp
}
