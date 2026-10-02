/**
 * Planilha (CSV/XLSX) -> lançamentos para OFX, 100% no navegador.
 * A leitura usa o SheetJS (já presente no projeto, lê CSV e Excel); a geração do OFX reaproveita o `buildOfx` do conversor de PDF.
 */
import { decodeDelimited } from "./fileInspector/text";
import type { BankTransaction } from "./pdfToOfx";

export const MAX_FILE_BYTES = 20 * 1024 * 1024;
export const MAX_ROWS = 50_000;
export const ACCEPT = ".csv,.tsv,.txt,.xlsx,.xlsm,.xlsb,.xls,.ods";

export type Cell = string | number | boolean | Date | null | undefined;

export interface SheetData {
  name: string;
  /** Linhas retangulares com os valores brutos (números do Excel continuam números). Linhas em branco são mantidas. */
  rows: Cell[][];
  /** Número, na planilha, da primeira linha de `rows` (a aba pode não começar na linha 1). */
  firstRow: number;
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
    const rows = XLSX.utils.sheet_to_json<Cell[]>(ws, { header: 1, raw: true, defval: "", blankrows: true });
    if (rows.every((r) => r.every((c) => String(c ?? "").trim() === ""))) continue;
    if (rows.length > MAX_ROWS + 1) throw new SheetReadError(`A planilha "${name}" tem mais de ${MAX_ROWS.toLocaleString("pt-BR")} linhas. Divida o arquivo.`);
    const width = Math.max(...rows.map((r) => r.length));
    const firstRow = XLSX.utils.decode_range(ws["!ref"]).s.r + 1;
    sheets.push({ name, firstRow, rows: rows.map((r) => Array.from({ length: width }, (_, c) => r[c] ?? "")) });
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
  /** Coluna opcional que diz se a linha é débito ou crédito (ex.: "D"/"C", "Entrada"/"Saída"). */
  type: number | null;
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

const MAX_HEADER_CANDIDATES = 30;

/** Nome do cabeçalho de cada coluna ("" se não houver). Usado só para casar palavras-chave. */
function headerNames(sheet: SheetData, headerRow: number): string[] {
  const width = sheet.rows[0]?.length ?? 0;
  return Array.from({ length: width }, (_, i) => (headerRow >= 0 ? text(sheet.rows[headerRow]?.[i]) : ""));
}

function exampleOf(sheet: SheetData, headerRow: number, col: number): string {
  for (let r = headerRow + 1; r < Math.min(sheet.rows.length, headerRow + 40); r++) {
    const c = sheet.rows[r]?.[col];
    const t = c instanceof Date ? "" : String(c ?? "").trim();
    if (t) return t.length > 18 ? `${t.slice(0, 17)}…` : t;
  }
  return "";
}

/** Rótulos para o usuário escolher: letra, nome do cabeçalho e um exemplo do conteúdo (quem sobe a planilha nem sempre conhece o layout). */
export function columnLabels(sheet: SheetData, headerRow: number): string[] {
  const names = headerNames(sheet, headerRow);
  return names.map((name, i) => {
    const ex = exampleOf(sheet, headerRow, i);
    return `${columnLabel(i)} · ${name || "sem título"}${ex ? ` (ex.: ${ex})` : ""}`;
  });
}

const norm = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
const isEmptyRow = (row: Cell[]) => row.every((c) => text(c) === "");

/**
 * Data "de verdade" (usada para achar a tabela): serial do Excel só entre os anos 2000 e 2100 (assim "2026" ou um nº de conta
 * não viram data) e texto com UMA data (não "01/01/2026 a 31/01/2026", que é título de período).
 */
function strictDate(cell: Cell, serialToParts?: Workbook["serialToParts"]): boolean {
  const asNumber = typeof cell === "number" ? cell : typeof cell === "string" && /^\d+([.,]\d+)?$/.test(cell.trim()) ? Number(cell.trim().replace(",", ".")) : null;
  if (asNumber !== null && (asNumber < 36526 || asNumber > 73415) && !(Number.isInteger(asNumber) && asNumber >= 19000101 && asNumber <= 22001231)) return false;
  if (typeof cell === "string" && (cell.match(/\d{1,4}[/.-]\d{1,2}[/.-]\d{2,4}/g)?.length ?? 0) > 1) return false;
  return parseDateCell(cell, serialToParts) !== null;
}

/** Linha de lançamento: tem uma data de verdade e, em outra célula, um valor numérico. */
function looksLikeEntry(row: Cell[], serialToParts?: Workbook["serialToParts"]): boolean {
  const dateAt = row.findIndex((c) => strictDate(c, serialToParts));
  if (dateAt < 0) return false;
  return row.some((c, i) => i !== dateAt && !strictDate(c, serialToParts) && /\d/.test(text(c) || String(c)) && parseAmountCell(c, "br") !== null);
}

/** Linhas candidatas a cabeçalho: as primeiras não vazias (para o seletor da tela). */
export function headerCandidates(sheet: SheetData): number[] {
  const out: number[] = [];
  for (let i = 0; i < Math.min(sheet.rows.length, 60) && out.length < MAX_HEADER_CANDIDATES; i++) if (!isEmptyRow(sheet.rows[i])) out.push(i);
  return out;
}

const HEADER_WORDS = /\b(data|date|descri|historico|lancamento|valor|amount|debito|credito|entrada|saida)/;

/**
 * Acha a linha do cabeçalho: a linha de texto logo acima da primeira linha com data.
 * Extratos de banco costumam ter título e dados da conta antes da tabela. Devolve -1 se a tabela começa sem cabeçalho.
 */
export function detectHeaderRow(sheet: SheetData, serialToParts?: Workbook["serialToParts"]): number {
  const limit = Math.min(sheet.rows.length, 80);
  let firstData = -1;
  for (let r = 0; r < limit && firstData < 0; r++) if (looksLikeEntry(sheet.rows[r], serialToParts)) firstData = r;
  if (firstData >= 0) {
    for (let r = firstData - 1; r >= 0; r--) {
      const row = sheet.rows[r];
      if (isEmptyRow(row)) continue;
      const filled = row.filter((c) => text(c) !== "").length;
      return filled >= 2 ? r : -1; // uma linha só com 1 célula é título, não cabeçalho
    }
    return -1;
  }
  // Nenhuma data reconhecida (formato incomum): procura uma linha com palavras de cabeçalho.
  for (let r = 0; r < limit; r++) {
    if (sheet.rows[r].filter((c) => typeof c === "string" && HEADER_WORDS.test(norm(c))).length >= 2) return r;
  }
  return 0;
}

const BALANCE = /saldo|balance|total/;

/** Para a coluna `col`, o aproveitamento das linhas de amostra como data, valor e texto. */
function columnProfile(rows: Cell[][], col: number, serialToParts?: Workbook["serialToParts"]) {
  let filled = 0;
  let dates = 0;
  let amounts = 0;
  let textLen = 0;
  let texts = 0;
  for (const row of rows) {
    const cell = row[col];
    if (text(cell) === "") continue;
    filled++;
    if (strictDate(cell, serialToParts)) dates++;
    else if (parseAmountCell(cell, "br") !== null || parseAmountCell(cell, "us") !== null) amounts++;
    else {
      texts++;
      textLen += text(cell).length;
    }
  }
  const ratio = (n: number) => (filled === 0 ? 0 : n / filled);
  return { dateRatio: ratio(dates), amountRatio: ratio(amounts), textRatio: ratio(texts), avgText: texts ? textLen / texts : 0, filled };
}

/** Sugere o mapeamento pelos nomes do cabeçalho e, onde ele não ajuda, pelo conteúdo das colunas. */
export function suggestMapping(sheet: SheetData, headerRow: number, serialToParts?: Workbook["serialToParts"]): Mapping {
  const headers = headerNames(sheet, headerRow);
  const width = sheet.rows[0]?.length ?? 0;
  const find = (re: RegExp, taken: (number | null)[]) => {
    const i = headers.findIndex((h, idx) => !taken.includes(idx) && re.test(norm(h)));
    return i >= 0 ? i : null;
  };
  let date = find(/\b(data|date|dt|dia)\b|^data/, []);
  let description = find(/descri|historico|memo|lancamento|detalhe|favorecido|estabelecimento|nome/, [date]);
  let amount = find(/valor|amount|quantia|montante|value/, [date, description]);
  const debit = find(/debito|saida|debit/, [date, description, amount]);
  const credit = find(/credito|entrada|credit/, [date, description, amount]);
  const type = amount !== null ? find(/\btipo\b|natureza|d\/c|operacao|deb.*cred|cred.*deb/, [date, description, amount]) : null;

  // Conteúdo: usa uma amostra das linhas de dados.
  const body = sheet.rows.slice(headerRow + 1).filter((r) => !isEmptyRow(r)).slice(0, 100);
  const profiles = Array.from({ length: width }, (_, c) => columnProfile(body, c, serialToParts));
  const free = (c: number) => ![date, description, amount, debit, credit, type].includes(c);

  if (date === null) {
    const best = profiles.map((p, c) => ({ c, v: p.dateRatio })).filter((x) => x.v >= 0.6).sort((a, b) => b.v - a.v)[0];
    if (best) date = best.c;
  }
  // Sem coluna de data não há lançamentos: não chuta valor (evitaria sugerir "Número" do endereço como valor).
  if (date !== null && amount === null && debit === null && credit === null) {
    const best = profiles.findIndex((p, c) => free(c) && c !== date && p.amountRatio >= 0.6 && !(headers[c] && BALANCE.test(norm(headers[c]))));
    if (best >= 0) amount = best;
  }
  if (description === null) {
    const best = profiles
      .map((p, c) => ({ c, v: p.avgText, ok: p.textRatio >= 0.6 }))
      .filter((x) => x.ok && free(x.c) && x.c !== date)
      .sort((a, b) => b.v - a.v)[0];
    if (best) description = best.c;
  }
  return { date, description, amount, debit, credit, type };
}

// --- Datas ------------------------------------------------------------------------

function isoDate(y: number, m: number, d: number): string | null {
  if (y < 1900 || y > 2200 || m < 1 || m > 12 || d < 1) return null;
  const last = new Date(Date.UTC(y, m, 0)).getUTCDate(); // dia 0 do mês seguinte = último dia deste mês
  if (d > last) return null; // 31/02 etc.
  return `${String(y).padStart(4, "0")}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

const MONTHS: Record<string, number> = {
  jan: 1, janeiro: 1, fev: 2, fevereiro: 2, mar: 3, marco: 3, "março": 3, abr: 4, abril: 4, mai: 5, maio: 5, jun: 6, junho: 6,
  jul: 7, julho: 7, ago: 8, agosto: 8, set: 9, setembro: 9, out: 10, outubro: 10, nov: 11, novembro: 11, dez: 12, dezembro: 12,
  // inglês (exportações de sistemas em inglês)
  feb: 2, apr: 4, may: 5, aug: 8, sep: 9, oct: 10, dec: 12,
};

/** dd/mm/aaaa. Se o "mês" passa de 12 e o "dia" não, a data veio no padrão americano (mm/dd/aaaa) e invertemos. */
function dayMonthYear(a: number, b: number, year: number): string | null {
  return b > 12 && a <= 12 ? isoDate(year, a, b) : isoDate(year, b, a);
}

/**
 * Converte a data de uma célula: serial do Excel (número ou texto), Date, ou texto como 31/01/2026, 31/01/26, 2026-01-31,
 * 31-01-2026 10:30, "seg, 31/01/2026", 31 jan 2026, 31/jan/26, 20260131.
 */
export function parseDateCell(
  cell: Cell,
  serialToParts?: (serial: number) => { y: number; m: number; d: number } | null,
  defaultYear?: number,
): string | null {
  if (cell instanceof Date) return Number.isNaN(cell.getTime()) ? null : isoDate(cell.getUTCFullYear(), cell.getUTCMonth() + 1, cell.getUTCDate());
  if (typeof cell === "number") return fromNumber(cell, serialToParts);
  let s = text(cell).replace(/^["'`]+|["'`]+$/g, "").trim().toLowerCase();
  if (!s) return null;
  if (/^\d+([.,]\d+)?$/.test(s)) return fromNumber(Number(s.replace(",", ".")), serialToParts); // "46037" ou "20260131" como texto
  s = s.replace(/^(segunda|terca|terça|quarta|quinta|sexta|sabado|sábado|domingo|seg|ter|qua|qui|sex|sab|sáb|dom)[a-zç-]*[,.\s]+/, "");
  let m = s.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})(?:\D.*)?$/);
  if (m) return isoDate(+m[1], +m[2], +m[3]);
  m = s.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2}|\d{4})(?:\D.*)?$/);
  if (m) return dayMonthYear(+m[1], +m[2], m[3].length === 2 ? 2000 + +m[3] : +m[3]);
  m = s.match(/^(\d{1,2})[/.-](\d{1,2})(?:\s.*)?$/); // 15/01 (fatura de cartão): o ano vem de fora
  if (m && defaultYear) return isoDate(defaultYear, +m[2], +m[1]);
  m = s.match(/^(\d{1,2})[\s/.-]*(?:de\s+)?([a-zçã]{3,9})\.?[\s/.-]*(?:de\s+)?(\d{2}|\d{4})(?:\D.*)?$/);
  if (m && MONTHS[m[2]]) return isoDate(m[3].length === 2 ? 2000 + +m[3] : +m[3], MONTHS[m[2]], +m[1]);
  return null;
}

