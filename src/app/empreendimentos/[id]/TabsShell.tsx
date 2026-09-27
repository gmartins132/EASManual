"use client";

import { useState } from "react";
import type { Documento } from "@prisma/client";
import DocumentosTab from "./DocumentosTab";
import ChatTab, { type Mensagem } from "./ChatTab";

export default function TabsShell({
  empreendimentoId,
  documentosIniciais,
  mensagensIniciais,
}: {
  empreendimentoId: string;
  documentosIniciais: Documento[];
  mensagensIniciais: Mensagem[];
}) {
  const [tab, setTab] = useState<"documentos" | "chat">("chat");

  return (
    <div>
      <div className="mb-6 flex gap-1 rounded-xl bg-slate-200/60 p-1 w-fit">
        <button
          onClick={() => setTab("chat")}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
            tab === "chat"
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          Chat com IA
        </button>
        <button
          onClick={() => setTab("documentos")}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
            tab === "documentos"
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          Documentos ({documentosIniciais.length})
        </button>
      </div>

      {tab === "chat" ? (
        <ChatTab
          empreendimentoId={empreendimentoId}
          mensagensIniciais={mensagensIniciais}
          temDocumentosProntos={documentosIniciais.some((d) => d.status === "PRONTO")}
        />
      ) : (
        <DocumentosTab
          empreendimentoId={empreendimentoId}
          documentosIniciais={documentosIniciais}
        />
      )}
    </div>
  );
}
