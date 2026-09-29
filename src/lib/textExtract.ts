import "server-only";
// Import the internal module directly (not the package root) to avoid pdf-parse's
// debug-mode check, which otherwise tries to read a bundled sample PDF on first
// import and crashes in serverless/bundled environments where `module.parent` is
// undefined. See: https://gitlab.com/autokent/pdf-parse/-/issues/24
import pdfParse from "pdf-parse/lib/pdf-parse.js";
import mammoth from "mammoth";

export async function extractText(
  buffer: Buffer,
  mimeType: string
): Promise<string> {
  if (mimeType === "application/pdf") {
    const result = await pdfParse(buffer);
    return result.text;
  }

  if (
    mimeType ===
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    const { value } = await mammoth.extractRawText({ buffer });
    return value;
  }

  if (mimeType === "text/plain") {
    return buffer.toString("utf-8");
  }

  throw new Error(`Tipo de arquivo não suportado: ${mimeType}`);
}

const EXTENSION_TO_MIME: Record<string, string> = {
  pdf: "application/pdf",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  txt: "text/plain",
};

export function mimeTypeFromFileName(nomeArquivo: string): string {
  const ext = nomeArquivo.toLowerCase().split(".").pop() ?? "";
  const mimeType = EXTENSION_TO_MIME[ext];
  if (!mimeType) {
    throw new Error("Extensão de arquivo não suportada. Envie PDF, DOCX ou TXT.");
  }
  return mimeType;
}
