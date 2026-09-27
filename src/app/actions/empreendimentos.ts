"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/dal";
import { removeDocumentoArquivo } from "@/lib/supabase";

export type FormState = { error?: string } | undefined;

const empreendimentoSchema = z.object({
  nome: z.string().trim().min(2, "Informe o nome do empreendimento."),
  endereco: z.string().trim().optional(),
  descricao: z.string().trim().optional(),
});

export async function createEmpreendimento(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  await verifySession();

  const parsed = empreendimentoSchema.safeParse({
    nome: formData.get("nome"),
    endereco: formData.get("endereco"),
    descricao: formData.get("descricao"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const empreendimento = await prisma.empreendimento.create({
    data: {
      nome: parsed.data.nome,
      endereco: parsed.data.endereco || null,
      descricao: parsed.data.descricao || null,
    },
  });

  revalidatePath("/dashboard");
  redirect(`/empreendimentos/${empreendimento.id}`);
}

export async function updateEmpreendimento(
  empreendimentoId: string,
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  await verifySession();

  const parsed = empreendimentoSchema.safeParse({
    nome: formData.get("nome"),
    endereco: formData.get("endereco"),
    descricao: formData.get("descricao"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  await prisma.empreendimento.update({
    where: { id: empreendimentoId },
    data: {
      nome: parsed.data.nome,
      endereco: parsed.data.endereco || null,
      descricao: parsed.data.descricao || null,
    },
  });

  revalidatePath("/dashboard");
  revalidatePath(`/empreendimentos/${empreendimentoId}`);
  return { error: undefined };
}

export async function deleteEmpreendimento(empreendimentoId: string) {
  await verifySession();

  const documentos = await prisma.documento.findMany({
    where: { empreendimentoId },
    select: { storagePath: true },
  });

  await Promise.all(
    documentos.map((d) =>
      removeDocumentoArquivo(d.storagePath).catch(() => undefined)
    )
  );

  await prisma.empreendimento.delete({ where: { id: empreendimentoId } });

  revalidatePath("/dashboard");
  redirect("/dashboard");
}

export async function deleteDocumento(
  empreendimentoId: string,
  documentoId: string
) {
  await verifySession();

  const documento = await prisma.documento.findUnique({
    where: { id: documentoId },
  });

  if (!documento || documento.empreendimentoId !== empreendimentoId) {
    throw new Error("Documento não encontrado.");
  }

  await removeDocumentoArquivo(documento.storagePath).catch(() => undefined);
  await prisma.documento.delete({ where: { id: documentoId } });

  revalidatePath(`/empreendimentos/${empreendimentoId}`);
}
