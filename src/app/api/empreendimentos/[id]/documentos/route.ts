import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { getOptionalSession } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { uploadDocumentoArquivo } from "@/lib/supabase";
import { processDocumento } from "@/lib/rag";
import { CATEGORIAS, type CategoriaValue } from "@/lib/categorias";

export const runtime = "nodejs";
export const maxDuration = 60;

const ALLOWED_MIME_TYPES: Record<string, boolean> = {
  "application/pdf": true,
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": true,
  "text/plain": true,
};

const MAX_SIZE_BYTES = 20 * 1024 * 1024;

function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-150);
}

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const session = await getOptionalSession();
  if (!session) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const { id } = await ctx.params;
  const documentos = await prisma.documento.findMany({
    where: { empreendimentoId: id },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ documentos });
}

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const session = await getOptionalSession();
  if (!session) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const { id: empreendimentoId } = await ctx.params;

  const empreendimento = await prisma.empreendimento.findUnique({
    where: { id: empreendimentoId },
  });
  if (!empreendimento) {
    return NextResponse.json(
      { error: "Empreendimento não encontrado." },
      { status: 404 }
    );
  }

  const formData = await req.formData();
  const file = formData.get("file");
  const categoria = String(formData.get("categoria") ?? "OUTRO");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Arquivo não enviado." }, { status: 400 });
  }

  if (!CATEGORIAS.some((c) => c.value === categoria)) {
    return NextResponse.json({ error: "Categoria inválida." }, { status: 400 });
  }

  if (!ALLOWED_MIME_TYPES[file.type]) {
    return NextResponse.json(
      { error: "Tipo de arquivo não suportado. Envie PDF, DOCX ou TXT." },
      { status: 400 }
    );
  }

  if (file.size > MAX_SIZE_BYTES) {
    return NextResponse.json(
      { error: "Arquivo muito grande (máximo 20MB)." },
      { status: 400 }
    );
  }

  const documentoId = randomUUID();
  const storagePath = `${empreendimentoId}/${documentoId}-${sanitizeFileName(file.name)}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  try {
    await uploadDocumentoArquivo(storagePath, buffer, file.type);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Falha ao enviar arquivo." },
      { status: 500 }
    );
  }

  const documento = await prisma.documento.create({
    data: {
      id: documentoId,
      empreendimentoId,
      nomeArquivo: file.name,
      categoria: categoria as CategoriaValue,
      storagePath,
      tamanhoBytes: buffer.length,
      status: "PROCESSANDO",
    },
  });

  try {
    await processDocumento(documentoId, empreendimentoId, buffer, file.type);
  } catch {
    // status/erro já foram gravados em processDocumento
  }

  const atualizado = await prisma.documento.findUnique({
    where: { id: documento.id },
  });

  return NextResponse.json({ documento: atualizado });
}
