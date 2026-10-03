import { activeTranslator } from "@/i18n/active";
/**
 * Processamento de imagens em lote 100% no navegador (Canvas): redimensiona, converte para WebP/JPEG,
 * aplica marca d'água (texto e/ou logo) e compacta tudo em um .zip. Nenhuma imagem sai da máquina do usuário.
 */

export type OutputMime = "image/webp" | "image/jpeg";

export interface ImageProcessOptions {
  /** Largura máxima em px (mantém a proporção; nunca amplia). `null` = sem redimensionar. */
  maxWidth: number | null;
  /** 0 a 1. */
  quality: number;
  mimeType: OutputMime;
  /** Texto no canto inferior direito (ex.: "RESOLVELABS"). Vazio = sem texto. */
  watermarkText?: string;
  /** Logo (ex.: PNG com transparência), desenhada acima do texto, no canto inferior direito. */
  watermarkLogo?: ImageBitmap | HTMLImageElement | null;
  /** 0 a 1. */
  watermarkOpacity: number;
}

export interface ProcessedImage {
  name: string;
  blob: Blob;
  width: number;
  height: number;
  originalBytes: number;
}

export interface BatchResult {
  zip: Blob;
  images: ProcessedImage[];
  originalBytes: number;
  outputBytes: number;
  /** Redução total de tamanho em %, ex.: 62 (pode ser negativa se o resultado ficou maior). */
  reductionPercent: number;
}

export const DEFAULT_OPTIONS: ImageProcessOptions = {
  maxWidth: 1200,
  quality: 0.8,
  mimeType: "image/webp",
  watermarkText: "RESOLVELABS",
  watermarkLogo: null,
  watermarkOpacity: 0.5,
};

const EXTENSION: Record<string, string> = { "image/webp": "webp", "image/jpeg": "jpg", "image/png": "png" };

type Drawable = ImageBitmap | HTMLImageElement;

async function decodeImage(file: File): Promise<Drawable> {
  if (typeof createImageBitmap === "function") {
    try {
      return await createImageBitmap(file, { imageOrientation: "from-image" }); // respeita a rotação EXIF
    } catch {
      // formato não suportado pelo createImageBitmap: tenta via <img>
    }
  }
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.decoding = "async";
    img.src = url;
    await img.decode();
    return img;
  } finally {
    URL.revokeObjectURL(url);
  }
}

const sizeOf = (d: Drawable) => ({
  width: "naturalWidth" in d ? d.naturalWidth : d.width,
  height: "naturalHeight" in d ? d.naturalHeight : d.height,
});

function drawWatermark(ctx: CanvasRenderingContext2D, width: number, height: number, options: ImageProcessOptions) {
  const opacity = Math.min(Math.max(options.watermarkOpacity, 0), 1);
  if (opacity === 0) return;
  const margin = Math.max(12, Math.round(width * 0.02));
  let bottom = height - margin;

  ctx.save();
  ctx.globalAlpha = opacity;

  const text = options.watermarkText?.trim();
  if (text) {
    const fontSize = Math.max(14, Math.round(width * 0.03));
    ctx.font = `700 ${fontSize}px system-ui, -apple-system, "Segoe UI", Arial, sans-serif`;
    ctx.textAlign = "right";
    ctx.textBaseline = "alphabetic";
    ctx.lineJoin = "round";
    ctx.lineWidth = Math.max(2, fontSize / 8);
    ctx.strokeStyle = "rgba(0, 0, 0, 0.55)"; // contorno: legível em fundo claro e escuro
    ctx.strokeText(text, width - margin, bottom);
    ctx.fillStyle = "#ffffff";
    ctx.fillText(text, width - margin, bottom);
    bottom -= fontSize + margin / 2;
  }

  const logo = options.watermarkLogo;
  if (logo) {
    const { width: lw, height: lh } = sizeOf(logo);
    const targetW = Math.min(width * 0.2, lw);
    const targetH = (targetW / lw) * lh;
    ctx.drawImage(logo, width - margin - targetW, bottom - targetH, targetW, targetH);
  }
  ctx.restore();
}

