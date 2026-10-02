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

/** CSV/TSV: decodifica (UTF-8 ou Windows-1252) e detecta o separador (; , tab) pela primeira linha. */
export function decodeDelimited(buffer: ArrayBuffer): { text: string; separator: string } {
  let text: string;
  try {
    text = new TextDecoder("utf-8", { fatal: true }).decode(buffer);
  } catch {
    text = new TextDecoder("windows-1252").decode(buffer);
  }
  text = text.replace(/^﻿/, "");
  const firstLine = text.slice(0, 4096).split(/\r?\n/, 1)[0] ?? "";
  const counts = { ";": 0, ",": 0, "\t": 0, "|": 0 };
  let quoted = false;
  for (const ch of firstLine) {
    if (ch === '"') quoted = !quoted;
    else if (!quoted && ch in counts) counts[ch as keyof typeof counts]++;
  }
  const separator = (Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] as string) || ",";
  return { text, separator: counts[separator as keyof typeof counts] === 0 ? "," : separator };
}
