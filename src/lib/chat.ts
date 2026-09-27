import "server-only";
import { openai, embedText, CHAT_MODEL } from "@/lib/openai";
import { retrieveRelevantChunks } from "@/lib/rag";

const SYSTEM_PROMPT = `Você é o assistente virtual de um empreendimento imobiliário, usado por síndicos e moradores.
Responda SOMENTE com base nos trechos de documentos fornecidos abaixo no contexto. Não utilize nenhum conhecimento externo.
Se a resposta não estiver claramente presente no contexto, diga explicitamente que não encontrou essa informação nos documentos deste empreendimento e sugira contatar a construtora.
Sempre que possível, cite o nome do documento de onde veio a informação.
Responda em português do Brasil, de forma clara, objetiva e profissional.`;

export type FonteResposta = {
  nomeArquivo: string;
  trecho: string;
};

export async function answerQuestion(
  empreendimentoId: string,
  pergunta: string
): Promise<{ resposta: string; fontes: FonteResposta[] }> {
  const queryEmbedding = await embedText(pergunta);
  const chunks = await retrieveRelevantChunks(empreendimentoId, queryEmbedding, 6);

  if (chunks.length === 0) {
    return {
      resposta:
        "Ainda não há documentos processados para este empreendimento. Assim que os documentos forem enviados e processados, poderei responder com base neles.",
      fontes: [],
    };
  }

  const contexto = chunks
    .map(
      (c, i) => `[Trecho ${i + 1} - Documento: ${c.nomeArquivo}]\n${c.conteudo}`
    )
    .join("\n\n---\n\n");

  const completion = await openai.chat.completions.create({
    model: CHAT_MODEL,
    temperature: 0.2,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: `Contexto (trechos extraídos dos documentos deste empreendimento):\n\n${contexto}\n\n---\n\nPergunta do usuário: ${pergunta}`,
      },
    ],
  });

  const resposta =
    completion.choices[0]?.message?.content?.trim() ??
    "Não foi possível gerar uma resposta no momento.";

  const fontesUnicas = new Map<string, FonteResposta>();
  for (const c of chunks) {
    if (!fontesUnicas.has(c.nomeArquivo)) {
      fontesUnicas.set(c.nomeArquivo, {
        nomeArquivo: c.nomeArquivo,
        trecho: c.conteudo.slice(0, 220),
      });
    }
  }

  return { resposta, fontes: Array.from(fontesUnicas.values()) };
}
