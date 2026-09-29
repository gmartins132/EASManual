import { NextRequest, NextResponse } from "next/server";
import { getOptionalSession } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { downloadDocumentoArquivo } from "@/lib/supabase";
import { mimeTypeFromFileName } from "@/lib/textExtract";
import { processDocumento } from "@/lib/rag";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string; docId: string }> }
) {
  const session = await getOptionalSession();
  if (!session) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const { id: empreendimentoId, docId } = await ctx.params;

  const documento = await prisma.documento.findUnique({ where: { id: docId } });
  if (!documento || documento.empreendimentoId !== empreendimentoId) {
    return NextResponse.json({ error: "Documento não encontrado." }, { status: 404 });
  }

  try {
    const buffer = await downloadDocumentoArquivo(documento.storagePath);
    const mimeType = mimeTypeFromFileName(documento.nomeArquivo);
    await processDocumento(docId, empreendimentoId, buffer, mimeType);
  } catch (err) {
    // Se falhou antes de chegar em processDocumento (ex: download do storage),
    // o status ainda não foi atualizado — garante que não fique preso em PROCESSANDO.
    await prisma.documento.update({
      where: { id: docId },
      data: {
        status: "ERRO",
        erro: err instanceof Error ? err.message : "Erro ao processar documento.",
      },
    }).catch(() => undefined);
  }

  const atualizado = await prisma.documento.findUnique({ where: { id: docId } });
  return NextResponse.json({ documento: atualizado });
}