function fromNumber(n: number, serialToParts?: (serial: number) => { y: number; m: number; d: number } | null): string | null {
  if (!Number.isFinite(n)) return null;
  if (Number.isInteger(n) && n >= 19000101 && n <= 22001231) return isoDate(Math.floor(n / 10000), Math.floor(n / 100) % 100, n % 100); // 20260131
  if (n < 1 || n > 2_958_465) return null;
  const p = serialToParts?.(Math.floor(n));
  return p ? isoDate(p.y, p.m, p.d) : null;
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
  let s = text(cell).replace(/ /g, " ").replace(/−/g, "-").replace(/US\$|R\$|BRL|USD|EUR|[$€£]/gi, "").trim();
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
  s = s.replace(/\s/g, "");
  if (s.endsWith("-")) {
    negative = true;
    s = s.slice(0, -1);
  }
  if (s.startsWith("-")) {
    negative = true;
    s = s.slice(1);
  } else if (s.startsWith("+")) s = s.slice(1);
  if (!/^[\d.,]+$/.test(s) || !/\d/.test(s)) return null;
  // "10.50" numa coluna brasileira (ou "10,50" numa internacional) só pode ser decimal: separador de milhar exige 3 dígitos.
  const effective = format === "br" && /^\d+\.\d{1,2}$/.test(s) ? "us" : format === "us" && /^\d+,\d{1,2}$/.test(s) ? "br" : format;
  const [thousand, decimal] = effective === "br" ? [".", ","] : [",", "."];
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
  /** Índice da linha do cabeçalho em `sheet.rows`; -1 = sem cabeçalho. */
  headerRow: number;
  mapping: Mapping;
  amountMode: AmountMode;
  numberFormat: NumberFormat;
  /** Troca o sinal (extratos de cartão: compras positivas). */
  invertSign: boolean;
  serialToParts?: (serial: number) => { y: number; m: number; d: number } | null;
  /** Sem coluna de data: todos os lançamentos usam esta data (AAAA-MM-DD). */
  fixedDate?: string;
  /** Ano para datas escritas sem ano (15/01). */
  defaultYear?: number;
}

