-- CreateEnum
CREATE TYPE "user_role" AS ENUM ('ADMIN', 'SECRETARIA');

-- CreateEnum
CREATE TYPE "inquiry_status" AS ENUM ('ABERTA', 'RESPONDIDA');

-- CreateEnum
CREATE TYPE "satisfaction_flag" AS ENUM ('ATENDEU', 'NAO_ATENDEU');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(120) NOT NULL,
    "email" VARCHAR(160) NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" "user_role" NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "navigation_nodes" (
    "id" BIGSERIAL NOT NULL,
    "parent_id" BIGINT,
    "title" VARCHAR(180) NOT NULL,
    "slug" VARCHAR(180) NOT NULL,
    "prompt" VARCHAR(1000),
    "answer_summary" TEXT,
    "evidence_excerpt" TEXT,
    "evidence_source" VARCHAR(500),
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "navigation_nodes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inquiries" (
    "id" BIGSERIAL NOT NULL,
    "requester_name" VARCHAR(160) NOT NULL,
    "requester_email" VARCHAR(160) NOT NULL,
    "question" TEXT NOT NULL,
    "attachment_name" VARCHAR(255),
    "attachment_mime_type" VARCHAR(100),
    "attachment_data" BYTEA,
    "status" "inquiry_status" NOT NULL DEFAULT 'ABERTA',
    "answered_by" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "inquiries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "interaction_logs" (
    "id" BIGSERIAL NOT NULL,
    "session_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "navigation_flow" JSONB NOT NULL DEFAULT '[]',
    "inquiry_ids" JSONB NOT NULL DEFAULT '[]',
    "flag" "satisfaction_flag",
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "interaction_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NovaTabela" (
    "id" BIGSERIAL NOT NULL,
    "observacao" TEXT NOT NULL,

    CONSTRAINT "NovaTabela_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "navigation_nodes_slug_key" ON "navigation_nodes"("slug");

-- CreateIndex
CREATE INDEX "idx_navigation_nodes_parent_id" ON "navigation_nodes"("parent_id");

-- CreateIndex
CREATE INDEX "idx_inquiries_status" ON "inquiries"("status");

-- CreateIndex
CREATE INDEX "idx_interaction_logs_session_id" ON "interaction_logs"("session_id");

-- AddForeignKey
ALTER TABLE "navigation_nodes" ADD CONSTRAINT "navigation_nodes_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "navigation_nodes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inquiries" ADD CONSTRAINT "inquiries_answered_by_fkey" FOREIGN KEY ("answered_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
