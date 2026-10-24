import { sql } from 'drizzle-orm'
import {
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core'
import { consentVersion } from './catalog'
import { patientProfile, professionalProfile, user } from './identity'

export const bondStatusEnum = pgEnum('bond_status', [
  'requested',
  'awaiting_consent',
  'active',
  'rejected',
  'cancelled',
  'ended',
])
export const bondPartyEnum = pgEnum('bond_party', ['patient', 'professional'])
export const conversationStatusEnum = pgEnum('conversation_status', [
  'pre_bond',
  'bond',
  'closed',
  'blocked',
])
export const conversationClosedReasonEnum = pgEnum('conversation_closed_reason', [
  'professional',
  'inactivity',
  'bond_ended',
])

export const OPEN_BOND_STATUSES = ['requested', 'awaiting_consent', 'active'] as const

export const bond = pgTable(
  'bond',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    patientId: uuid('patient_id')
      .notNull()
      .references(() => patientProfile.id),
    professionalId: uuid('professional_id')
      .notNull()
      .references(() => professionalProfile.id),
    status: bondStatusEnum('status').notNull().default('requested'),
    requestMessage: text('request_message'),
    rejectionReason: text('rejection_reason'),
    endedBy: bondPartyEnum('ended_by'),
    endReason: text('end_reason'),
    requestedAt: timestamp('requested_at', { withTimezone: true }).notNull().defaultNow(),
    acceptedAt: timestamp('accepted_at', { withTimezone: true }),
    activatedAt: timestamp('activated_at', { withTimezone: true }),
    endedAt: timestamp('ended_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    // R-12: a patient has at most one open bond.
    uniqueIndex('bond_one_open_per_patient')
      .on(t.patientId)
      .where(sql`status IN ('requested', 'awaiting_consent', 'active')`),
    index('bond_professional_status_idx').on(t.professionalId, t.status),
  ],
)

export const consentAcceptance = pgTable(
  'consent_acceptance',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    bondId: uuid('bond_id')
      .notNull()
      .references(() => bond.id),
    consentVersionId: uuid('consent_version_id')
      .notNull()
      .references(() => consentVersion.id),
    acceptedAt: timestamp('accepted_at', { withTimezone: true }).notNull().defaultNow(),
    ip: text('ip'),
    userAgent: text('user_agent'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex('consent_acceptance_bond_id_key').on(t.bondId)],
)

export const conversation = pgTable(
  'conversation',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    patientId: uuid('patient_id')
      .notNull()
      .references(() => patientProfile.id),
    professionalId: uuid('professional_id')
      .notNull()
      .references(() => professionalProfile.id),
    bondId: uuid('bond_id').references(() => bond.id),
    status: conversationStatusEnum('status').notNull().default('pre_bond'),
    patientMessagesBeforeReply: integer('patient_messages_before_reply').notNull().default(0),
    closedReason: conversationClosedReasonEnum('closed_reason'),
    lastMessageAt: timestamp('last_message_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('conversation_patient_idx').on(t.patientId, t.status),
    index('conversation_professional_idx').on(t.professionalId, t.status),
  ],
)

export const message = pgTable(
  'message',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    conversationId: uuid('conversation_id')
      .notNull()
      .references(() => conversation.id),
    senderUserId: text('sender_user_id')
      .notNull()
      .references(() => user.id),
    body: text('body').notNull(),
    attachmentUrl: text('attachment_url'),
    readAt: timestamp('read_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('message_conversation_idx').on(t.conversationId, t.createdAt)],
)