export interface SkippedRow {
  /** Número da linha na planilha (começa em 1). */
  row: number;
  reason: string;
  /** Valor da célula que não foi entendido (para o usuário reconhecer o formato). */
  sample?: string;
}

export interface BuildResult {
  transactions: BankTransaction[];
  skipped: SkippedRow[];
  format: "br" | "us";
}

const MAX_ABS_AMOUNT = 1e11;

function sampleOf(cell: Cell): string | undefined {
  const t = cell instanceof Date ? cell.toISOString() : String(cell ?? "").trim();
  return t ? t.slice(0, 30) : undefined;
}

/** Uma linha por lançamento; quebras de linha e caracteres de controle viram espaço (o OFX 1.02 é orientado a linhas). */
export function cleanDescription(raw: Cell): string {
  const s = text(raw).replace(/[\u0000-\u001f\u007f-\u009f]+/g, " ").replace(/\s+/g, " ").trim();
  return s || "Sem descrição";
}

const DEBIT_WORD = /^(d|deb|debito|débito|saida|saída|pagamento|pgto|compra|saque|tarifa|despesa|pago|-)(\b|$)/i;
const CREDIT_WORD = /^(c|cred|credito|crédito|entrada|deposito|depósito|recebimento|receita|recebido|estorno|\+)(\b|$)/i;

