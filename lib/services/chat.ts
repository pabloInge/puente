import 'server-only'
import { and, asc, desc, eq, inArray, sql } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '@/lib/db'
import {
  conversation,
  message,
  patientProfile,
  professionalProfile,
  user,
} from '@/lib/db/schema'
import {
  canPatientSendMessage,
  canStartPreBondConversation,
} from '@/lib/policies/chat'
import type { Session } from '@/lib/session'
import { requireRoleIn } from './_base'
import { getPatientProfileId, getProfessionalProfileId } from './bond-access'
import { ForbiddenError, NotFoundError } from './errors'

export const sendMessageSchema = z.object({
  conversationId: z.string().uuid(),
  body: z.string().trim().min(1, 'El mensaje no puede estar vacío.').max(4000),
  attachmentUrl: z.string().url().optional().nullable(),
})

export type SendMessageInput = z.infer<typeof sendMessageSchema>

export async function startPreBondConversation(session: Session, professionalId: string) {
  requireRoleIn(session, 'patient')
  const patientId = await getPatientProfileId(session.user.id)
  if (!patientId) throw new NotFoundError('Perfil de paciente no encontrado.')

  // Check if conversation already exists
  const [existing] = await db
    .select()
    .from(conversation)
    .where(
      and(
        eq(conversation.patientId, patientId),
        eq(conversation.professionalId, professionalId),
      ),
    )
    .limit(1)

  if (existing) {
    if (existing.status === 'blocked') {
      throw new ForbiddenError('Esta conversación fue bloqueada.', 'R-09')
    }
    return existing
  }

  // Count open pre-bond conversations (R-09)
  const openConversations = await db
    .select({ count: sql<number>`count(*)` })
    .from(conversation)
    .where(
      and(
        eq(conversation.patientId, patientId),
        eq(conversation.status, 'pre_bond'),
      ),
    )

  const count = Number(openConversations[0]?.count ?? 0)
  const allowed = canStartPreBondConversation(count)
  if (!allowed.ok) {
    throw new ForbiddenError(allowed.message, allowed.rule)
  }

  const [created] = await db
    .insert(conversation)
    .values({
      patientId,
      professionalId,
      status: 'pre_bond',
      patientMessagesBeforeReply: 0,
      lastMessageAt: new Date(),
    })
    .returning()

  return created
}

export async function listConversations(session: Session) {
  const role = session.user.role
  if (role !== 'patient' && role !== 'professional') {
    throw new ForbiddenError('Acceso denegado.')
  }

  const patientId = role === 'patient' ? await getPatientProfileId(session.user.id) : null
  const professionalId = role === 'professional' ? await getProfessionalProfileId(session.user.id) : null

  if (role === 'patient' && !patientId) throw new NotFoundError('Perfil no encontrado.')
  if (role === 'professional' && !professionalId) throw new NotFoundError('Perfil no encontrado.')

  const filter =
    role === 'patient'
      ? eq(conversation.patientId, patientId!)
      : eq(conversation.professionalId, professionalId!)

  const convList = await db
    .select({
      id: conversation.id,
      patientId: conversation.patientId,
      professionalId: conversation.professionalId,
      status: conversation.status,
      closedReason: conversation.closedReason,
      lastMessageAt: conversation.lastMessageAt,
      createdAt: conversation.createdAt,
      patientFirstName: patientProfile.firstName,
      patientLastName: patientProfile.lastName,
      professionalName: professionalProfile.displayName,
      professionalPhotoUrl: professionalProfile.photoUrl,
    })
    .from(conversation)
    .innerJoin(patientProfile, eq(conversation.patientId, patientProfile.id))
    .innerJoin(professionalProfile, eq(conversation.professionalId, professionalProfile.id))
    .where(filter)
    .orderBy(desc(conversation.lastMessageAt))

  // Find last message and unread count for each conversation
  const convIds = convList.map((c) => c.id)
  if (convIds.length === 0) return []

  const messages = await db
    .select()
    .from(message)
    .where(inArray(message.conversationId, convIds))
    .orderBy(desc(message.createdAt))

  const messagesByConv = new Map<string, typeof message.$inferSelect[]>()
  for (const m of messages) {
    const list = messagesByConv.get(m.conversationId) ?? []
    list.push(m)
    messagesByConv.set(m.conversationId, list)
  }

  return convList.map((c) => {
    const convMsgs = messagesByConv.get(c.id) ?? []
    const lastMsg = convMsgs[0] ?? null
    const unreadCount = convMsgs.filter(
      (m) => m.senderUserId !== session.user.id && !m.readAt,
    ).length

    return {
      ...c,
      lastMessage: lastMsg ? { body: lastMsg.body, createdAt: lastMsg.createdAt } : null,
      unreadCount,
    }
  })
}

