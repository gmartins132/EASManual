import { NextRequest, NextResponse } from "next/server";
import { getOptionalSession } from "@/lib/dal";
import { prisma } from "@/lib/prisma";

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
