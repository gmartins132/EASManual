"use client";

import { useRef, useState, useTransition } from "react";
import type { Documento } from "@prisma/client";
import { CATEGORIAS, categoriaLabel } from "@/lib/categorias";
import { deleteDocumento } from "@/app/actions/empreendimentos";
import { supabaseBrowser, DOCUMENTOS_BUCKET } from "@/lib/supabaseBrowser";

const ALLOWED_EXTENSIONS = ["pdf", "docx", "txt"];
const MAX_SIZE_BYTES = 20 * 1024 * 1024;

const STATUS_STYLES: Record<string, string> = {
  PRONTO: "bg-emerald-50 text-emerald-700",
  PROCESSANDO: "bg-amber-50 text-amber-700",
  ERRO: "bg-red-50 text-red-700",
};

const STATUS_LABEL: Record<string, string> = {
  PRONTO: "Pronto",
  PROCESSANDO: "Processando",
  ERRO: "Erro",
};

function formatBytes(bytes: number | null) {
  if (!bytes) return "";
  const mb = bytes / (1024 * 1024);
  return mb >= 1 ? `${mb.toFixed(1)} MB` : `${(bytes / 1024).toFixed(0)} KB`;
}

export default function DocumentosTab({
  empreendimentoId,
  documentosIniciais,
}: {
  empreendimentoId: string;
  documentosIniciais: Documento[];
}) {
  const [documentos, setDocumentos] = useState(documentosIniciais);
  const [categoria, setCategoria] = useState<string>("MANUAL_SINDICO");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [, startTransition] = useTransition();

  async function handleUpload(files: FileList | null) {
    if (!files || files.length === 0) return;
    setError(null);
    setUploading(true);

    for (const file of Array.from(files)) {
      const extensao = file.name.toLowerCase().split(".").pop() ?? "";
      if (!ALLOWED_EXTENSIONS.includes(extensao)) {
        setError(`"${file.name}": formato não suportado. Envie PDF, DOCX ou TXT.`);
        continue;
      }
      if (file.size > MAX_SIZE_BYTES) {
        setError(`"${file.name}": arquivo muito grande (máximo 20MB).`);
        continue;
      }

      try {
        // 1. Pede uma URL assinada para o navegador enviar o arquivo direto ao
        // Storage (evita o limite de tamanho de requisição das funções serverless).
        const signRes = await fetch(
          `/api/empreendimentos/${empreendimentoId}/documentos/sign-upload`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              nomeArquivo: file.name,
              categoria,
              tamanhoBytes: file.size,
            }),
          }
        );
        const signData = await signRes.json();
        if (!signRes.ok) {
          setError(signData.error ?? `Falha ao preparar envio de "${file.name}".`);
          continue;
        }

        setDocumentos((prev) => [signData.documento, ...prev]);

        // 2. Envia o arquivo direto para o Supabase Storage.
        const { error: uploadError } = await supabaseBrowser.storage
          .from(DOCUMENTOS_BUCKET)
          .uploadToSignedUrl(signData.documento.storagePath, signData.token, file);

        if (uploadError) {
          setError(`Falha ao enviar "${file.name}" para o armazenamento.`);
          continue;
        }

        // 3. Aciona o processamento (extração de texto + embeddings) no servidor.
        const processRes = await fetch(
          `/api/empreendimentos/${empreendimentoId}/documentos/${signData.documento.id}/process`,
          { method: "POST" }
        );
        const processData = await processRes.json();
        if (processData.documento) {
          setDocumentos((prev) =>
            prev.map((d) => (d.id === processData.documento.id ? processData.documento : d))
          );
        }
        if (!processRes.ok) {
          setError(processData.error ?? `Falha ao processar "${file.name}".`);
        }
      } catch {
        setError(`Falha ao enviar "${file.name}".`);
      }
    }

    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function handleDelete(documentoId: string) {
    if (!confirm("Excluir este documento? Ele deixará de ser usado no chat.")) return;
    setDocumentos((prev) => prev.filter((d) => d.id !== documentoId));
    startTransition(() => {
      deleteDocumento(empreendimentoId, documentoId).catch(() => {
        setError("Falha ao excluir o documento.");
      });
    });
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <h3 className="mb-3 text-sm font-semibold text-slate-900">
          Enviar novo documento
        </h3>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <select
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
          >
            {CATEGORIAS.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>

          <label className="flex-1">
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx,.txt"
              multiple
              disabled={uploading}
              onChange={(e) => handleUpload(e.target.files)}
              className="block w-full cursor-pointer rounded-lg border border-dashed border-slate-300 px-3 py-2 text-sm text-slate-500 file:mr-3 file:rounded-md file:border-0 file:bg-slate-900 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-white hover:file:bg-slate-800"
            />
          </label>
        </div>
        <p className="mt-2 text-xs text-slate-400">
          Formatos aceitos: PDF, DOCX, TXT. Tamanho máximo 20MB por arquivo.
        </p>
        {uploading && (
          <p className="mt-3 text-sm text-amber-600">Enviando e processando...</p>
        )}
        {error && (
          <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
            {error}
          </p>
        )}
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        {documentos.length === 0 ? (
          <p className="p-8 text-center text-sm text-slate-500">
            Nenhum documento enviado para este empreendimento ainda.
          </p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-3 font-medium">Arquivo</th>
                <th className="px-5 py-3 font-medium">Categoria</th>
                <th className="px-5 py-3 font-medium">Tamanho</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {documentos.map((doc) => (
                <tr key={doc.id}>
                  <td className="px-5 py-3 font-medium text-slate-800">
                    {doc.nomeArquivo}
                  </td>
                  <td className="px-5 py-3 text-slate-500">
                    {categoriaLabel(doc.categoria)}
                  </td>
                  <td className="px-5 py-3 text-slate-500">
                    {formatBytes(doc.tamanhoBytes)}
                  </td>
                  <td className="px-5 py-3">
                    <span
                      title={doc.erro ?? undefined}
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLES[doc.status] ?? ""}`}
                    >
                      {STATUS_LABEL[doc.status] ?? doc.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <button
                      onClick={() => handleDelete(doc.id)}
                      className="text-xs font-medium text-red-500 hover:text-red-700"
                    >
                      Excluir
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
