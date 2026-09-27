import "server-only";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";
import { embedTexts } from "@/lib/openai";
import { extractText } from "@/lib/textExtract";

const CHUNK_SIZE = 1000;
const CHUNK_OVERLAP = 150;
const EMBEDDING_BATCH_SIZE = 50;

export function chunkText(
  text: string,
  chunkSize = CHUNK_SIZE,
  overlap = CHUNK_OVERLAP
): string[] {
  const cleaned = text.replace(/\r\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
  if (!cleaned) return [];

  const chunks: string[] = [];
  let start = 0;

  while (start < cleaned.length) {
    const end = Math.min(start + chunkSize, cleaned.length);
    let sliceEnd = end;

    if (end < cleaned.length) {
      const lastBreak = cleaned.lastIndexOf("\n", end);
      const lastSpace = cleaned.lastIndexOf(" ", end);
      const breakPoint = Math.max(lastBreak, lastSpace);
      if (breakPoint > start + chunkSize * 0.5) {
        sliceEnd = breakPoint;
      }
    }

    const chunk = cleaned.slice(start, sliceEnd).trim();
    if (chunk) chunks.push(chunk);
    if (sliceEnd >= cleaned.length) break;
    start = Math.max(sliceEnd - overlap, start + 1);
  }

  return chunks;
}

function toVectorLiteral(embedding: number[]): string {
  return `[${embedding.join(",")}]`;
}

async function insertChunkBatch(
  documentoId: string,
  empreendimentoId: string,
  chunks: string[],
  embeddings: number[][],
  ordemInicial: number
) {
  for (let i = 0; i < chunks.length; i++) {
    const vectorLiteral = toVectorLiteral(embeddings[i]);
    await prisma.$executeRaw`
      INSERT INTO "Chunk" (id, "documentoId", "empreendimentoId", conteudo, ordem, embedding, "createdAt")
      VALUES (${randomUUID()}, ${documentoId}, ${empreendimentoId}, ${chunks[i]}, ${ordemInicial + i}, ${vectorLiteral}::vector, now())
    `;
  }
}

export async function processDocumento(
  documentoId: string,
  empreendimentoId: string,
  buffer: Buffer,
  mimeType: string
) {
  try {
    const text = await extractText(buffer, mimeType);
    const chunks = chunkText(text);

    if (chunks.length === 0) {
      throw new Error(
        "Não foi possível extrair texto deste documento. Verifique se o arquivo não é apenas uma imagem escaneada."
      );
    }

    for (let i = 0; i < chunks.length; i += EMBEDDING_BATCH_SIZE) {
      const batch = chunks.slice(i, i + EMBEDDING_BATCH_SIZE);
      const embeddings = await embedTexts(batch);
      await insertChunkBatch(documentoId, empreendimentoId, batch, embeddings, i);
    }

    await prisma.documento.update({
      where: { id: documentoId },
      data: { status: "PRONTO", erro: null },
    });
  } catch (err) {
    const mensagem = err instanceof Error ? err.message : "Erro desconhecido ao processar o documento.";
    await prisma.documento.update({
      where: { id: documentoId },
      data: { status: "ERRO", erro: mensagem },
    });
    throw err;
  }
}

export type ChunkComFonte = {
  conteudo: string;
  nomeArquivo: string;
  distance: number;
};

export async function retrieveRelevantChunks(
  empreendimentoId: string,
  queryEmbedding: number[],
  limit = 6
): Promise<ChunkComFonte[]> {
  const vectorLiteral = toVectorLiteral(queryEmbedding);
  const rows = await prisma.$queryRaw<ChunkComFonte[]>`
    SELECT c.conteudo as "conteudo", d."nomeArquivo" as "nomeArquivo",
           (c.embedding <=> ${vectorLiteral}::vector) as "distance"
    FROM "Chunk" c
    JOIN "Documento" d ON d.id = c."documentoId"
    WHERE c."empreendimentoId" = ${empreendimentoId}
    ORDER BY c.embedding <=> ${vectorLiteral}::vector
    LIMIT ${limit}
  `;
  return rows;
}
