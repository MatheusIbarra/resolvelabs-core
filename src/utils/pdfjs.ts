export type PdfJs = typeof import("pdfjs-dist");

let pdfjsPromise: Promise<PdfJs> | null = null;

/**
 * Carrega o pdf.js só quando necessário (e só no navegador). Usa o build "legacy", que roda em
 * navegadores mais antigos (ex.: Safari 15-17); o build moderno exige recursos recentes.
 */
export function loadPdfJs(): Promise<PdfJs> {
  pdfjsPromise ??= import("pdfjs-dist/legacy/build/pdf.mjs").then((pdfjs) => {
    pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/legacy/build/pdf.worker.min.mjs", import.meta.url).toString();
    return pdfjs as PdfJs;
  });
  return pdfjsPromise;
}
