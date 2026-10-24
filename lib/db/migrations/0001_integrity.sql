-- Rules that Drizzle cannot express: exclusion constraints, generated tsvector, immutability triggers.
CREATE EXTENSION IF NOT EXISTS btree_gist;
--> statement-breakpoint
-- R-20: a professional cannot hold two live appointments that overlap in time.
ALTER TABLE "appointment"
  ADD CONSTRAINT "appointment_no_overlap"
  EXCLUDE USING gist (
    "professional_id" WITH =,
    tstzrange("starts_at", "ends_at", '[)') WITH &&
  ) WHERE ("status" IN ('requested', 'confirmed'));
--> statement-breakpoint
ALTER TABLE "appointment"
  ADD CONSTRAINT "appointment_valid_range" CHECK ("ends_at" > "starts_at");
--> statement-breakpoint
ALTER TABLE "availability_rule"
  ADD CONSTRAINT "availability_rule_valid" CHECK ("weekday" BETWEEN 0 AND 6 AND "end_time" > "start_time");
--> statement-breakpoint
ALTER TABLE "journal_entry"
  ADD CONSTRAINT "journal_entry_mood_range" CHECK ("mood" IS NULL OR "mood" BETWEEN 1 AND 5);
--> statement-breakpoint
ALTER TABLE "clinical_entry"
  ADD CONSTRAINT "clinical_entry_amendment_target" CHECK (("kind" = 'amendment') = ("amends_entry_id" IS NOT NULL));
--> statement-breakpoint
ALTER TABLE "professional_profile"
  ADD COLUMN "search_text" tsvector GENERATED ALWAYS AS (
    to_tsvector('spanish',
      coalesce("display_name", '') || ' ' ||
      coalesce("bio", '') || ' ' ||
      coalesce("city", '') || ' ' ||
      coalesce("province", ''))
  ) STORED;
--> statement-breakpoint
CREATE INDEX "professional_profile_search_idx" ON "professional_profile" USING gin ("search_text");
--> statement-breakpoint
CREATE OR REPLACE FUNCTION puente_reject_mutation() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION '% is append-only: % is not allowed', TG_TABLE_NAME, TG_OP
    USING ERRCODE = 'restrict_violation';
END;
$$;
--> statement-breakpoint
CREATE TRIGGER "clinical_entry_append_only"
  BEFORE UPDATE OR DELETE ON "clinical_entry"
  FOR EACH ROW EXECUTE FUNCTION puente_reject_mutation();
--> statement-breakpoint
CREATE TRIGGER "intake_immutable"
  BEFORE UPDATE OR DELETE ON "intake"
  FOR EACH ROW EXECUTE FUNCTION puente_reject_mutation();
--> statement-breakpoint
CREATE TRIGGER "audit_log_insert_only"
  BEFORE UPDATE OR DELETE ON "audit_log"
  FOR EACH ROW EXECUTE FUNCTION puente_reject_mutation();
--> statement-breakpoint
CREATE TRIGGER "consent_acceptance_immutable"
  BEFORE UPDATE OR DELETE ON "consent_acceptance"
  FOR EACH ROW EXECUTE FUNCTION puente_reject_mutation();
