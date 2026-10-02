import type { FileKind } from "./types";

const EXTENSIONS: Record<string, FileKind> = {
  xlsx: "spreadsheet", xlsm: "spreadsheet", xls: "spreadsheet", csv: "spreadsheet", tsv: "spreadsheet", ods: "spreadsheet",
  ofx: "ofx", qfx: "ofx",
  xml: "xml",
  json: "json",
  pdf: "pdf",
  png: "image", jpg: "image", jpeg: "image", webp: "image", gif: "image",
};

export const ACCEPT = ".xlsx,.xlsm,.xls,.csv,.tsv,.ods,.ofx,.qfx,.xml,.json,.pdf,.png,.jpg,.jpeg,.webp,.gif";

export const SUPPORTED_LABEL = "Aceitamos XLSX, XLS, CSV, OFX, XML, JSON, PDF, PNG e JPG";

const startsWith = (bytes: Uint8Array, signature: number[]) => signature.every((b, i) => bytes[i] === b);
const ascii = (bytes: Uint8Array, length: number) => String.fromCharCode(...bytes.slice(0, length));

/**
 * Detecta o tipo pela assinatura (magic bytes) e, quando ambígua, pela extensão.
 * A assinatura vence a extensão: um ".csv" que na verdade é PDF é tratado como PDF.
 */
export async function detectKind(file: File): Promise<FileKind | null> {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  const byExtension = EXTENSIONS[ext] ?? null;
  const head = new Uint8Array(await file.slice(0, 2048).arrayBuffer());
  const text = new TextDecoder("latin1").decode(head).replace(/^﻿/, "").trimStart();

  if (startsWith(head, [0x25, 0x50, 0x44, 0x46])) return "pdf"; // %PDF
  if (startsWith(head, [0x89, 0x50, 0x4e, 0x47]) || startsWith(head, [0xff, 0xd8, 0xff]) || ascii(head, 4) === "GIF8") return "image";
  if (ascii(head, 4) === "RIFF" && ascii(head.slice(8), 4) === "WEBP") return "image";
  if (startsWith(head, [0xd0, 0xcf, 0x11, 0xe0])) return "spreadsheet"; // OLE2: .xls
  if (startsWith(head, [0x50, 0x4b, 0x03, 0x04])) return byExtension === "spreadsheet" || !byExtension ? "spreadsheet" : byExtension; // ZIP: xlsx/ods
  if (/^OFXHEADER:/i.test(text) || /<OFX[\s>]/i.test(text)) return "ofx";
  if (byExtension) return byExtension;

  // Sem extensão conhecida: tenta pelo conteúdo.
  if (/^[\[{]/.test(text)) return "json";
  if (/^<\?xml|^<[a-z]/i.test(text)) return "xml";
  return null;
}
