-- CreateEnum
CREATE TYPE "navigation_node_response_type" AS ENUM ('TEXT', 'LINK');

-- CreateEnum
CREATE TYPE "user_security_token_type" AS ENUM ('INVITE', 'RESET');

-- AlterTable
ALTER TABLE "chat_flow_nodes" ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "chat_flow_options" ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "navigation_nodes" ADD COLUMN     "link_label" VARCHAR(180),
ADD COLUMN     "link_url" VARCHAR(500),
ADD COLUMN     "response_type" "navigation_node_response_type" NOT NULL DEFAULT 'TEXT';

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "must_change_password" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "password_updated_at" TIMESTAMPTZ(6);

-- CreateTable
CREATE TABLE "navigation_node_access_logs" (
    "id" BIGSERIAL NOT NULL,
    "navigation_node_id" BIGINT NOT NULL,
    "selected_option_label" VARCHAR(180),
    "selected_option_target" BIGINT,
    "accessed_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "navigation_node_access_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_security_tokens" (
    "id" BIGSERIAL NOT NULL,
    "user_id" UUID NOT NULL,
    "type" "user_security_token_type" NOT NULL,
    "token_hash" VARCHAR(255) NOT NULL,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "used_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_security_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_navigation_node_access_logs_navigation_node_id" ON "navigation_node_access_logs"("navigation_node_id");

-- CreateIndex
CREATE INDEX "idx_user_security_tokens_user_id" ON "user_security_tokens"("user_id");

-- CreateIndex
CREATE INDEX "idx_user_security_tokens_type" ON "user_security_tokens"("type");

-- AddForeignKey
ALTER TABLE "navigation_node_access_logs" ADD CONSTRAINT "navigation_node_access_logs_navigation_node_id_fkey" FOREIGN KEY ("navigation_node_id") REFERENCES "navigation_nodes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_security_tokens" ADD CONSTRAINT "user_security_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
