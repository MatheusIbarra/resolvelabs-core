import { loadPdfJs } from "../pdfjs";
import { activeTranslator } from "@/i18n/active";
import { isoPartsToLocal } from "./format";

// --- PDF ------------------------------------------------------------------------------

export interface PdfInfo {
  pages: number;
  /** Tamanho da 1ª página em pontos (1 pt = 1/72 pol). */
  pageSize: { widthPt: number; heightPt: number };
  info: Record<string, string>;
  version?: string;
  flags: { linearized: boolean; form: boolean; xfa: boolean };
  /** Desenha a 1ª página em um canvas, limitando a largura em px de tela. */
  renderFirstPage(canvas: HTMLCanvasElement, maxWidth: number): Promise<void>;
  dispose(): void;
}

export class PdfPasswordError extends Error {
  constructor() {
    super(activeTranslator().t("tools.inspector.pdfPassword"));
    this.name = "PdfPasswordError";
  }
}

/** "D:20261002120000-03'00'" -> "02/10/2026 12:00" */
export function parsePdfDate(raw: string | undefined): string | undefined {
  const m = raw?.match(/^D:(\d{4})(\d{2})?(\d{2})?(\d{2})?(\d{2})?/);
  if (!m) return raw;
  const [, y, mo = "01", d = "01", h, mi] = m;
  return `${isoPartsToLocal(Number(y), Number(mo), Number(d))}${h ? ` ${h}:${mi ?? "00"}` : ""}`;
}

export async function inspectPdf(file: File): Promise<PdfInfo> {
  const pdfjs = await loadPdfJs();
  const task = pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) });
  let doc;
  try {
    doc = await task.promise;
  } catch (err) {
    await task.destroy();
    if (err instanceof Error && err.name === "PasswordException") throw new PdfPasswordError();
    throw err;
  }

  const meta = await doc.getMetadata().catch(() => null);
  const raw = (meta?.info ?? {}) as Record<string, unknown>;
  const info: Record<string, string> = {};
  for (const key of ["Title", "Author", "Subject", "Keywords", "Creator", "Producer"]) {
    if (typeof raw[key] === "string" && raw[key]) info[key] = raw[key] as string;
  }
  const created = parsePdfDate(raw.CreationDate as string | undefined);
  const modified = parsePdfDate(raw.ModDate as string | undefined);
  if (created) info.CreationDate = created;
  if (modified) info.ModDate = modified;

  const first = await doc.getPage(1);
  const base = first.getViewport({ scale: 1 });

  return {
    pages: doc.numPages,
    pageSize: { widthPt: base.width, heightPt: base.height },
    info,
    version: raw.PDFFormatVersion as string | undefined,
    flags: { linearized: Boolean(raw.IsLinearized), form: Boolean(raw.IsAcroFormPresent), xfa: Boolean(raw.IsXFAPresent) },
    async renderFirstPage(canvas, maxWidth) {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const scale = Math.min(maxWidth / base.width, 2) * dpr;
      const viewport = first.getViewport({ scale });
      canvas.width = Math.floor(viewport.width);
      canvas.height = Math.floor(viewport.height);
      canvas.style.width = `${Math.floor(viewport.width / dpr)}px`;
      canvas.style.height = `${Math.floor(viewport.height / dpr)}px`;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error(activeTranslator().t("tools.inspector.canvasUnavailable"));
      await first.render({ canvasContext: ctx, canvas, viewport }).promise;
    },
    dispose() {
      void task.destroy();
    },
  };
}

// --- Imagem -----------------------------------------------------------------------------

export interface ImageInfo {
  width: number;
  height: number;
  megapixels: number;
  aspectRatio: string;
  mime: string;
  previewUrl: string;
}

const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));

export async function inspectImage(file: File): Promise<ImageInfo> {
  const previewUrl = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = previewUrl;
    await img.decode();
    const { naturalWidth: width, naturalHeight: height } = img;
    const g = gcd(width, height) || 1;
    return {
      width,
      height,
      megapixels: (width * height) / 1_000_000,
      aspectRatio: `${width / g}:${height / g}`,
      mime: file.type || "desconhecido",
      previewUrl,
    };
  } catch {
    URL.revokeObjectURL(previewUrl);
    throw new Error(activeTranslator().t("tools.inspector.imageDecode"));
  }
}
