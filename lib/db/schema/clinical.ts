import {
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  type AnyPgColumn,
} from 'drizzle-orm/pg-core'
import { appointment } from './agenda'
import { clinicalEntryKindEnum, clinicalTemplate } from './catalog'
import { bond } from './connection'
import { professionalProfile } from './identity'

export type ClinicalSection = { title: string; body: string }

// Append-only: UPDATE and DELETE are rejected by a trigger (see migration SQL).
export const clinicalEntry = pgTable(
  'clinical_entry',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    bondId: uuid('bond_id')
      .notNull()
      .references(() => bond.id),
    authorProfessionalId: uuid('author_professional_id')
      .notNull()
      .references(() => professionalProfile.id),
    kind: clinicalEntryKindEnum('kind').notNull(),
    amendsEntryId: uuid('amends_entry_id').references((): AnyPgColumn => clinicalEntry.id),
    appointmentId: uuid('appointment_id').references(() => appointment.id),
    templateId: uuid('template_id').references(() => clinicalTemplate.id),
    content: jsonb('content').$type<ClinicalSection[]>().notNull(),
    contentHash: text('content_hash').notNull(),
    authorLicenseSnapshot: text('author_license_snapshot'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('clinical_entry_bond_created_idx').on(t.bondId, t.createdAt)],
)

// Immutable after submission: UPDATE and DELETE are rejected by a trigger.
export const intake = pgTable(
  'intake',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    bondId: uuid('bond_id')
      .notNull()
      .references(() => bond.id),
    needs: text('needs').notNull(),
    reasonToStart: text('reason_to_start').notNull(),
    submittedAt: timestamp('submitted_at', { withTimezone: true }).notNull().defaultNow(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex('intake_bond_id_key').on(t.bondId)],
)

export const clinicalRecordRequest = pgTable('clinical_record_request', {
  id: uuid('id').primaryKey().defaultRandom(),
  bondId: uuid('bond_id')
    .notNull()
    .references(() => bond.id),
  requestedAt: timestamp('requested_at', { withTimezone: true }).notNull().defaultNow(),
  dueAt: timestamp('due_at', { withTimezone: true }).notNull(),
  fulfilledAt: timestamp('fulfilled_at', { withTimezone: true }),
  exportUrl: text('export_url'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})
