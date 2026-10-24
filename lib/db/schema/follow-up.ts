import {
  date,
  index,
  pgEnum,
  pgTable,
  smallint,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core'
import { bond, message } from './connection'
import { patientProfile, user } from './identity'

export const journalKindEnum = pgEnum('journal_kind', ['conflict', 'need', 'other'])
export const indicationKindEnum = pgEnum('indication_kind', [
  'guideline',
  'exercise',
  'reading',
  'other',
])
export const indicationStatusEnum = pgEnum('indication_status', ['active', 'archived'])
export const resourceTypeEnum = pgEnum('resource_type', ['file', 'link'])

export const journalEntry = pgTable(
  'journal_entry',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    bondId: uuid('bond_id')
      .notNull()
      .references(() => bond.id),
    patientId: uuid('patient_id')
      .notNull()
      .references(() => patientProfile.id),
    kind: journalKindEnum('kind').notNull(),
    body: text('body').notNull(),
    mood: smallint('mood'),
    weekStart: date('week_start').notNull(),
    editableUntil: timestamp('editable_until', { withTimezone: true }).notNull(),
    readByProfessionalAt: timestamp('read_by_professional_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('journal_entry_bond_week_idx').on(t.bondId, t.weekStart)],
)

export const indication = pgTable(
  'indication',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    bondId: uuid('bond_id')
      .notNull()
      .references(() => bond.id),
    title: text('title').notNull(),
    description: text('description'),
    kind: indicationKindEnum('kind').notNull(),
    frequency: text('frequency'),
    validUntil: date('valid_until'),
    status: indicationStatusEnum('status').notNull().default('active'),
    patientSeenAt: timestamp('patient_seen_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('indication_bond_status_idx').on(t.bondId, t.status)],
)

export const indicationComment = pgTable('indication_comment', {
  id: uuid('id').primaryKey().defaultRandom(),
  indicationId: uuid('indication_id')
    .notNull()
    .references(() => indication.id),
  authorUserId: text('author_user_id')
    .notNull()
    .references(() => user.id),
  body: text('body').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const resource = pgTable('resource', {
  id: uuid('id').primaryKey().defaultRandom(),
  indicationId: uuid('indication_id').references(() => indication.id),
  messageId: uuid('message_id').references(() => message.id),
  type: resourceTypeEnum('type').notNull(),
  url: text('url').notNull(),
  name: text('name').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})
