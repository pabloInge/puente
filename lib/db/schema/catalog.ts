import {
  boolean,
  date,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  type AnyPgColumn,
} from 'drizzle-orm/pg-core'
import { professionalProfile } from './identity'

export const coverageTypeEnum = pgEnum('coverage_type', [
  'public_program',
  'obra_social',
  'prepaga',
  'other',
])
export const discountTypeEnum = pgEnum('discount_type', ['percent', 'fixed', 'full'])
export const consentKindEnum = pgEnum('consent_kind', ['informed_consent', 'terms', 'privacy'])
export const clinicalEntryKindEnum = pgEnum('clinical_entry_kind', [
  'starting_point',
  'first_impressions',
  'evolution',
  'amendment',
])

export type TemplateSection = { title: string; hint?: string }

export const branch = pgTable(
  'branch',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    slug: text('slug').notNull(),
    name: text('name').notNull(),
    description: text('description'),
    parentId: uuid('parent_id').references((): AnyPgColumn => branch.id),
    sort: integer('sort').notNull().default(0),
    active: boolean('active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex('branch_slug_key').on(t.slug)],
)

export const coverage = pgTable('coverage', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  type: coverageTypeEnum('type').notNull(),
  jurisdiction: text('jurisdiction').notNull().default('nacional'),
  externalCode: text('external_code'),
  active: boolean('active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const benefit = pgTable('benefit', {
  id: uuid('id').primaryKey().defaultRandom(),
  coverageId: uuid('coverage_id')
    .notNull()
    .references(() => coverage.id),
  description: text('description').notNull(),
  discountType: discountTypeEnum('discount_type').notNull(),
  value: numeric('value', { precision: 12, scale: 2 }),
  validFrom: date('valid_from'),
  validTo: date('valid_to'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const consentVersion = pgTable(
  'consent_version',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    kind: consentKindEnum('kind').notNull(),
    version: text('version').notNull(),
    bodyMd: text('body_md').notNull(),
    publishedAt: timestamp('published_at', { withTimezone: true }),
    isCurrent: boolean('is_current').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex('consent_version_kind_version_key').on(t.kind, t.version)],
)

export const clinicalTemplate = pgTable('clinical_template', {
  id: uuid('id').primaryKey().defaultRandom(),
  ownerProfessionalId: uuid('owner_professional_id').references(() => professionalProfile.id),
  name: text('name').notNull(),
  entryKind: clinicalEntryKindEnum('entry_kind').notNull(),
  sections: jsonb('sections').$type<TemplateSection[]>().notNull().default([]),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const platformSetting = pgTable('platform_setting', {
  key: text('key').primaryKey(),
  value: jsonb('value').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const professionalBranch = pgTable(
  'professional_branch',
  {
    professionalId: uuid('professional_id')
      .notNull()
      .references(() => professionalProfile.id),
    branchId: uuid('branch_id')
      .notNull()
      .references(() => branch.id),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.professionalId, t.branchId] })],
)

export const professionalCoverage = pgTable(
  'professional_coverage',
  {
    professionalId: uuid('professional_id')
      .notNull()
      .references(() => professionalProfile.id),
    coverageId: uuid('coverage_id')
      .notNull()
      .references(() => coverage.id),
    notes: text('notes'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.professionalId, t.coverageId] })],
)
