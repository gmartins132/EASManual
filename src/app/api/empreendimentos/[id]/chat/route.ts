import { NextRequest, NextResponse } from "next/server";
import { getOptionalSession } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { answerQuestion } from "@/lib/chat";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const session = await getOptionalSession();
  if (!session) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const { id: empreendimentoId } = await ctx.params;
  const body = await req.json().catch(() => null);
  const pergunta = String(body?.pergunta ?? "").trim();

  if (!pergunta) {
    return NextResponse.json({ error: "Pergunta vazia." }, { status: 400 });
  }

  const empreendimento = await prisma.empreendimento.findUnique({
    where: { id: empreendimentoId },
  });
  if (!empreendimento) {
    return NextResponse.json(
      { error: "Empreendimento não encontrado." },
      { status: 404 }
    );
  }

  await prisma.mensagem.create({
    data: { empreendimentoId, role: "user", conteudo: pergunta },
  });

  try {
    const { resposta, fontes } = await answerQuestion(empreendimentoId, pergunta);

    await prisma.mensagem.create({
      data: {
        empreendimentoId,
        role: "assistant",
        conteudo: resposta,
        fontes: JSON.stringify(fontes),
      },
    });

    return NextResponse.json({ resposta, fontes });
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "Falha ao consultar a IA. Tente novamente.",
      },
      { status: 500 }
    );
  }
}
