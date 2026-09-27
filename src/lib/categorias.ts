export const CATEGORIAS = [
  { value: "MANUAL_SINDICO", label: "Manual do Síndico" },
  { value: "MANUAL_TECNICO", label: "Manual Técnico" },
  { value: "GARANTIA", label: "Garantia" },
  { value: "PROCEDIMENTO", label: "Procedimento" },
  { value: "MANUTENCAO", label: "Manutenção" },
  { value: "DOCUMENTACAO_CONDOMINIO", label: "Documentação do Condomínio" },
  { value: "OUTRO", label: "Outro" },
] as const;

export type CategoriaValue = (typeof CATEGORIAS)[number]["value"];

export function categoriaLabel(value: string): string {
  return CATEGORIAS.find((c) => c.value === value)?.label ?? value;
}
