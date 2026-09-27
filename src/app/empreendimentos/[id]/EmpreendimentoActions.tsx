"use client";

import { useActionState, useState } from "react";
import type { Empreendimento } from "@prisma/client";
import {
  updateEmpreendimento,
  deleteEmpreendimento,
  type FormState,
} from "@/app/actions/empreendimentos";

export default function EmpreendimentoActions({
  empreendimento,
}: {
  empreendimento: Empreendimento;
}) {
  const [open, setOpen] = useState(false);
  const boundUpdate = updateEmpreendimento.bind(null, empreendimento.id);
  const [state, action, pending] = useActionState<FormState, FormData>(
    boundUpdate,
    undefined
  );

  async function handleDelete() {
    if (
      !confirm(
        `Excluir "${empreendimento.nome}"? Todos os documentos e o histórico de chat serão removidos permanentemente.`
      )
    ) {
      return;
    }
    await deleteEmpreendimento(empreendimento.id);
  }

  return (
    <div className="flex shrink-0 gap-2">
      <button
        onClick={() => setOpen(true)}
        className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
      >
        Editar
      </button>
      <button
        onClick={handleDelete}
        className="rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
      >
        Excluir
      </button>

      {open && (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-slate-900/50 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">
                Editar empreendimento
              </h2>
              <button
                onClick={() => setOpen(false)}
                className="text-slate-400 hover:text-slate-600"
                aria-label="Fechar"
              >
                ✕
              </button>
            </div>

            <form action={action} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Nome *
                </label>
                <input
                  name="nome"
                  required
                  defaultValue={empreendimento.nome}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Endereço
                </label>
                <input
                  name="endereco"
                  defaultValue={empreendimento.endereco ?? ""}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Descrição
                </label>
                <textarea
                  name="descricao"
                  rows={3}
                  defaultValue={empreendimento.descricao ?? ""}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                />
              </div>

              {state?.error && (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
                  {state.error}
                </p>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={pending}
                  className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
                >
                  {pending ? "Salvando..." : "Salvar alterações"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
