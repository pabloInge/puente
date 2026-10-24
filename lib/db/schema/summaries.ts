import {
  boolean,
  date,
  index,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core'
import { clinicalEntry } from './clinical'
import { bond } from './connection'

export const closingSummaryStatusEnum = pgEnum('closing_summary_status', [
  'requested',
  'draft',
  'approved',
])
export const progressFormatEnum = pgEnum('progress_format', ['stages', 'percent', 'scale_10'])
export const progressVisibilityEnum = pgEnum('progress_visibility', [
  'patient_decides',
  'recommend_show',
  'recommend_hide',
  'blocked',
])

export const DEFAULT_PROGRESS_STAGES = [
  'Evaluación',
  'Inicio',
  'Desarrollo',
  'Consolidación',
  'Cierre',
] as const

export const weeklySummary = pgTable(
  'weekly_summary',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    bondId: uuid('bond_id')
      .notNull()
      .references(() => bond.id),
    weekStart: date('week_start').notNull(),
    data: jsonb('data').$type<Record<string, unknown>>().notNull().default({}),
    aiText: text('ai_text'),
    professionalAnnotation: text('professional_annotation'),
    sharedWithPatient: boolean('shared_with_patient').notNull().default(false),
    generatedAt: timestamp('generated_at', { withTimezone: true }).notNull().defaultNow(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex('weekly_summary_bond_week_key').on(t.bondId, t.weekStart)],
)

export const closingSummary = pgTable(
  'closing_summary',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    bondId: uuid('bond_id')
      .notNull()
      .references(() => bond.id),
    status: closingSummaryStatusEnum('status').notNull(),
    requestedByPatientAt: timestamp('requested_by_patient_at', { withTimezone: true }),
    content: text('content'),
    approvedAt: timestamp('approved_at', { withTimezone: true }),
    pdfUrl: text('pdf_url'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex('closing_summary_bond_id_key').on(t.bondId)],
)

export const progressSettings = pgTable('progress_settings', {
  bondId: uuid('bond_id')
    .primaryKey()
    .references(() => bond.id),
  format: progressFormatEnum('format').notNull().default('stages'),
  stages: jsonb('stages').$type<string[]>(),
  visibilityPolicy: progressVisibilityEnum('visibility_policy')
    .notNull()
    .default('patient_decides'),
  recommendationMessage: text('recommendation_message'),
  patientWantsToSee: boolean('patient_wants_to_see').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const progressUpdate = pgTable(
  'progress_update',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    bondId: uuid('bond_id')
      .notNull()
      .references(() => bond.id),
    format: progressFormatEnum('format').notNull(),
    value: numeric('value', { precision: 6, scale: 2 }).notNull(),
    note: text('note'),
    clinicalEntryId: uuid('clinical_entry_id').references(() => clinicalEntry.id),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('progress_update_bond_created_idx').on(t.bondId, t.createdAt)],
)