/** Lê a coluna de tipo: devolve -1 (débito), 1 (crédito) ou 0 (não reconhecido: vale o sinal do valor). */
export function parseTypeCell(cell: Cell): -1 | 0 | 1 {
  const t = text(cell).normalize("NFC");
  if (!t) return 0;
  if (DEBIT_WORD.test(t)) return -1;
  if (CREDIT_WORD.test(t)) return 1;
  return 0;
}

export function buildTransactions(opts: BuildOptions): BuildResult {
  const { sheet, headerRow, mapping, amountMode, invertSign } = opts;
  const body = sheet.rows.slice(headerRow + 1);
  const offset = sheet.firstRow + headerRow + 1; // número real da linha na planilha
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
    // Sem coluna de data, todos os lançamentos levam a data fixa escolhida pelo usuário.
    const date = mapping.date === null ? opts.fixedDate ?? null : parseDateCell(row[mapping.date], opts.serialToParts, opts.defaultYear);
    if (!date) return void skipped.push({ row: line, reason: "data inválida", sample: sampleOf(mapping.date === null ? "" : row[mapping.date]) });

    let amount: number | null = null;
    if (amountMode === "single") {
      amount = mapping.amount === null ? null : parseAmountCell(row[mapping.amount], format);
    } else {
      const debit = mapping.debit === null ? null : parseAmountCell(row[mapping.debit], format);
      const credit = mapping.credit === null ? null : parseAmountCell(row[mapping.credit], format);
      if (debit === null && credit === null) amount = null;
      else amount = roundCents(Math.abs(credit ?? 0) - Math.abs(debit ?? 0));
    }
    if (amount === null) {
      const raw = amountMode === "single" ? (mapping.amount === null ? "" : row[mapping.amount]) : row[mapping.debit ?? mapping.credit ?? 0];
      return void skipped.push({ row: line, reason: "valor inválido ou vazio", sample: sampleOf(raw) });
    }
    if (Math.abs(amount) >= MAX_ABS_AMOUNT) return void skipped.push({ row: line, reason: "valor fora do limite" });
    // Coluna de tipo (D/C, Entrada/Saída…): ela decide o sinal; sem tipo reconhecido, vale o sinal do próprio valor.
    if (amountMode === "single" && mapping.type !== null) {
      const kind = parseTypeCell(row[mapping.type]);
      if (kind !== 0) amount = kind * Math.abs(amount);
    }

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
