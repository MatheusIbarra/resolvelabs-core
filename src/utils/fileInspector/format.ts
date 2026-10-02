export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB"];
  let value = bytes / 1024;
  let i = 0;
  while (value >= 1024 && i < units.length - 1) {
    value /= 1024;
    i++;
  }
  return `${value.toFixed(value >= 100 ? 0 : 1)} ${units[i]}`;
}

export const formatNumber = (n: number) => n.toLocaleString("pt-BR");

export const formatMoney = (n: number, currency = "BRL") =>
  n.toLocaleString("pt-BR", { style: "currency", currency: /^[A-Z]{3}$/.test(currency) ? currency : "BRL" });

/** "2026-10-02" -> "02/10/2026" */
export function formatIsoDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : iso;
}

/** Letras de coluna estilo Excel: 0 -> A, 25 -> Z, 26 -> AA */
export function columnLabel(index: number): string {
  let n = index;
  let label = "";
  do {
    label = String.fromCharCode(65 + (n % 26)) + label;
    n = Math.floor(n / 26) - 1;
  } while (n >= 0);
  return label;
}