export async function getConversation(session: Session, conversationId: string) {
  const [conv] = await db
    .select({
      id: conversation.id,
      patientId: conversation.patientId,
      professionalId: conversation.professionalId,
      bondId: conversation.bondId,
      status: conversation.status,
      patientMessagesBeforeReply: conversation.patientMessagesBeforeReply,
      closedReason: conversation.closedReason,
      patientFirstName: patientProfile.firstName,
      patientLastName: patientProfile.lastName,
      patientUserId: patientProfile.userId,
      professionalName: professionalProfile.displayName,
      professionalUserId: professionalProfile.userId,
      professionalPhotoUrl: professionalProfile.photoUrl,
    })
    .from(conversation)
    .innerJoin(patientProfile, eq(conversation.patientId, patientProfile.id))
    .innerJoin(professionalProfile, eq(conversation.professionalId, professionalProfile.id))
    .where(eq(conversation.id, conversationId))
    .limit(1)

  if (!conv) throw new NotFoundError('Conversación no encontrada.')

  // Check authorization
  if (session.user.id !== conv.patientUserId && session.user.id !== conv.professionalUserId) {
    throw new ForbiddenError('No tenés acceso a esta conversación.')
  }

  // Mark other's messages as read
  await db
    .update(message)
    .set({ readAt: new Date() })
    .where(
      and(
        eq(message.conversationId, conversationId),
        sql`${message.senderUserId} != ${session.user.id}`,
        sql`${message.readAt} IS NULL`,
      ),
    )

  const msgList = await db
    .select()
    .from(message)
    .where(eq(message.conversationId, conversationId))
    .orderBy(asc(message.createdAt))

  return {
    conversation: conv,
    messages: msgList,
  }
}

export async function sendMessage(session: Session, rawInput: SendMessageInput) {
  const input = sendMessageSchema.parse(rawInput)

  const [conv] = await db
    .select({
      id: conversation.id,
      patientId: conversation.patientId,
      professionalId: conversation.professionalId,
      status: conversation.status,
      patientMessagesBeforeReply: conversation.patientMessagesBeforeReply,
      patientUserId: patientProfile.userId,
      professionalUserId: professionalProfile.userId,
    })
    .from(conversation)
    .innerJoin(patientProfile, eq(conversation.patientId, patientProfile.id))
    .innerJoin(professionalProfile, eq(conversation.professionalId, professionalProfile.id))
    .where(eq(conversation.id, input.conversationId))
    .limit(1)

  if (!conv) throw new NotFoundError('Conversación no encontrada.')

  const isPatient = session.user.id === conv.patientUserId
  const isProfessional = session.user.id === conv.professionalUserId

  if (!isPatient && !isProfessional) {
    throw new ForbiddenError('No tenés acceso a esta conversación.')
  }

  if (isPatient) {
    // Check if professional has ever replied in this conversation
    const [proReply] = await db
      .select({ id: message.id })
      .from(message)
      .where(
        and(
          eq(message.conversationId, input.conversationId),
          eq(message.senderUserId, conv.professionalUserId),
        ),
      )
      .limit(1)

    const allowed = canPatientSendMessage({
      status: conv.status,
      patientMessagesBeforeReply: conv.patientMessagesBeforeReply,
      professionalHasReplied: Boolean(proReply),
    })

    if (!allowed.ok) {
      throw new ForbiddenError(allowed.message, allowed.rule)
    }

    const [created] = await db
      .insert(message)
      .values({
        conversationId: input.conversationId,
        senderUserId: session.user.id,
        body: input.body,
        attachmentUrl: input.attachmentUrl ?? null,
      })
      .returning()

    await db
      .update(conversation)
      .set({
        patientMessagesBeforeReply: conv.patientMessagesBeforeReply + 1,
        lastMessageAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(conversation.id, input.conversationId))

    return created
  } else {
    // Professional sends message
    if (conv.status === 'blocked' || conv.status === 'closed') {
      throw new ForbiddenError('La conversación está cerrada o bloqueada.')
    }

    const [created] = await db
      .insert(message)
      .values({
        conversationId: input.conversationId,
        senderUserId: session.user.id,
        body: input.body,
        attachmentUrl: input.attachmentUrl ?? null,
      })
      .returning()

    await db
      .update(conversation)
      .set({
        patientMessagesBeforeReply: 0,
        lastMessageAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(conversation.id, input.conversationId))

    return created
  }
}

export async function closeConversation(session: Session, conversationId: string) {
  requireRoleIn(session, 'professional')
  const profId = await getProfessionalProfileId(session.user.id)
  if (!profId) throw new NotFoundError('Perfil no encontrado.')

  const [conv] = await db
    .select()
    .from(conversation)
    .where(and(eq(conversation.id, conversationId), eq(conversation.professionalId, profId)))
    .limit(1)

  if (!conv) throw new NotFoundError('Conversación no encontrada.')

  const [updated] = await db
    .update(conversation)
    .set({
      status: 'closed',
      closedReason: 'professional',
      updatedAt: new Date(),
    })
    .where(eq(conversation.id, conversationId))
    .returning()

  return updated
}

export async function blockConversation(session: Session, conversationId: string) {
  requireRoleIn(session, 'professional')
  const profId = await getProfessionalProfileId(session.user.id)
  if (!profId) throw new NotFoundError('Perfil no encontrado.')

  const [conv] = await db
    .select()
    .from(conversation)
    .where(and(eq(conversation.id, conversationId), eq(conversation.professionalId, profId)))
    .limit(1)

  if (!conv) throw new NotFoundError('Conversación no encontrada.')

  const [updated] = await db
    .update(conversation)
    .set({
      status: 'blocked',
      updatedAt: new Date(),
    })
    .where(eq(conversation.id, conversationId))
    .returning()

  return updated
}
