-- CreateTable
CREATE TABLE "chat_flow_nodes" (
    "id" VARCHAR(120) NOT NULL,
    "bot_message" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chat_flow_nodes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_flow_options" (
    "id" BIGSERIAL NOT NULL,
    "label" VARCHAR(180) NOT NULL,
    "from_node_id" VARCHAR(120) NOT NULL,
    "to_node_id" VARCHAR(120) NOT NULL,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chat_flow_options_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_chat_flow_options_from_node_id" ON "chat_flow_options"("from_node_id");

-- CreateIndex
CREATE INDEX "idx_chat_flow_options_to_node_id" ON "chat_flow_options"("to_node_id");

-- CreateIndex
CREATE UNIQUE INDEX "uq_chat_flow_options_from_order" ON "chat_flow_options"("from_node_id", "display_order");

-- AddForeignKey
ALTER TABLE "chat_flow_options" ADD CONSTRAINT "chat_flow_options_from_node_id_fkey" FOREIGN KEY ("from_node_id") REFERENCES "chat_flow_nodes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_flow_options" ADD CONSTRAINT "chat_flow_options_to_node_id_fkey" FOREIGN KEY ("to_node_id") REFERENCES "chat_flow_nodes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