function canvasToBlob(canvas: HTMLCanvasElement, mimeType: string, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) =>
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error(activeTranslator().t("tools.images.canvasBlob")))), mimeType, quality),
  );
}

/** Processa uma imagem: redimensiona, aplica a marca d'água e converte. */
export async function processImage(file: File, options: ImageProcessOptions = DEFAULT_OPTIONS): Promise<ProcessedImage> {
  const source = await decodeImage(file);
  try {
    const { width: sw, height: sh } = sizeOf(source);
    const scale = options.maxWidth && sw > options.maxWidth ? options.maxWidth / sw : 1;
    const width = Math.max(1, Math.round(sw * scale));
    const height = Math.max(1, Math.round(sh * scale));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error(activeTranslator().t("tools.images.canvasUnsupported"));

    if (options.mimeType === "image/jpeg") {
      ctx.fillStyle = "#ffffff"; // JPEG não tem transparência
      ctx.fillRect(0, 0, width, height);
    }
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(source, 0, 0, width, height);
    drawWatermark(ctx, width, height, options);

    let blob = await canvasToBlob(canvas, options.mimeType, options.quality);
    // Navegadores sem suporte a WebP devolvem PNG: usa o tipo realmente gerado para nomear o arquivo.
    const actualMime = blob.type || options.mimeType;
    const ext = EXTENSION[actualMime] ?? "png";
    blob = blob.type === actualMime ? blob : new Blob([blob], { type: actualMime });

    const base = file.name.replace(/\.[^./\\]+$/, "") || "imagem";
    return { name: `${base}.${ext}`, blob, width, height, originalBytes: file.size };
  } finally {
    if ("close" in source) source.close();
  }
}

/** Nomes repetidos viram "foto.webp", "foto-2.webp"... */
function uniqueName(name: string, used: Set<string>): string {
  if (!used.has(name)) return used.add(name), name;
  const dot = name.lastIndexOf(".");
  const stem = dot > 0 ? name.slice(0, dot) : name;
  const ext = dot > 0 ? name.slice(dot) : "";
  for (let n = 2; ; n++) {
    const candidate = `${stem}-${n}${ext}`;
    if (!used.has(candidate)) return used.add(candidate), candidate;
  }
}

/** Processa todas as imagens (uma por vez, para limitar o uso de memória) e gera o .zip. */
export async function processImagesToZip(
  files: File[],
  options: ImageProcessOptions = DEFAULT_OPTIONS,
  onProgress?: (done: number, total: number) => void,
): Promise<BatchResult> {
  const { default: JSZip } = await import("jszip");
  const zip = new JSZip();
  const used = new Set<string>();
  const images: ProcessedImage[] = [];

  for (let i = 0; i < files.length; i++) {
    const processed = await processImage(files[i], options);
    processed.name = uniqueName(processed.name, used);
    zip.file(processed.name, processed.blob);
    images.push(processed);
    onProgress?.(i + 1, files.length);
    // Cede o fio principal para a interface continuar responsiva.
    await new Promise((resolve) => setTimeout(resolve, 0));
  }

  // Imagens já estão comprimidas: STORE evita gastar CPU à toa.
  const zipBlob = await zip.generateAsync({ type: "blob", compression: "STORE" });
  const originalBytes = images.reduce((n, img) => n + img.originalBytes, 0);
  const outputBytes = images.reduce((n, img) => n + img.blob.size, 0);
  return {
    zip: zipBlob,
    images,
    originalBytes,
    outputBytes,
    reductionPercent: originalBytes ? Math.round((1 - outputBytes / originalBytes) * 100) : 0,
  };
}

/** Carrega a logo (PNG) escolhida pelo usuário para uso como marca d'água. */
export async function loadWatermarkLogo(file: File): Promise<Drawable> {
  return decodeImage(file);
}
