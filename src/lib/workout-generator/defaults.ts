import type { EquipmentTag } from "@/lib/types";

/**
 * "Não sei / deixe o Movia escolher" assume o cenário mais restritivo:
 * nenhum equipamento. Assim o treino gerado é sempre executável.
 */
export function resolveEquipmentSelection(
  selected: EquipmentTag[],
  unknown: boolean,
): EquipmentTag[] {
  if (unknown) return [];
  if (selected.includes("nenhum")) return [];
  return selected.filter((tag) => tag !== "nenhum");
}

export const SURPRISE_COPY =
  "Você tem 30 minutos, está em casa e não possui equipamentos. Preparei um treino de corpo inteiro de 30 minutos para você.";
