CREATE TYPE "public"."modality" AS ENUM('in_person', 'online', 'both');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('patient', 'professional', 'admin');--> statement-breakpoint
CREATE TYPE "public"."user_status" AS ENUM('active', 'suspended');--> statement-breakpoint
CREATE TYPE "public"."clinical_entry_kind" AS ENUM('starting_point', 'first_impressions', 'evolution', 'amendment');--> statement-breakpoint
CREATE TYPE "public"."consent_kind" AS ENUM('informed_consent', 'terms', 'privacy');--> statement-breakpoint
CREATE TYPE "public"."coverage_type" AS ENUM('public_program', 'obra_social', 'prepaga', 'other');--> statement-breakpoint
CREATE TYPE "public"."discount_type" AS ENUM('percent', 'fixed', 'full');--> statement-breakpoint
CREATE TYPE "public"."bond_party" AS ENUM('patient', 'professional');--> statement-breakpoint
CREATE TYPE "public"."bond_status" AS ENUM('requested', 'awaiting_consent', 'active', 'rejected', 'cancelled', 'ended');--> statement-breakpoint
CREATE TYPE "public"."conversation_closed_reason" AS ENUM('professional', 'inactivity', 'bond_ended');--> statement-breakpoint
CREATE TYPE "public"."conversation_status" AS ENUM('pre_bond', 'bond', 'closed', 'blocked');--> statement-breakpoint
CREATE TYPE "public"."appointment_status" AS ENUM('requested', 'confirmed', 'rejected', 'cancelled', 'rescheduled', 'completed', 'no_show');--> statement-breakpoint
CREATE TYPE "public"."availability_exception_kind" AS ENUM('block', 'extra');--> statement-breakpoint
CREATE TYPE "public"."indication_kind" AS ENUM('guideline', 'exercise', 'reading', 'other');--> statement-breakpoint
CREATE TYPE "public"."indication_status" AS ENUM('active', 'archived');--> statement-breakpoint
CREATE TYPE "public"."journal_kind" AS ENUM('conflict', 'need', 'other');--> statement-breakpoint
CREATE TYPE "public"."resource_type" AS ENUM('file', 'link');--> statement-breakpoint
CREATE TYPE "public"."closing_summary_status" AS ENUM('requested', 'draft', 'approved');--> statement-breakpoint
CREATE TYPE "public"."progress_format" AS ENUM('stages', 'percent', 'scale_10');--> statement-breakpoint
CREATE TYPE "public"."progress_visibility" AS ENUM('patient_decides', 'recommend_show', 'recommend_hide', 'blocked');--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"accountId" text NOT NULL,
	"providerId" text NOT NULL,
	"userId" text NOT NULL,
	"accessToken" text,
	"refreshToken" text,
	"idToken" text,
	"accessTokenExpiresAt" timestamp,
	"refreshTokenExpiresAt" timestamp,
	"scope" text,
	"password" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "past_experience" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"patient_id" uuid NOT NULL,
	"period_from" date,
	"period_to" date,
	"reason" text,
	"outcome" text,
	"professional_id" uuid,
	"external_professional_name" text,
	"closing_summary_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "patient_profile" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"dni" text,
	"gender" text,
	"phone" text,
	"province" text,
	"city" text,
	"coverage_id" uuid,
	"coverage_member_number" text,
	"emergency_contact_name" text,
	"emergency_contact_phone" text,
	"initial_topics" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "professional_profile" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"display_name" text NOT NULL,
	"photo_url" text,
	"bio" text,
	"license_number" text,
	"license_jurisdiction" text,
	"license_verified" boolean DEFAULT false NOT NULL,
	"theoretical_approach" text[] DEFAULT '{}' NOT NULL,
	"modality" "modality" DEFAULT 'both' NOT NULL,
	"province" text,
	"city" text,
	"address" text,
	"languages" text[] DEFAULT '{"es"}' NOT NULL,
	"fee_min" integer,
	"fee_max" integer,
	"accepts_new_patients" boolean DEFAULT true NOT NULL,
	"is_published" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expiresAt" timestamp NOT NULL,
	"token" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"ipAddress" text,
	"userAgent" text,
	"userId" text NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"emailVerified" boolean DEFAULT false NOT NULL,
	"image" text,
	"role" "user_role" DEFAULT 'patient' NOT NULL,
	"birthDate" date,
	"status" "user_status" DEFAULT 'active' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expiresAt" timestamp NOT NULL,
	"createdAt" timestamp DEFAULT now(),
	"updatedAt" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "benefit" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"coverage_id" uuid NOT NULL,
	"description" text NOT NULL,
	"discount_type" "discount_type" NOT NULL,
	"value" numeric(12, 2),
	"valid_from" date,
	"valid_to" date,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "branch" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"parent_id" uuid,
	"sort" integer DEFAULT 0 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clinical_template" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_professional_id" uuid,
	"name" text NOT NULL,
	"entry_kind" "clinical_entry_kind" NOT NULL,
	"sections" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "consent_version" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"kind" "consent_kind" NOT NULL,
	"version" text NOT NULL,
	"body_md" text NOT NULL,
	"published_at" timestamp with time zone,
	"is_current" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "coverage" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"type" "coverage_type" NOT NULL,
	"jurisdiction" text DEFAULT 'nacional' NOT NULL,
	"external_code" text,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "platform_setting" (
	"key" text PRIMARY KEY NOT NULL,
	"value" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "professional_branch" (
	"professional_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "professional_branch_professional_id_branch_id_pk" PRIMARY KEY("professional_id","branch_id")
);
--> statement-breakpoint
CREATE TABLE "professional_coverage" (
	"professional_id" uuid NOT NULL,
	"coverage_id" uuid NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "professional_coverage_professional_id_coverage_id_pk" PRIMARY KEY("professional_id","coverage_id")
);
--> statement-breakpoint
CREATE TABLE "bond" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"patient_id" uuid NOT NULL,
	"professional_id" uuid NOT NULL,
	"status" "bond_status" DEFAULT 'requested' NOT NULL,
	"request_message" text,
	"rejection_reason" text,
	"ended_by" "bond_party",
	"end_reason" text,
	"requested_at" timestamp with time zone DEFAULT now() NOT NULL,
	"accepted_at" timestamp with time zone,
	"activated_at" timestamp with time zone,
	"ended_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "consent_acceptance" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"bond_id" uuid NOT NULL,
	"consent_version_id" uuid NOT NULL,
	"accepted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ip" text,
	"user_agent" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "conversation" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"patient_id" uuid NOT NULL,
	"professional_id" uuid NOT NULL,
	"bond_id" uuid,
	"status" "conversation_status" DEFAULT 'pre_bond' NOT NULL,
	"patient_messages_before_reply" integer DEFAULT 0 NOT NULL,
	"closed_reason" "conversation_closed_reason",
	"last_message_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "message" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"conversation_id" uuid NOT NULL,
	"sender_user_id" text NOT NULL,
	"body" text NOT NULL,
	"attachment_url" text,
	"read_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "appointment" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"professional_id" uuid NOT NULL,
	"patient_id" uuid NOT NULL,
	"bond_id" uuid,
	"service_type_id" uuid NOT NULL,
	"starts_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone NOT NULL,
	"modality" "modality" NOT NULL,
	"status" "appointment_status" DEFAULT 'requested' NOT NULL,
	"cancelled_by" text,
	"cancel_reason" text,
	"late_cancellation" boolean DEFAULT false NOT NULL,
	"rescheduled_from_id" uuid,
	"patient_reschedule_count" integer DEFAULT 0 NOT NULL,
	"expires_at" timestamp with time zone,
	"video_room_name" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "availability_exception" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"professional_id" uuid NOT NULL,
	"date" date NOT NULL,
	"start_time" time,
	"end_time" time,
	"kind" "availability_exception_kind" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "availability_rule" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"professional_id" uuid NOT NULL,
	"weekday" smallint NOT NULL,
	"start_time" time NOT NULL,
	"end_time" time NOT NULL,
	"modality" "modality" NOT NULL,
	"valid_from" date,
	"valid_to" date,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "professional_agenda_settings" (
	"professional_id" uuid PRIMARY KEY NOT NULL,
	"min_booking_notice_hours" integer DEFAULT 12 NOT NULL,
	"min_cancel_notice_hours" integer DEFAULT 24 NOT NULL,
	"request_expiry_hours" integer DEFAULT 48 NOT NULL,
	"timezone" text DEFAULT 'America/Argentina/Buenos_Aires' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "service_type" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"professional_id" uuid NOT NULL,
	"name" text NOT NULL,
	"duration_min" integer NOT NULL,
	"modality" "modality" NOT NULL,
	"fee" integer,
	"is_first_consultation" boolean DEFAULT false NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "service_type_coverage" (
	"service_type_id" uuid NOT NULL,
	"coverage_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "service_type_coverage_service_type_id_coverage_id_pk" PRIMARY KEY("service_type_id","coverage_id")
);
--> statement-breakpoint
CREATE TABLE "clinical_entry" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"bond_id" uuid NOT NULL,
	"author_professional_id" uuid NOT NULL,
	"kind" "clinical_entry_kind" NOT NULL,
	"amends_entry_id" uuid,
	"appointment_id" uuid,
	"template_id" uuid,
	"content" jsonb NOT NULL,
	"content_hash" text NOT NULL,
	"author_license_snapshot" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clinical_record_request" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"bond_id" uuid NOT NULL,
	"requested_at" timestamp with time zone DEFAULT now() NOT NULL,
	"due_at" timestamp with time zone NOT NULL,
	"fulfilled_at" timestamp with time zone,
	"export_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "intake" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"bond_id" uuid NOT NULL,
	"needs" text NOT NULL,
	"reason_to_start" text NOT NULL,
	"submitted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "indication" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"bond_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"kind" "indication_kind" NOT NULL,
	"frequency" text,
	"valid_until" date,
	"status" "indication_status" DEFAULT 'active' NOT NULL,
	"patient_seen_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "indication_comment" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"indication_id" uuid NOT NULL,
	"author_user_id" text NOT NULL,
	"body" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "journal_entry" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"bond_id" uuid NOT NULL,
	"patient_id" uuid NOT NULL,
	"kind" "journal_kind" NOT NULL,
	"body" text NOT NULL,
	"mood" smallint,
	"week_start" date NOT NULL,
	"editable_until" timestamp with time zone NOT NULL,
	"read_by_professional_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "resource" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"indication_id" uuid,
	"message_id" uuid,
	"type" "resource_type" NOT NULL,
	"url" text NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "closing_summary" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"bond_id" uuid NOT NULL,
	"status" "closing_summary_status" NOT NULL,
	"requested_by_patient_at" timestamp with time zone,
	"content" text,
	"approved_at" timestamp with time zone,
	"pdf_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "progress_settings" (
	"bond_id" uuid PRIMARY KEY NOT NULL,
	"format" "progress_format" DEFAULT 'stages' NOT NULL,
	"stages" jsonb,
	"visibility_policy" "progress_visibility" DEFAULT 'patient_decides' NOT NULL,
	"recommendation_message" text,
	"patient_wants_to_see" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "progress_update" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"bond_id" uuid NOT NULL,
	"format" "progress_format" NOT NULL,
	"value" numeric(6, 2) NOT NULL,
	"note" text,
	"clinical_entry_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "weekly_summary" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"bond_id" uuid NOT NULL,
	"week_start" date NOT NULL,
	"data" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"ai_text" text,
	"professional_annotation" text,
	"shared_with_patient" boolean DEFAULT false NOT NULL,
	"generated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"actor_user_id" text,
	"action" text NOT NULL,
	"entity" text NOT NULL,
	"entity_id" text,
	"bond_id" uuid,
	"ip" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notification" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"type" text NOT NULL,
	"payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"read_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "past_experience" ADD CONSTRAINT "past_experience_patient_id_patient_profile_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patient_profile"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "past_experience" ADD CONSTRAINT "past_experience_professional_id_professional_profile_id_fk" FOREIGN KEY ("professional_id") REFERENCES "public"."professional_profile"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patient_profile" ADD CONSTRAINT "patient_profile_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "professional_profile" ADD CONSTRAINT "professional_profile_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "benefit" ADD CONSTRAINT "benefit_coverage_id_coverage_id_fk" FOREIGN KEY ("coverage_id") REFERENCES "public"."coverage"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "branch" ADD CONSTRAINT "branch_parent_id_branch_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."branch"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical_template" ADD CONSTRAINT "clinical_template_owner_professional_id_professional_profile_id_fk" FOREIGN KEY ("owner_professional_id") REFERENCES "public"."professional_profile"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "professional_branch" ADD CONSTRAINT "professional_branch_professional_id_professional_profile_id_fk" FOREIGN KEY ("professional_id") REFERENCES "public"."professional_profile"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "professional_branch" ADD CONSTRAINT "professional_branch_branch_id_branch_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branch"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "professional_coverage" ADD CONSTRAINT "professional_coverage_professional_id_professional_profile_id_fk" FOREIGN KEY ("professional_id") REFERENCES "public"."professional_profile"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "professional_coverage" ADD CONSTRAINT "professional_coverage_coverage_id_coverage_id_fk" FOREIGN KEY ("coverage_id") REFERENCES "public"."coverage"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bond" ADD CONSTRAINT "bond_patient_id_patient_profile_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patient_profile"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bond" ADD CONSTRAINT "bond_professional_id_professional_profile_id_fk" FOREIGN KEY ("professional_id") REFERENCES "public"."professional_profile"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consent_acceptance" ADD CONSTRAINT "consent_acceptance_bond_id_bond_id_fk" FOREIGN KEY ("bond_id") REFERENCES "public"."bond"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consent_acceptance" ADD CONSTRAINT "consent_acceptance_consent_version_id_consent_version_id_fk" FOREIGN KEY ("consent_version_id") REFERENCES "public"."consent_version"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversation" ADD CONSTRAINT "conversation_patient_id_patient_profile_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patient_profile"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversation" ADD CONSTRAINT "conversation_professional_id_professional_profile_id_fk" FOREIGN KEY ("professional_id") REFERENCES "public"."professional_profile"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversation" ADD CONSTRAINT "conversation_bond_id_bond_id_fk" FOREIGN KEY ("bond_id") REFERENCES "public"."bond"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message" ADD CONSTRAINT "message_conversation_id_conversation_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversation"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message" ADD CONSTRAINT "message_sender_user_id_user_id_fk" FOREIGN KEY ("sender_user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointment" ADD CONSTRAINT "appointment_professional_id_professional_profile_id_fk" FOREIGN KEY ("professional_id") REFERENCES "public"."professional_profile"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointment" ADD CONSTRAINT "appointment_patient_id_patient_profile_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patient_profile"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointment" ADD CONSTRAINT "appointment_bond_id_bond_id_fk" FOREIGN KEY ("bond_id") REFERENCES "public"."bond"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointment" ADD CONSTRAINT "appointment_service_type_id_service_type_id_fk" FOREIGN KEY ("service_type_id") REFERENCES "public"."service_type"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointment" ADD CONSTRAINT "appointment_rescheduled_from_id_appointment_id_fk" FOREIGN KEY ("rescheduled_from_id") REFERENCES "public"."appointment"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "availability_exception" ADD CONSTRAINT "availability_exception_professional_id_professional_profile_id_fk" FOREIGN KEY ("professional_id") REFERENCES "public"."professional_profile"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "availability_rule" ADD CONSTRAINT "availability_rule_professional_id_professional_profile_id_fk" FOREIGN KEY ("professional_id") REFERENCES "public"."professional_profile"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "professional_agenda_settings" ADD CONSTRAINT "professional_agenda_settings_professional_id_professional_profile_id_fk" FOREIGN KEY ("professional_id") REFERENCES "public"."professional_profile"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_type" ADD CONSTRAINT "service_type_professional_id_professional_profile_id_fk" FOREIGN KEY ("professional_id") REFERENCES "public"."professional_profile"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_type_coverage" ADD CONSTRAINT "service_type_coverage_service_type_id_service_type_id_fk" FOREIGN KEY ("service_type_id") REFERENCES "public"."service_type"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_type_coverage" ADD CONSTRAINT "service_type_coverage_coverage_id_coverage_id_fk" FOREIGN KEY ("coverage_id") REFERENCES "public"."coverage"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical_entry" ADD CONSTRAINT "clinical_entry_bond_id_bond_id_fk" FOREIGN KEY ("bond_id") REFERENCES "public"."bond"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical_entry" ADD CONSTRAINT "clinical_entry_author_professional_id_professional_profile_id_fk" FOREIGN KEY ("author_professional_id") REFERENCES "public"."professional_profile"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical_entry" ADD CONSTRAINT "clinical_entry_amends_entry_id_clinical_entry_id_fk" FOREIGN KEY ("amends_entry_id") REFERENCES "public"."clinical_entry"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical_entry" ADD CONSTRAINT "clinical_entry_appointment_id_appointment_id_fk" FOREIGN KEY ("appointment_id") REFERENCES "public"."appointment"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical_entry" ADD CONSTRAINT "clinical_entry_template_id_clinical_template_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."clinical_template"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical_record_request" ADD CONSTRAINT "clinical_record_request_bond_id_bond_id_fk" FOREIGN KEY ("bond_id") REFERENCES "public"."bond"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "intake" ADD CONSTRAINT "intake_bond_id_bond_id_fk" FOREIGN KEY ("bond_id") REFERENCES "public"."bond"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "indication" ADD CONSTRAINT "indication_bond_id_bond_id_fk" FOREIGN KEY ("bond_id") REFERENCES "public"."bond"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "indication_comment" ADD CONSTRAINT "indication_comment_indication_id_indication_id_fk" FOREIGN KEY ("indication_id") REFERENCES "public"."indication"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "indication_comment" ADD CONSTRAINT "indication_comment_author_user_id_user_id_fk" FOREIGN KEY ("author_user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journal_entry" ADD CONSTRAINT "journal_entry_bond_id_bond_id_fk" FOREIGN KEY ("bond_id") REFERENCES "public"."bond"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journal_entry" ADD CONSTRAINT "journal_entry_patient_id_patient_profile_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patient_profile"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resource" ADD CONSTRAINT "resource_indication_id_indication_id_fk" FOREIGN KEY ("indication_id") REFERENCES "public"."indication"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resource" ADD CONSTRAINT "resource_message_id_message_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."message"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "closing_summary" ADD CONSTRAINT "closing_summary_bond_id_bond_id_fk" FOREIGN KEY ("bond_id") REFERENCES "public"."bond"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "progress_settings" ADD CONSTRAINT "progress_settings_bond_id_bond_id_fk" FOREIGN KEY ("bond_id") REFERENCES "public"."bond"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "progress_update" ADD CONSTRAINT "progress_update_bond_id_bond_id_fk" FOREIGN KEY ("bond_id") REFERENCES "public"."bond"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "progress_update" ADD CONSTRAINT "progress_update_clinical_entry_id_clinical_entry_id_fk" FOREIGN KEY ("clinical_entry_id") REFERENCES "public"."clinical_entry"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "weekly_summary" ADD CONSTRAINT "weekly_summary_bond_id_bond_id_fk" FOREIGN KEY ("bond_id") REFERENCES "public"."bond"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_actor_user_id_user_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_bond_id_bond_id_fk" FOREIGN KEY ("bond_id") REFERENCES "public"."bond"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification" ADD CONSTRAINT "notification_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "patient_profile_user_id_key" ON "patient_profile" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "professional_profile_user_id_key" ON "professional_profile" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "branch_slug_key" ON "branch" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "consent_version_kind_version_key" ON "consent_version" USING btree ("kind","version");--> statement-breakpoint
CREATE UNIQUE INDEX "bond_one_open_per_patient" ON "bond" USING btree ("patient_id") WHERE status IN ('requested', 'awaiting_consent', 'active');--> statement-breakpoint
CREATE INDEX "bond_professional_status_idx" ON "bond" USING btree ("professional_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "consent_acceptance_bond_id_key" ON "consent_acceptance" USING btree ("bond_id");--> statement-breakpoint
CREATE INDEX "conversation_patient_idx" ON "conversation" USING btree ("patient_id","status");--> statement-breakpoint
CREATE INDEX "conversation_professional_idx" ON "conversation" USING btree ("professional_id","status");--> statement-breakpoint
CREATE INDEX "message_conversation_idx" ON "message" USING btree ("conversation_id","created_at");--> statement-breakpoint
CREATE INDEX "appointment_professional_starts_idx" ON "appointment" USING btree ("professional_id","starts_at");--> statement-breakpoint
CREATE INDEX "appointment_patient_starts_idx" ON "appointment" USING btree ("patient_id","starts_at");--> statement-breakpoint
CREATE INDEX "clinical_entry_bond_created_idx" ON "clinical_entry" USING btree ("bond_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "intake_bond_id_key" ON "intake" USING btree ("bond_id");--> statement-breakpoint
CREATE INDEX "indication_bond_status_idx" ON "indication" USING btree ("bond_id","status");--> statement-breakpoint
CREATE INDEX "journal_entry_bond_week_idx" ON "journal_entry" USING btree ("bond_id","week_start");--> statement-breakpoint
CREATE UNIQUE INDEX "closing_summary_bond_id_key" ON "closing_summary" USING btree ("bond_id");--> statement-breakpoint
CREATE INDEX "progress_update_bond_created_idx" ON "progress_update" USING btree ("bond_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "weekly_summary_bond_week_key" ON "weekly_summary" USING btree ("bond_id","week_start");--> statement-breakpoint
CREATE INDEX "audit_log_bond_created_idx" ON "audit_log" USING btree ("bond_id","created_at");--> statement-breakpoint
CREATE INDEX "audit_log_actor_created_idx" ON "audit_log" USING btree ("actor_user_id","created_at");--> statement-breakpoint
CREATE INDEX "notification_user_created_idx" ON "notification" USING btree ("user_id","created_at");