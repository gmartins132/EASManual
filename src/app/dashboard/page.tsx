import Link from "next/link";
import { verifySession } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import AppHeader from "@/components/AppHeader";
import NovoEmpreendimentoModal from "./NovoEmpreendimentoModal";

export default async function DashboardPage() {
  const session = await verifySession();

  const empreendimentos = await prisma.empreendimento.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { documentos: true } } },
  });

  return (
    <div className="min-h-screen">
      <AppHeader email={session.email} />

      <main className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">
              Empreendimentos
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Selecione um empreendimento para gerenciar documentos ou conversar com a IA.
            </p>
          </div>
          <NovoEmpreendimentoModal />
        </div>

        {empreendimentos.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white/60 py-20 text-center">
            <p className="text-slate-500">
              Nenhum empreendimento cadastrado ainda.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {empreendimentos.map((emp) => (
              <Link
                key={emp.id}
                href={`/empreendimentos/${emp.id}`}
                className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-700 group-hover:bg-slate-900 group-hover:text-white transition">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="h-5 w-5"
                  >
                    <path d="M3 21V8l9-5 9 5v13h-6v-7H9v7H3z" />
                  </svg>
                </div>
                <h2 className="text-base font-semibold text-slate-900">
                  {emp.nome}
                </h2>
                {emp.endereco && (
                  <p className="mt-1 text-sm text-slate-500 line-clamp-1">
                    {emp.endereco}
                  </p>
                )}
                <p className="mt-4 text-xs font-medium text-slate-400">
                  {emp._count.documentos} documento
                  {emp._count.documentos === 1 ? "" : "s"}
                </p>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
