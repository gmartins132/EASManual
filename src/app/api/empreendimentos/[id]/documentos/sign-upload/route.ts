import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { getOptionalSession } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { createSignedUploadUrl } from "@/lib/supabase";
import { CATEGORIAS, type CategoriaValue } from "@/lib/categorias";

const ALLOWED_EXTENSIONS = ["pdf", "docx", "txt"];
const MAX_SIZE_BYTES = 20 * 1024 * 1024;

function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-150);
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

  const body = await req.json().catch(() => null);
  const nomeArquivo = String(body?.nomeArquivo ?? "").trim();
  const categoria = String(body?.categoria ?? "OUTRO");
  const tamanhoBytes = Number(body?.tamanhoBytes ?? 0);

  const extensao = nomeArquivo.toLowerCase().split(".").pop() ?? "";
  if (!nomeArquivo || !ALLOWED_EXTENSIONS.includes(extensao)) {
    return NextResponse.json(
      { error: "Tipo de arquivo não suportado. Envie PDF, DOCX ou TXT." },
      { status: 400 }
    );
  }

  if (!CATEGORIAS.some((c) => c.value === categoria)) {
    return NextResponse.json({ error: "Categoria inválida." }, { status: 400 });
  }

  if (tamanhoBytes > MAX_SIZE_BYTES) {
    return NextResponse.json(
      { error: "Arquivo muito grande (máximo 20MB)." },
      { status: 400 }
    );
  }

  const documentoId = randomUUID();
  const storagePath = `${empreendimentoId}/${documentoId}-${sanitizeFileName(nomeArquivo)}`;

  let signed;
  try {
    signed = await createSignedUploadUrl(storagePath);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Falha ao preparar upload." },
      { status: 500 }
    );
  }

  const documento = await prisma.documento.create({
    data: {
      id: documentoId,
      empreendimentoId,
      nomeArquivo,
      categoria: categoria as CategoriaValue,
      storagePath,
      tamanhoBytes: tamanhoBytes || null,
      status: "PROCESSANDO",
    },
  });

  return NextResponse.json({
    documento,
    signedUrl: signed.signedUrl,
    token: signed.token,
  });
}
