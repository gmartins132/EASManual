-- Gerado com `prisma migrate diff --from-empty --to-schema prisma/schema.prisma --script`.
-- Referência para aplicar o schema manualmente (ex: via SQL editor do Supabase ou um
-- client Postgres qualquer) caso `prisma db push` fique indisponível no seu ambiente.
-- Rode também prisma/enable_vector.sql antes (ou junto) deste script.

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "CategoriaDocumento" AS ENUM ('MANUAL_SINDICO', 'MANUAL_TECNICO', 'GARANTIA', 'PROCEDIMENTO', 'MANUTENCAO', 'DOCUMENTACAO_CONDOMINIO', 'OUTRO');

-- CreateEnum
CREATE TYPE "StatusDocumento" AS ENUM ('PROCESSANDO', 'PRONTO', 'ERRO');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Empreendimento" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "endereco" TEXT,
    "descricao" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Empreendimento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Documento" (
    "id" TEXT NOT NULL,
    "empreendimentoId" TEXT NOT NULL,
    "nomeArquivo" TEXT NOT NULL,
    "categoria" "CategoriaDocumento" NOT NULL DEFAULT 'OUTRO',
    "storagePath" TEXT NOT NULL,
    "tamanhoBytes" INTEGER,
    "status" "StatusDocumento" NOT NULL DEFAULT 'PROCESSANDO',
    "erro" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Documento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Chunk" (
    "id" TEXT NOT NULL,
    "documentoId" TEXT NOT NULL,
    "empreendimentoId" TEXT NOT NULL,
    "conteudo" TEXT NOT NULL,
    "ordem" INTEGER NOT NULL,
    "embedding" vector(1536) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Chunk_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Mensagem" (
    "id" TEXT NOT NULL,
    "empreendimentoId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "conteudo" TEXT NOT NULL,
    "fontes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Mensagem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "Documento_empreendimentoId_idx" ON "Documento"("empreendimentoId");

-- CreateIndex
CREATE INDEX "Chunk_empreendimentoId_idx" ON "Chunk"("empreendimentoId");

-- CreateIndex
CREATE INDEX "Mensagem_empreendimentoId_idx" ON "Mensagem"("empreendimentoId");

-- AddForeignKey
ALTER TABLE "Documento" ADD CONSTRAINT "Documento_empreendimentoId_fkey" FOREIGN KEY ("empreendimentoId") REFERENCES "Empreendimento"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Chunk" ADD CONSTRAINT "Chunk_documentoId_fkey" FOREIGN KEY ("documentoId") REFERENCES "Documento"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mensagem" ADD CONSTRAINT "Mensagem_empreendimentoId_fkey" FOREIGN KEY ("empreendimentoId") REFERENCES "Empreendimento"("id") ON DELETE CASCADE ON UPDATE CASCADE;

