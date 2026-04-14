-- CreateTable
CREATE TABLE "Alunos" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "especialidade" TEXT NOT NULL,
    "createAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updateAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Alunos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Nova" (
    "id" SERIAL NOT NULL,
    "descricao" TEXT NOT NULL,

    CONSTRAINT "Nova_pkey" PRIMARY KEY ("id")
);
