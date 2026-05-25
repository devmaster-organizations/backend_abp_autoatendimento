-- CreateTable
CREATE TABLE "navigation_journeys" (
    "id" BIGSERIAL NOT NULL,
    "session_key" VARCHAR(220) NOT NULL,
    "user_id" UUID,
    "ip_address" VARCHAR(64) NOT NULL,
    "navigation_flow" JSONB NOT NULL DEFAULT '[]',
    "last_node_id" BIGINT,
    "last_node_slug" VARCHAR(180),
    "total_steps" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "navigation_journeys_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "navigation_journeys_session_key_key" ON "navigation_journeys"("session_key");

-- CreateIndex
CREATE INDEX "idx_navigation_journeys_user_id" ON "navigation_journeys"("user_id");

-- CreateIndex
CREATE INDEX "idx_navigation_journeys_ip_address" ON "navigation_journeys"("ip_address");

-- CreateIndex
CREATE INDEX "idx_navigation_journeys_last_node_id" ON "navigation_journeys"("last_node_id");

-- AddForeignKey
ALTER TABLE "navigation_journeys" ADD CONSTRAINT "navigation_journeys_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
