/**
 * Sistema de máscara/formatação de campos.
 *
 * O admin define um "formato" usando "x" para cada posição digitável
 * e qualquer outro caractere (espaço, hífen, ponto, etc.) como separador fixo.
 *
 * Exemplo: formato "xxxx xxxx xxx x" aceita até 12 caracteres digitados
 * pelo usuário e exibe os espaços automaticamente nessas posições.
 */

/** Quantidade máxima de caracteres que o usuário pode digitar, dado um formato. */
export function getMaxChars(format: string): number {
  return (format.match(/x/gi) || []).length;
}

/** Remove os caracteres literais do formato (separadores) do valor, mantendo só o que o usuário digitou. */
export function stripMask(value: string, format: string): string {
  const literals = new Set(
    format.split("").filter((c) => c.toLowerCase() !== "x")
  );
  return value
    .split("")
    .filter((c) => !literals.has(c))
    .join("");
}

/** Aplica o formato a um valor "cru" (sem máscara), reconstruindo os separadores nas posições certas. */
export function applyMask(rawValue: string, format: string): string {
  if (!format) return rawValue;
  const maxChars = getMaxChars(format);
  const chars = rawValue.slice(0, maxChars).split("");
  let result = "";
  let ci = 0;
  for (const fc of format) {
    if (ci >= chars.length) break;
    if (fc.toLowerCase() === "x") {
      result += chars[ci];
      ci++;
    } else {
      result += fc;
    }
  }
  return result;
}

/** Dado um novo valor digitado (já com máscara antiga aplicada ou não), retorna o valor remascarado. */
export function remask(typedValue: string, format: string): string {
  const raw = stripMask(typedValue, format);
  return applyMask(raw, format);
}

/** Valida se o valor preenche exatamente o total de posições exigidas pelo formato. */
export function isComplete(rawValue: string, format: string): boolean {
  return stripMask(rawValue, format).length === getMaxChars(format);
}
