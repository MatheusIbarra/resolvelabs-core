import { activeTranslator } from "@/i18n/active";

/** Dispara o download de um Blob no navegador, sem enviar nada a servidor algum. */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  link.remove();
  // Revogar na hora pode cancelar o download em alguns navegadores.
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

/** "extrato.pdf" -> "extrato" */
export function baseName(filename: string): string {
  return filename.replace(/\.[^./\\]+$/, "") || activeTranslator().t("tools.util.fileFallbackName");
}
