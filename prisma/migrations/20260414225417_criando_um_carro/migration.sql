-- CreateTable
CREATE TABLE "Carros" (
    "id" BIGSERIAL NOT NULL,
    "observacao" TEXT NOT NULL,
    "modelo" TEXT NOT NULL,

    CONSTRAINT "Carros_pkey" PRIMARY KEY ("id")
);
