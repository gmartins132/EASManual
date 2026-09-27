"use client";

import { useEffect, useRef, useState } from "react";

export type Mensagem = {
  id: string;
  role: "user" | "assistant";
  conteudo: string;
  fontes: { nomeArquivo: string; trecho: string }[];
};

export default function ChatTab({
  empreendimentoId,
  mensagensIniciais,
  temDocumentosProntos,
}: {
  empreendimentoId: string;
  mensagensIniciais: Mensagem[];
  temDocumentosProntos: boolean;
}) {
  const [mensagens, setMensagens] = useState(mensagensIniciais);
  const [pergunta, setPergunta] = useState("");
  const [enviando, setEnviando] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensagens, enviando]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const texto = pergunta.trim();
    if (!texto || enviando) return;

    const tempId = `local-${Date.now()}`;
    setMensagens((prev) => [
      ...prev,
      { id: tempId, role: "user", conteudo: texto, fontes: [] },
    ]);
    setPergunta("");
    setEnviando(true);

    try {
      const res = await fetch(`/api/empreendimentos/${empreendimentoId}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pergunta: texto }),
      });
      const data = await res.json();

      if (!res.ok) {
        setMensagens((prev) => [
          ...prev,
          {
            id: `${tempId}-err`,
            role: "assistant",
            conteudo: data.error ?? "Não foi possível responder agora.",
            fontes: [],
          },
        ]);
      } else {
        setMensagens((prev) => [
          ...prev,
          {
            id: `${tempId}-resp`,
            role: "assistant",
            conteudo: data.resposta,
            fontes: data.fontes ?? [],
          },
        ]);
      }
    } catch {
      setMensagens((prev) => [
        ...prev,
        {
          id: `${tempId}-err`,
          role: "assistant",
          conteudo: "Não foi possível conectar ao servidor. Tente novamente.",
          fontes: [],
        },
      ]);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="flex h-[65vh] flex-col rounded-2xl border border-slate-200 bg-white">
      <div className="flex-1 space-y-4 overflow-y-auto p-6">
        {mensagens.length === 0 && (
          <div className="flex h-full items-center justify-center text-center">
            <p className="max-w-sm text-sm text-slate-400">
              {temDocumentosProntos
                ? "Pergunte algo sobre este empreendimento, por exemplo: \"Qual o procedimento para acionar a garantia de infiltração?\""
                : "Envie documentos na aba \"Documentos\" para que a IA possa responder perguntas sobre este empreendimento."}
            </p>
          </div>
        )}

        {mensagens.map((m) => (
          <div
            key={m.id}
            className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm whitespace-pre-wrap ${
                m.role === "user"
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-800"
              }`}
            >
              {m.conteudo}
              {m.fontes.length > 0 && (
                <div className="mt-2 border-t border-slate-300/40 pt-2 text-xs opacity-80">
                  Fontes: {m.fontes.map((f) => f.nomeArquivo).join(", ")}
                </div>
              )}
            </div>
          </div>
        ))}

        {enviando && (
          <div className="flex justify-start">
            <div className="rounded-2xl bg-slate-100 px-4 py-3 text-sm text-slate-400">
              Pensando...
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <form
        onSubmit={handleSubmit}
        className="flex items-center gap-3 border-t border-slate-200 p-4"
      >
        <input
          value={pergunta}
          onChange={(e) => setPergunta(e.target.value)}
          placeholder="Digite sua pergunta sobre este empreendimento..."
          className="flex-1 rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
        />
        <button
          type="submit"
          disabled={enviando || !pergunta.trim()}
          className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-50"
        >
          Enviar
        </button>
      </form>
    </div>
  );
}
