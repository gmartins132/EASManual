import { notFound } from "next/navigation";
import { verifySession } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import AppHeader from "@/components/AppHeader";
import EmpreendimentoActions from "./EmpreendimentoActions";
import TabsShell from "./TabsShell";
import type { FonteResposta } from "@/lib/chat";

export default async function EmpreendimentoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await verifySession();
  const { id } = await params;

  const empreendimento = await prisma.empreendimento.findUnique({
    where: { id },
  });

  if (!empreendimento) {
    notFound();
  }

  const [documentos, mensagensRaw] = await Promise.all([
    prisma.documento.findMany({
      where: { empreendimentoId: id },
      orderBy: { createdAt: "desc" },
    }),
    prisma.mensagem.findMany({
      where: { empreendimentoId: id },
      orderBy: { createdAt: "asc" },
      take: 100,
    }),
  ]);

  const mensagens = mensagensRaw.map((m) => ({
    id: m.id,
    role: m.role as "user" | "assistant",
    conteudo: m.conteudo,
    fontes: m.fontes ? (JSON.parse(m.fontes) as FonteResposta[]) : [],
  }));

  return (
    <div className="min-h-screen">
      <AppHeader email={session.email} />

      <main className="mx-auto max-w-5xl px-6 py-10">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">
              {empreendimento.nome}
            </h1>
            {empreendimento.endereco && (
              <p className="mt-1 text-sm text-slate-500">
                {empreendimento.endereco}
              </p>
            )}
            {empreendimento.descricao && (
              <p className="mt-2 max-w-2xl text-sm text-slate-600">
                {empreendimento.descricao}
              </p>
            )}
          </div>
          <EmpreendimentoActions empreendimento={empreendimento} />
        </div>

        <TabsShell
          empreendimentoId={id}
          documentosIniciais={documentos}
          mensagensIniciais={mensagens}
        />
      </main>
    </div>
  );
}
