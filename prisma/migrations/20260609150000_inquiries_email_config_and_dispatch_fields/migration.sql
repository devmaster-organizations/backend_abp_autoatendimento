CREATE TABLE IF NOT EXISTS "inquiry_email_configs" (
  "id" BIGSERIAL PRIMARY KEY,
  "recipient_email" VARCHAR(160) NOT NULL,
  "cc_email" VARCHAR(160),
  "is_active" BOOLEAN NOT NULL DEFAULT TRUE,
  "created_by" UUID,
  "updated_by" UUID,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
  CONSTRAINT "fk_inquiry_email_configs_created_by" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL,
  CONSTRAINT "fk_inquiry_email_configs_updated_by" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS "idx_inquiry_email_configs_is_active"
  ON "inquiry_email_configs" ("is_active");

ALTER TABLE "inquiries"
  ADD COLUMN IF NOT EXISTS "recipient_email" VARCHAR(160),
  ADD COLUMN IF NOT EXISTS "cc_email" VARCHAR(160),
  ADD COLUMN IF NOT EXISTS "email_message_id" VARCHAR(255),
  ADD COLUMN IF NOT EXISTS "email_sent_at" TIMESTAMPTZ(6),
  ADD COLUMN IF NOT EXISTS "answered_at" TIMESTAMPTZ(6);
