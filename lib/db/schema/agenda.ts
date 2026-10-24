import {
  boolean,
  date,
  index,
  integer,
  pgEnum,
  pgTable,
  primaryKey,
  smallint,
  text,
  time,
  timestamp,
  uuid,
  type AnyPgColumn,
} from 'drizzle-orm/pg-core'
import { coverage } from './catalog'
import { bond } from './connection'
import { modalityEnum } from './enums'
import { patientProfile, professionalProfile } from './identity'

export const appointmentStatusEnum = pgEnum('appointment_status', [
  'requested',
  'confirmed',
  'rejected',
  'cancelled',
  'rescheduled',
  'completed',
  'no_show',
])
export const availabilityExceptionKindEnum = pgEnum('availability_exception_kind', [
  'block',
  'extra',
])

export const serviceType = pgTable('service_type', {
  id: uuid('id').primaryKey().defaultRandom(),
  professionalId: uuid('professional_id')
    .notNull()
    .references(() => professionalProfile.id),
  name: text('name').notNull(),
  durationMin: integer('duration_min').notNull(),
  modality: modalityEnum('modality').notNull(),
  fee: integer('fee'),
  isFirstConsultation: boolean('is_first_consultation').notNull().default(false),
  active: boolean('active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const serviceTypeCoverage = pgTable(
  'service_type_coverage',
  {
    serviceTypeId: uuid('service_type_id')
      .notNull()
      .references(() => serviceType.id),
    coverageId: uuid('coverage_id')
      .notNull()
      .references(() => coverage.id),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.serviceTypeId, t.coverageId] })],
)

export const availabilityRule = pgTable('availability_rule', {
  id: uuid('id').primaryKey().defaultRandom(),
  professionalId: uuid('professional_id')
    .notNull()
    .references(() => professionalProfile.id),
  weekday: smallint('weekday').notNull(),
  startTime: time('start_time').notNull(),
  endTime: time('end_time').notNull(),
  modality: modalityEnum('modality').notNull(),
  validFrom: date('valid_from'),
  validTo: date('valid_to'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const availabilityException = pgTable('availability_exception', {
  id: uuid('id').primaryKey().defaultRandom(),
  professionalId: uuid('professional_id')
    .notNull()
    .references(() => professionalProfile.id),
  date: date('date').notNull(),
  startTime: time('start_time'),
  endTime: time('end_time'),
  kind: availabilityExceptionKindEnum('kind').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const professionalAgendaSettings = pgTable('professional_agenda_settings', {
  professionalId: uuid('professional_id')
    .primaryKey()
    .references(() => professionalProfile.id),
  minBookingNoticeHours: integer('min_booking_notice_hours').notNull().default(12),
  minCancelNoticeHours: integer('min_cancel_notice_hours').notNull().default(24),
  requestExpiryHours: integer('request_expiry_hours').notNull().default(48),
  timezone: text('timezone').notNull().default('America/Argentina/Buenos_Aires'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const appointment = pgTable(
  'appointment',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    professionalId: uuid('professional_id')
      .notNull()
      .references(() => professionalProfile.id),
    patientId: uuid('patient_id')
      .notNull()
      .references(() => patientProfile.id),
    bondId: uuid('bond_id').references(() => bond.id),
    serviceTypeId: uuid('service_type_id')
      .notNull()
      .references(() => serviceType.id),
    startsAt: timestamp('starts_at', { withTimezone: true }).notNull(),
    endsAt: timestamp('ends_at', { withTimezone: true }).notNull(),
    modality: modalityEnum('modality').notNull(),
    status: appointmentStatusEnum('status').notNull().default('requested'),
    cancelledBy: text('cancelled_by'),
    cancelReason: text('cancel_reason'),
    lateCancellation: boolean('late_cancellation').notNull().default(false),
    rescheduledFromId: uuid('rescheduled_from_id').references((): AnyPgColumn => appointment.id),
    patientRescheduleCount: integer('patient_reschedule_count').notNull().default(0),
    expiresAt: timestamp('expires_at', { withTimezone: true }),
    videoRoomName: text('video_room_name'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    // The no-overlap exclusion constraint lives in the migration SQL.
    index('appointment_professional_starts_idx').on(t.professionalId, t.startsAt),
    index('appointment_patient_starts_idx').on(t.patientId, t.startsAt),
  ],
)
