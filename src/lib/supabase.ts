import "server-only";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error("SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórios.");
}

export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false },
});

export const DOCUMENTOS_BUCKET = "documentos";

export async function uploadDocumentoArquivo(
  path: string,
  bytes: Buffer,
  contentType: string
) {
  const { error } = await supabaseAdmin.storage
    .from(DOCUMENTOS_BUCKET)
    .upload(path, bytes, { contentType, upsert: false });
  if (error) {
    throw new Error(`Falha ao enviar arquivo para o storage: ${error.message}`);
  }
}

export async function createSignedUploadUrl(path: string) {
  const { data, error } = await supabaseAdmin.storage
    .from(DOCUMENTOS_BUCKET)
    .createSignedUploadUrl(path);
  if (error || !data) {
    throw new Error(`Falha ao gerar URL de upload: ${error?.message ?? "desconhecido"}`);
  }
  return data;
}

export async function downloadDocumentoArquivo(path: string): Promise<Buffer> {
  const { data, error } = await supabaseAdmin.storage
    .from(DOCUMENTOS_BUCKET)
    .download(path);
  if (error || !data) {
    throw new Error(`Falha ao baixar arquivo do storage: ${error?.message ?? "desconhecido"}`);
  }
  return Buffer.from(await data.arrayBuffer());
}

export async function removeDocumentoArquivo(path: string) {
  const { error } = await supabaseAdmin.storage
    .from(DOCUMENTOS_BUCKET)
    .remove([path]);
  if (error) {
    throw new Error(`Falha ao remover arquivo do storage: ${error.message}`);
  }
}

export async function getDocumentoDownloadUrl(path: string) {
  const { data, error } = await supabaseAdmin.storage
    .from(DOCUMENTOS_BUCKET)
    .createSignedUrl(path, 60 * 10);
  if (error || !data) {
    throw new Error(
      `Falha ao gerar link de download: ${error?.message ?? "desconhecido"}`
    );
  }
  return data.signedUrl;
}
