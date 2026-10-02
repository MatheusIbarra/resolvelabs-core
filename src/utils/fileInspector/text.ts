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
