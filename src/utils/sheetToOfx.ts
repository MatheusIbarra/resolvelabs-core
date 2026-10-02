/**
 * Planilha (CSV/XLSX) -> lançamentos para OFX, 100% no navegador.
 * A leitura usa o SheetJS (já presente no projeto, lê CSV e Excel); a geração do OFX reaproveita o `buildOfx` do conversor de PDF.
 */
import { decodeDelimited } from "./fileInspector/text";
import type { BankTransaction } from "./pdfToOfx";

export const MAX_FILE_BYTES = 20 * 1024 * 1024;
export const MAX_ROWS = 50_000;
export const ACCEPT = ".csv,.tsv,.txt,.xlsx,.xlsm,.xls,.ods";

export type Cell = string | number | boolean | Date | null | undefined;

export interface SheetData {
  name: string;
  /** Linhas retangulares com os valores brutos (números do Excel continuam números). */
  rows: Cell[][];
}

export class SheetReadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SheetReadError";
  }
}

const isDelimited = (name: string) => /\.(csv|tsv|txt)$/i.test(name);

export interface Workbook {
  sheets: SheetData[];
  /** Converte número serial do Excel em ano/mês/dia (sem fuso). */
  serialToParts: (serial: number) => { y: number; m: number; d: number } | null;
}

/** Lê todas as abas. O SheetJS só é carregado quando o usuário escolhe um arquivo. */
export async function readSheets(file: File): Promise<Workbook> {
  if (file.size > MAX_FILE_BYTES) throw new SheetReadError(`Arquivo grande demais. O limite é ${MAX_FILE_BYTES / 1024 / 1024} MB.`);
  const XLSX = await import("xlsx");
  const buffer = await file.arrayBuffer();
  let workbook;
  try {
    if (isDelimited(file.name)) {
      const { text, separator } = decodeDelimited(buffer);
      // raw: true mantém "01/02/2026" como texto (o SheetJS leria como data americana m/d).
      workbook = XLSX.read(text, { type: "string", FS: separator, raw: true } as import("xlsx").ParsingOptions);
    } else {
      workbook = XLSX.read(buffer, { type: "array" });
    }
  } catch {
    throw new SheetReadError("Não foi possível ler este arquivo. Confira se é uma planilha CSV ou Excel válida.");
  }

  const sheets: SheetData[] = [];
  for (const name of workbook.SheetNames) {
    const ws = workbook.Sheets[name];
    if (!ws?.["!ref"]) continue;
    const rows = XLSX.utils.sheet_to_json<Cell[]>(ws, { header: 1, raw: true, defval: "", blankrows: false });
    if (rows.length === 0) continue;
    if (rows.length > MAX_ROWS + 1) throw new SheetReadError(`A planilha "${name}" tem mais de ${MAX_ROWS.toLocaleString("pt-BR")} linhas. Divida o arquivo.`);
    const width = Math.max(...rows.map((r) => r.length));
    sheets.push({ name, rows: rows.map((r) => Array.from({ length: width }, (_, c) => r[c] ?? "")) });
  }
  if (sheets.length === 0) throw new SheetReadError("A planilha está vazia.");
  const serialToParts = (serial: number) => {
    const p = XLSX.SSF.parse_date_code(serial);
    return p ? { y: p.y, m: p.m, d: p.d } : null;
  };
  return { sheets, serialToParts };
}

// --- Cabeçalhos e mapeamento -----------------------------------------------------

export interface Mapping {
  date: number | null;
  description: number | null;
  /** Coluna única de valor (negativo = saída). */
  amount: number | null;
  /** Colunas separadas (opcional): débito vira saída e crédito vira entrada. */
  debit: number | null;
  credit: number | null;
}

export type AmountMode = "single" | "split";
export type NumberFormat = "auto" | "br" | "us";

export function columnLabel(index: number): string {
  let n = index;
  let label = "";
  do {
    label = String.fromCharCode(65 + (n % 26)) + label;
    n = Math.floor(n / 26) - 1;
  } while (n >= 0);
  return label;
}

const text = (c: Cell) => (c instanceof Date ? "" : String(c ?? "").trim());

/** Rótulos das colunas: o cabeçalho (se houver) ou "Coluna A", "Coluna B"… */
export function columnLabels(sheet: SheetData, hasHeader: boolean): string[] {
  return (sheet.rows[0] ?? []).map((cell, i) => {
    const header = hasHeader ? text(cell) : "";
    return header ? `${columnLabel(i)} · ${header}` : `Coluna ${columnLabel(i)}`;
  });
}

