/** Decodifica texto respeitando o encoding declarado em XML (`<?xml encoding="ISO-8859-1"?>`); padrão UTF-8. */
export function decodeText(buffer: ArrayBuffer): string {
  const probe = new TextDecoder("latin1").decode(buffer.slice(0, 200));
  const declared = probe.match(/<\?xml[^>]*encoding=["']([\w-]+)["']/i)?.[1];
  if (declared && !/^utf-?8$/i.test(declared)) {
    try {
      return new TextDecoder(declared).decode(buffer);
    } catch {
      // encoding desconhecido: segue para UTF-8
    }
  }
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(buffer);
  } catch {
    return new TextDecoder("windows-1252").decode(buffer);
  }
}

/** Conta, por linha, as ocorrências de cada separador fora de aspas. */
function separatorCounts(line: string): Record<string, number> {
  const counts: Record<string, number> = { ";": 0, ",": 0, "\t": 0, "|": 0 };
  let quoted = false;
  for (const ch of line) {
    if (ch === '"') quoted = !quoted;
    else if (!quoted && ch in counts) counts[ch]++;
  }
  return counts;
}

/**
 * Escolhe o separador pelo conjunto das primeiras linhas, não só pela primeira: extratos de banco costumam abrir com
 * títulos sem separador ("Extrato Conta Corrente") antes da tabela. Vence o separador cuja contagem se repete em mais linhas.
 * Em empate, prefere tab, ponto e vírgula e barra vertical à vírgula (que também aparece dentro de números como 1.234,56).
 */
export function detectSeparator(text: string): string {
  const lines = text.split(/\r?\n/).filter((l) => l.trim() !== "").slice(0, 40);
  let best = ",";
  let bestScore = 0;
  for (const sep of ["\t", ";", "|", ","]) {
    const perLine = lines.map((l) => separatorCounts(l)[sep]).filter((n) => n > 0);
    const freq = new Map<number, number>();
    for (const n of perLine) freq.set(n, (freq.get(n) ?? 0) + 1);
    for (const [count, lineCount] of freq) {
      const score = lineCount * count;
      if (score > bestScore) {
        bestScore = score;
        best = sep;
      }
    }
  }
  return best;
}

/** CSV/TSV: decodifica (UTF-8 ou Windows-1252) e detecta o separador (; , tab |). */
export function decodeDelimited(buffer: ArrayBuffer): { text: string; separator: string } {
  let text: string;
  try {
    text = new TextDecoder("utf-8", { fatal: true }).decode(buffer);
  } catch {
    text = new TextDecoder("windows-1252").decode(buffer);
  }
  text = text.replace(/^\uFEFF/, "");
  return { text, separator: detectSeparator(text) };
}
