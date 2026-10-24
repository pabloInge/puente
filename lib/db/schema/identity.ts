import {
  boolean,
  date,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core'
import { modalityEnum } from './enums'

// Better Auth tables keep its camelCase column names; do not rename them.

export const userRoleEnum = pgEnum('user_role', ['patient', 'professional', 'admin'])
export const userStatusEnum = pgEnum('user_status', ['active', 'suspended'])

export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('emailVerified').notNull().default(false),
  image: text('image'),
  role: userRoleEnum('role').notNull().default('patient'),
  birthDate: date('birthDate'),
  status: userStatusEnum('status').notNull().default('active'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
})

export const session = pgTable('session', {
  id: text('id').primaryKey(),
  expiresAt: timestamp('expiresAt').notNull(),
  token: text('token').notNull().unique(),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
  ipAddress: text('ipAddress'),
  userAgent: text('userAgent'),
  userId: text('userId')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
})

export const account = pgTable('account', {
  id: text('id').primaryKey(),
  accountId: text('accountId').notNull(),
  providerId: text('providerId').notNull(),
  userId: text('userId')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  accessToken: text('accessToken'),
  refreshToken: text('refreshToken'),
  idToken: text('idToken'),
  accessTokenExpiresAt: timestamp('accessTokenExpiresAt'),
  refreshTokenExpiresAt: timestamp('refreshTokenExpiresAt'),
  scope: text('scope'),
  password: text('password'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
})

export const verification = pgTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expiresAt').notNull(),
  createdAt: timestamp('createdAt').defaultNow(),
  updatedAt: timestamp('updatedAt').defaultNow(),
})

export const professionalProfile = pgTable(
  'professional_profile',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id),
    displayName: text('display_name').notNull(),
    photoUrl: text('photo_url'),
    bio: text('bio'),
    licenseNumber: text('license_number'),
    licenseJurisdiction: text('license_jurisdiction'),
    licenseVerified: boolean('license_verified').notNull().default(false),
    theoreticalApproach: text('theoretical_approach').array().notNull().default([]),
    modality: modalityEnum('modality').notNull().default('both'),
    province: text('province'),
    city: text('city'),
    address: text('address'),
    languages: text('languages').array().notNull().default(['es']),
    feeMin: integer('fee_min'),
    feeMax: integer('fee_max'),
    acceptsNewPatients: boolean('accepts_new_patients').notNull().default(true),
    isPublished: boolean('is_published').notNull().default(false),
    // search_text is a generated tsvector column added in the migration SQL.
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex('professional_profile_user_id_key').on(t.userId)],
)

export const patientProfile = pgTable(
  'patient_profile',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id),
    firstName: text('first_name').notNull(),
    lastName: text('last_name').notNull(),
    // Encrypted at rest with lib/crypto.ts (FIELD_ENCRYPTION_KEY).
    dni: text('dni'),
    gender: text('gender'),
    phone: text('phone'),
    province: text('province'),
    city: text('city'),
    coverageId: uuid('coverage_id'),
    coverageMemberNumber: text('coverage_member_number'),
    emergencyContactName: text('emergency_contact_name'),
    emergencyContactPhone: text('emergency_contact_phone'),
    initialTopics: text('initial_topics'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex('patient_profile_user_id_key').on(t.userId)],
)

export const pastExperience = pgTable('past_experience', {
  id: uuid('id').primaryKey().defaultRandom(),
  patientId: uuid('patient_id')
    .notNull()
    .references(() => patientProfile.id),
  periodFrom: date('period_from'),
  periodTo: date('period_to'),
  reason: text('reason'),
  outcome: text('outcome'),
  professionalId: uuid('professional_id').references(() => professionalProfile.id),
  externalProfessionalName: text('external_professional_name'),
  closingSummaryId: uuid('closing_summary_id'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})