const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/** Sugere o mapeamento a partir dos nomes do cabeçalho. */
export function suggestMapping(headers: string[]): Mapping {
  const find = (re: RegExp, taken: number[]) => {
    const i = headers.findIndex((h, idx) => !taken.includes(idx) && re.test(norm(h)));
    return i >= 0 ? i : null;
  };
  const date = find(/\b(data|date|dt|dia)\b|^data/, []);
  const description = find(/descri|historico|memo|lancamento|detalhe|favorecido|estabelecimento|nome/, date === null ? [] : [date]);
  const taken = [date, description].filter((n): n is number => n !== null);
  const amount = find(/valor|amount|quantia|montante|value/, taken);
  const debit = find(/debito|saida|debit/, taken);
  const credit = find(/credito|entrada|credit/, taken);
  return { date, description, amount, debit, credit };
}

// --- Datas ------------------------------------------------------------------------

function isoDate(y: number, m: number, d: number): string | null {
  if (y < 1900 || y > 2200 || m < 1 || m > 12 || d < 1) return null;
  const last = new Date(Date.UTC(y, m, 0)).getUTCDate(); // dia 0 do mês seguinte = último dia deste mês
  if (d > last) return null; // 31/02 etc.
  return `${String(y).padStart(4, "0")}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

/** Converte data de célula Excel (número serial), Date ou texto (dd/mm/aaaa, dd/mm/aa, aaaa-mm-dd, dd-mm-aaaa, dd.mm.aaaa). */
export function parseDateCell(cell: Cell, serialToParts?: (serial: number) => { y: number; m: number; d: number } | null): string | null {
  if (cell instanceof Date) return Number.isNaN(cell.getTime()) ? null : isoDate(cell.getUTCFullYear(), cell.getUTCMonth() + 1, cell.getUTCDate());
  if (typeof cell === "number") {
    if (Number.isInteger(cell) && cell >= 19000101 && cell <= 22001231) return isoDate(Math.floor(cell / 10000), Math.floor(cell / 100) % 100, cell % 100); // 20260115
    if (!Number.isFinite(cell) || cell < 1 || cell > 2_958_465) return null;
    const p = serialToParts?.(Math.floor(cell));
    return p ? isoDate(p.y, p.m, p.d) : null;
  }
  const s = text(cell);
  let m = s.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})(?:[T\s].*)?$/);
  if (m) return isoDate(+m[1], +m[2], +m[3]);
  m = s.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2}|\d{4})(?:[T\s,].*)?$/);
  if (m) {
    const year = m[3].length === 2 ? 2000 + +m[3] : +m[3];
    return isoDate(year, +m[2], +m[1]);
  }
  return null;
}

// --- Valores ----------------------------------------------------------------------

/** Decide o formato numérico da coluna inteira (e não célula a célula): ",dd" no fim = brasileiro; ".dd" = internacional. */
export function detectNumberFormat(values: Cell[]): "br" | "us" {
  let br = 0;
  let us = 0;
  for (const v of values) {
    if (typeof v === "number") continue;
    const s = text(v).replace(/\s|R\$|[A-Za-z]+$/g, "");
    if (/,\d{1,2}\D*$/.test(s) && !/,\d{3}\D*$/.test(s)) br++;
    else if (/\.\d{1,2}\D*$/.test(s) && !/\.\d{3}\D*$/.test(s)) us++;
    else if (/\.\d{3},\d/.test(s)) br++;
    else if (/,\d{3}\.\d/.test(s)) us++;
  }
  return us > br ? "us" : "br";
}

/** Interpreta um valor monetário. Aceita "R$ 1.234,56", "(1.234,56)", "1.234,56-", "1234.56 D", "−10,00". Devolve centavos arredondados. */
export function parseAmountCell(cell: Cell, format: "br" | "us"): number | null {
  if (typeof cell === "number") return Number.isFinite(cell) ? roundCents(cell) : null;
  let s = text(cell).replace(/ /g, " ").replace(/−/g, "-");
  if (!s) return null;
  let negative = false;
  if (/^\(.*\)$/.test(s)) {
    negative = true;
    s = s.slice(1, -1);
  }
  const suffix = s.match(/\s*([DCdc])$/);
  if (suffix) {
    negative = negative || suffix[1].toUpperCase() === "D";
    s = s.slice(0, -suffix[0].length);
  }
  s = s.replace(/R\$|\s/g, "");
  if (s.endsWith("-")) {
    negative = true;
    s = s.slice(0, -1);
  }
  if (s.startsWith("-")) {
    negative = true;
    s = s.slice(1);
  } else if (s.startsWith("+")) s = s.slice(1);
  if (!/^[\d.,]+$/.test(s) || !/\d/.test(s)) return null;
  const [thousand, decimal] = format === "br" ? [".", ","] : [",", "."];
  const parts = s.split(decimal);
  if (parts.length > 2) return null;
  const int = parts[0].split(thousand).join("");
  if (!/^\d*$/.test(int) || (parts[1] !== undefined && !/^\d+$/.test(parts[1]))) return null;
  const value = Number(`${int || "0"}${parts[1] !== undefined ? `.${parts[1]}` : ""}`);
  if (!Number.isFinite(value)) return null;
  return roundCents(negative ? -value : value);
}

function roundCents(n: number): number {
  const v = Math.round((n + Math.sign(n) * Number.EPSILON) * 100) / 100;
  return Object.is(v, -0) ? 0 : v;
}

// --- Conversão --------------------------------------------------------------------

export interface BuildOptions {
  sheet: SheetData;
  hasHeader: boolean;
  mapping: Mapping;
  amountMode: AmountMode;
  numberFormat: NumberFormat;
  /** Troca o sinal (extratos de cartão: compras positivas). */
  invertSign: boolean;
  serialToParts?: (serial: number) => { y: number; m: number; d: number } | null;
}

export interface SkippedRow {
  /** Número da linha na planilha (começa em 1). */
  row: number;
  reason: string;
}

export interface BuildResult {
  transactions: BankTransaction[];
  skipped: SkippedRow[];
  format: "br" | "us";
}

const MAX_ABS_AMOUNT = 1e11;

/** Uma linha por lançamento; quebras de linha e caracteres de controle viram espaço (o OFX 1.02 é orientado a linhas). */
export function cleanDescription(raw: Cell): string {
  const s = text(raw).replace(/[\u0000-\u001f\u007f-\u009f]+/g, " ").replace(/\s+/g, " ").trim();
  return s || "Sem descrição";
}

export function buildTransactions(opts: BuildOptions): BuildResult {
  const { sheet, hasHeader, mapping, amountMode, invertSign } = opts;
  const body = sheet.rows.slice(hasHeader ? 1 : 0);
  const offset = hasHeader ? 2 : 1;
  const amountCols = amountMode === "single" ? [mapping.amount] : [mapping.debit, mapping.credit];
  const numericCols = amountCols.filter((c): c is number => c !== null);

  const format =
    opts.numberFormat === "auto" ? detectNumberFormat(body.flatMap((r) => numericCols.map((c) => r[c]))) : opts.numberFormat;

  const transactions: BankTransaction[] = [];
  const skipped: SkippedRow[] = [];

  body.forEach((row, i) => {
    const line = i + offset;
    const used = [mapping.date, mapping.description, ...numericCols].filter((c): c is number => c !== null);
    if (used.every((c) => text(row[c]) === "")) return; // linha em branco
    const date = mapping.date === null ? null : parseDateCell(row[mapping.date], opts.serialToParts);
    if (!date) return void skipped.push({ row: line, reason: "data inválida" });

    let amount: number | null = null;
    if (amountMode === "single") {
      amount = mapping.amount === null ? null : parseAmountCell(row[mapping.amount], format);
    } else {
      const debit = mapping.debit === null ? null : parseAmountCell(row[mapping.debit], format);
      const credit = mapping.credit === null ? null : parseAmountCell(row[mapping.credit], format);
      if (debit === null && credit === null) amount = null;
      else amount = roundCents(Math.abs(credit ?? 0) - Math.abs(debit ?? 0));
    }
    if (amount === null) return void skipped.push({ row: line, reason: "valor inválido ou vazio" });
    if (Math.abs(amount) >= MAX_ABS_AMOUNT) return void skipped.push({ row: line, reason: "valor fora do limite" });

    transactions.push({
      date,
      description: cleanDescription(mapping.description === null ? "" : row[mapping.description]),
      amount: invertSign ? roundCents(-amount) : amount,
    });
  });

  return { transactions, skipped, format };
}

export interface Summary {
  count: number;
  from: string;
  to: string;
  inflow: number;
  outflow: number;
}

export function summarize(transactions: BankTransaction[]): Summary | null {
  if (transactions.length === 0) return null;
  const dates = transactions.map((t) => t.date).sort();
  return {
    count: transactions.length,
    from: dates[0],
    to: dates[dates.length - 1],
    inflow: roundCents(transactions.filter((t) => t.amount > 0).reduce((n, t) => n + t.amount, 0)),
    outflow: roundCents(transactions.filter((t) => t.amount < 0).reduce((n, t) => n + t.amount, 0)),
  };
}

// --- Dados da conta (validados antes de entrar no OFX) -----------------------------

const SAFE_ID = /^[0-9A-Za-z-]{1,22}$/;

/** `buildOfx` não escapa o código do banco e a conta: só aceitamos letras, números e hífen. */
export function validAccountField(value: string): boolean {
  return value === "" || SAFE_ID.test(value);
}
