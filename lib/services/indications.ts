import 'server-only'
import { and, desc, eq, inArray } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '@/lib/db'
import {
  indication,
  indicationComment,
  resource,
  user,
} from '@/lib/db/schema'
import type { Session } from '@/lib/session'
import { requireRoleIn } from './_base'
import { requireBondAccess } from './bond-access'
import { ForbiddenError, NotFoundError } from './errors'

export const createIndicationSchema = z.object({
  bondId: z.string().uuid(),
  title: z.string().trim().min(2, 'El título es obligatorio.'),
  description: z.string().trim().optional().nullable(),
  kind: z.enum(['guideline', 'exercise', 'reading', 'other']).default('guideline'),
  frequency: z.string().trim().optional().nullable(),
  validUntil: z.string().optional().nullable(),
  resources: z
    .array(
      z.object({
        name: z.string().trim().min(1),
        url: z.string().url(),
        type: z.enum(['file', 'link']),
      }),
    )
    .default([]),
})

export type CreateIndicationInput = z.infer<typeof createIndicationSchema>

export async function listIndications(session: Session, bondId: string) {
  const access = await requireBondAccess(session, bondId, 'read-historical')

  // If patient, mark unseen indications as seen
  if (access.party === 'patient') {
    await db
      .update(indication)
      .set({ patientSeenAt: new Date(), updatedAt: new Date() })
      .where(and(eq(indication.bondId, access.bond.id), eq(indication.status, 'active')))
  }

  const list = await db
    .select()
    .from(indication)
    .where(eq(indication.bondId, access.bond.id))
    .orderBy(desc(indication.createdAt))

  const indIds = list.map((i) => i.id)
  if (indIds.length === 0) return []

  const comments = await db
    .select({
      id: indicationComment.id,
      indicationId: indicationComment.indicationId,
      authorUserId: indicationComment.authorUserId,
      authorName: user.name,
      body: indicationComment.body,
      createdAt: indicationComment.createdAt,
    })
    .from(indicationComment)
    .innerJoin(user, eq(indicationComment.authorUserId, user.id))
    .where(inArray(indicationComment.indicationId, indIds))
    .orderBy(desc(indicationComment.createdAt))

  const resources = await db
    .select()
    .from(resource)
    .where(inArray(resource.indicationId, indIds))

  const commentsByInd = new Map<string, typeof comments>()
  for (const c of comments) {
    const arr = commentsByInd.get(c.indicationId) ?? []
    arr.push(c)
    commentsByInd.set(c.indicationId, arr)
  }

  const resourcesByInd = new Map<string, typeof resources>()
  for (const r of resources) {
    if (!r.indicationId) continue
    const arr = resourcesByInd.get(r.indicationId) ?? []
    arr.push(r)
    resourcesByInd.set(r.indicationId, arr)
  }

  return list.map((ind) => ({
    ...ind,
    comments: commentsByInd.get(ind.id) ?? [],
    resources: resourcesByInd.get(ind.id) ?? [],
  }))
}

export async function createIndication(session: Session, rawInput: CreateIndicationInput) {
  requireRoleIn(session, 'professional')
  const input = createIndicationSchema.parse(rawInput)

  const access = await requireBondAccess(session, input.bondId, 'write', { party: 'professional' })

  const [created] = await db
    .insert(indication)
    .values({
      bondId: access.bond.id,
      title: input.title,
      description: input.description ?? null,
      kind: input.kind,
      frequency: input.frequency ?? null,
      validUntil: input.validUntil ?? null,
      status: 'active',
    })
    .returning()

  if (input.resources.length > 0) {
    await db.insert(resource).values(
      input.resources.map((r) => ({
        indicationId: created.id,
        name: r.name,
        url: r.url,
        type: r.type,
      })),
    )
  }

  return created
}

export async function archiveIndication(session: Session, indicationId: string) {
  requireRoleIn(session, 'professional')

  const [ind] = await db
    .select()
    .from(indication)
    .where(eq(indication.id, indicationId))
    .limit(1)

  if (!ind) throw new NotFoundError('Indicación no encontrada.')

  await requireBondAccess(session, ind.bondId, 'write', { party: 'professional' })

  const [updated] = await db
    .update(indication)
    .set({ status: 'archived', updatedAt: new Date() })
    .where(eq(indication.id, indicationId))
    .returning()

  return updated
}

export async function commentIndication(session: Session, indicationId: string, body: string) {
  const [ind] = await db
    .select()
    .from(indication)
    .where(eq(indication.id, indicationId))
    .limit(1)

  if (!ind) throw new NotFoundError('Indicación no encontrada.')

  await requireBondAccess(session, ind.bondId, 'read-historical')

  const [comment] = await db
    .insert(indicationComment)
    .values({
      indicationId,
      authorUserId: session.user.id,
      body: body.trim(),
    })
    .returning()

  return comment
}
