/**
 * PDF de extrato bancário -> OFX 1.02, 100% no navegador (nada é enviado a servidor).
 *
 * Funciona com PDFs que têm texto selecionável (a maioria dos extratos baixados do internet banking).
 * PDFs escaneados (imagem) não têm texto e exigiriam OCR, que não é suportado.
 */

export interface BankTransaction {
  /** Data da transação, ISO (YYYY-MM-DD). */
  date: string;
  description: string;
  /** Positivo = crédito, negativo = débito. */
  amount: number;
}

export interface ParseResult {
  transactions: BankTransaction[];
  warnings: string[];
}

export class PdfNoTextError extends Error {
  constructor() {
    super("Este PDF não tem texto selecionável (parece escaneado). Baixe o extrato em PDF direto do banco.");
    this.name = "PdfNoTextError";
  }
}

import { loadPdfJs, type PdfJs } from "./pdfjs";

// --- 1. Extração de linhas do PDF ------------------------------------------------

interface TextPiece {
  str: string;
  x: number;
  y: number;
  width: number;
}

/** Agrupa pedaços de texto em linhas visuais (mesma altura), ordenadas da esquerda para a direita. */
export function piecesToLines(pieces: TextPiece[], yTolerance = 3): string[] {
  const rows: { y: number; items: TextPiece[] }[] = [];
  for (const piece of pieces) {
    if (!piece.str.trim()) continue;
    const row = rows.find((r) => Math.abs(r.y - piece.y) <= yTolerance);
    if (row) row.items.push(piece);
    else rows.push({ y: piece.y, items: [piece] });
  }
  rows.sort((a, b) => b.y - a.y); // PDF: y cresce para cima

  return rows.map(({ items }) => {
    items.sort((a, b) => a.x - b.x);
    let line = "";
    let prevEnd: number | null = null;
    for (const item of items) {
      const charWidth = item.width / Math.max(item.str.length, 1);
      const gap = prevEnd === null ? 0 : item.x - prevEnd;
      if (line && (gap > charWidth * 0.3 || !/\s$/.test(line)) && !/^\s/.test(item.str)) line += gap > charWidth * 0.3 ? " " : "";
      line += item.str;
      prevEnd = item.x + item.width;
    }
    return line.replace(/\s+/g, " ").trim();
  });
}

/** Lê o PDF e devolve as linhas de texto de todas as páginas. `pdfjs` é injetável para testes em Node. */
export async function extractPdfLines(data: ArrayBuffer, pdfjs?: PdfJs): Promise<string[]> {
  const lib = pdfjs ?? (await loadPdfJs());
  const task = lib.getDocument({ data: new Uint8Array(data) });
  const doc = await task.promise;
  const lines: string[] = [];
  try {
    for (let p = 1; p <= doc.numPages; p++) {
      const page = await doc.getPage(p);
      const pieces: TextPiece[] = [];
      // Lê o stream manualmente. `page.getTextContent()` usa `for await` sobre um ReadableStream, o que
      // quebra em Safari/WebKit sem suporte a iteração assíncrona de streams ("undefined is not a function").
      const reader = page.streamTextContent().getReader();
      try {
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          for (const item of value.items) {
            if ("str" in item) pieces.push({ str: item.str, x: item.transform[4], y: item.transform[5], width: item.width });
          }
        }
      } finally {
        reader.releaseLock();
      }
      lines.push(...piecesToLines(pieces));
    }
  } finally {
    await task.destroy();
  }
  if (lines.length === 0) throw new PdfNoTextError();
  return lines;
}

// --- 2. Interpretação das linhas -------------------------------------------------

const MONTHS: Record<string, number> = {
  jan: 1, fev: 2, mar: 3, abr: 4, mai: 5, jun: 6, jul: 7, ago: 8, set: 9, out: 10, nov: 11, dez: 12,
  janeiro: 1, fevereiro: 2, março: 3, marco: 3, abril: 4, maio: 5, junho: 6, julho: 7, agosto: 8,
  setembro: 9, outubro: 10, novembro: 11, dezembro: 12,
};

const AMOUNT_RE = /(?:^|\s)([+-]?\s?(?:R\$\s?)?[+-]?\s?(?:\d{1,3}(?:\.\d{3})+|\d+),\d{2})(?:\s?([CD])\b|(-))?(?=\s|$)/gi;

const SKIP_RE = /^(saldo\b|total\b|resumo\b|limite\b|extrato\b|per[ií]odo\b|ag[eê]ncia\b|conta\b)/i;
// Radicais (sem \b no fim) para casar "recebido", "recebida", "enviado", etc.
const DEBIT_HINT = /\b(?:pagamento|pgto|compra|pix env|transf\w* env|envio|saque|tarifa|d[eé]bito|boleto|iof|juros|anuidade|cesta|fatura)/i;
const CREDIT_HINT = /\b(?:receb|cr[eé]dito|dep[oó]sito|sal[aá]rio|estorno|rendimento|pix rec|reembolso)/i;

interface Cursor {
  year: number;
  refMonth: number | null;
}

function toIso(year: number, month: number, day: number): string | null {
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  const d = new Date(Date.UTC(year, month - 1, day));
  if (d.getUTCMonth() !== month - 1) return null; // 31/02 etc.
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function normalizeYear(y: number): number {
  return y < 100 ? 2000 + y : y;
}

/** Ano para datas sem ano (dd/mm): usa o ano do período do extrato; virada de ano (dez em extrato de jan). */
function inferYear(month: number, cursor: Cursor): number {
  if (cursor.refMonth !== null && month - cursor.refMonth > 6) return cursor.year - 1;
  return cursor.year;
}

/** Procura uma data no INÍCIO da linha. Retorna ISO e o restante da linha. */
function matchLeadingDate(line: string, cursor: Cursor): { iso: string; rest: string } | null {
  let m = line.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4}|\d{2})\b\s*(.*)$/);
  if (m) {
    const iso = toIso(normalizeYear(+m[3]), +m[2], +m[1]);
    return iso ? { iso, rest: m[4] } : null;
  }
  m = line.match(/^(\d{1,2})[/.-](\d{1,2})\b(?![,\d])\s*(.*)$/);
  if (m) {
    const month = +m[2];
    const iso = toIso(inferYear(month, cursor), month, +m[1]);
    return iso ? { iso, rest: m[3] } : null;
  }
  m = line.match(/^(\d{1,2})\s+(?:de\s+)?([A-Za-zçÇ]{3,9})\.?(?:\s+(?:de\s+)?(\d{4}))?\b\s*(.*)$/i);
  if (m) {
    const month = MONTHS[m[2].toLowerCase()];
    if (month) {
      const iso = toIso(m[3] ? +m[3] : inferYear(month, cursor), month, +m[1]);
      return iso ? { iso, rest: m[4] } : null;
    }
  }
  return null;
}

function parseAmount(token: string, suffix: string | undefined, dash: string | undefined): number | null {
  const negativeSign = /-/.test(token) || (suffix && /d/i.test(suffix)) || Boolean(dash);
  const digits = token.replace(/[^\d,]/g, "").replace(",", ".");
  const value = Number(digits);
  if (!Number.isFinite(value)) return null;
  return negativeSign ? -value : value;
}

function cleanDescription(text: string): string {
  return text.replace(/R\$/g, "").replace(/\s+/g, " ").replace(/^[\s\-–—:]+|[\s\-–—:]+$/g, "").trim();
}

/**
 * Converte linhas de texto de um extrato em transações.
 * Reconhece: "02/10 DESCRIÇÃO -1.234,56", "02/10/2026 ... 1.234,56 D", "02 OUT ... R$ 10,00" e o formato com
 * título de data ("2 de outubro de 2026") seguido de linhas só com descrição e valor.
 */
export function parseStatementLines(lines: string[], options: { defaultYear?: number } = {}): ParseResult {
  const warnings: string[] = [];

  // Ano de referência: primeira data completa do documento (ex.: período do extrato).
  const ref = lines.join("\n").match(/\b(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})\b/);
  const cursor: Cursor = {
    year: options.defaultYear ?? (ref ? +ref[3] : new Date().getFullYear()),
    refMonth: ref ? +ref[2] : null,
  };

  const transactions: BankTransaction[] = [];
  let currentDate: string | null = null; // para extratos com título de data
  let lastWasTransaction = false;
  let presumedSign = 0;
  let balanceColumn = false;

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;

    const dated = matchLeadingDate(line, cursor);
    const body = dated ? dated.rest : line;

    // Coleta os valores monetários da linha.
    const amounts = [...body.matchAll(AMOUNT_RE)];

    if (dated && amounts.length === 0) {
      currentDate = dated.iso; // título de data (ex.: "2 de outubro de 2026")
      lastWasTransaction = false;
      continue;
    }

    const date = dated?.iso ?? currentDate;

    if (amounts.length === 0) {
      // Descrição que quebrou em duas linhas: anexa à transação anterior.
      if (lastWasTransaction && transactions.length && !SKIP_RE.test(line) && line.length < 80 && !/^\d+$/.test(line)) {
        const last = transactions[transactions.length - 1];
        last.description = cleanDescription(`${last.description} ${line}`);
      } else {
        lastWasTransaction = false;
      }
      continue;
    }

    // Duas colunas de valor = [valor, saldo]; usa o penúltimo e ignora o saldo.
    let chosen = amounts[amounts.length - 1];
    if (amounts.length >= 2) {
      chosen = amounts[amounts.length - 2];
      balanceColumn = true;
    }
    const descriptionEnd = chosen.index ?? body.length;
    const description = cleanDescription(body.slice(0, descriptionEnd));

    if (!date || !description || SKIP_RE.test(description)) {
      lastWasTransaction = false;
      continue;
    }

    let amount = parseAmount(chosen[1], chosen[2], chosen[3]);
    if (amount === null || amount === 0) {
      lastWasTransaction = false;
      continue;
    }

    // Sem sinal explícito: usa palavras da descrição para decidir entre débito e crédito.
    const hasExplicitSign = /-/.test(chosen[1]) || chosen[2] || chosen[3] || /\+/.test(chosen[1]);
    if (!hasExplicitSign) {
      if (DEBIT_HINT.test(description) && !CREDIT_HINT.test(description)) amount = -amount;
      else if (!CREDIT_HINT.test(description)) presumedSign++;
    }

    transactions.push({ date, description, amount });
    lastWasTransaction = true;
  }

  if (balanceColumn) warnings.push("Detectamos uma coluna de saldo: usamos o valor da transação e ignoramos o saldo.");
  if (presumedSign > 0) {
    warnings.push(`${presumedSign} transação(ões) sem sinal explícito foram tratadas como crédito. Confira os débitos antes de importar.`);
  }
  return { transactions, warnings };
}

// --- 3. Geração do OFX 1.02 -------------------------------------------------------

export interface OfxOptions {
  bankId?: string;
  accountId?: string;
  accountType?: "CHECKING" | "SAVINGS" | "CREDITLINE";
  currency?: string;
  /** Fuso fixo do Brasil (sem horário de verão atualmente). */
  timezone?: string;
  now?: Date;
}

const xmlEscape = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const ofxDate = (iso: string, tz: string, time = "120000") => `${iso.replace(/-/g, "")}${time}[${tz}]`;

/** Hash curto e estável (FNV-1a) para compor o FITID. */
function hash(text: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, "0");
}

export function buildOfx(transactions: BankTransaction[], options: OfxOptions = {}): string {
  const { bankId = "0000", accountId = "0000000", accountType = "CHECKING", currency = "BRL", timezone = "-3:BRT", now = new Date() } = options;
  const sorted = [...transactions].sort((a, b) => a.date.localeCompare(b.date));
  const start = sorted[0]?.date ?? now.toISOString().slice(0, 10);
  const end = sorted[sorted.length - 1]?.date ?? start;
  const stamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}${String(now.getHours()).padStart(2, "0")}${String(now.getMinutes()).padStart(2, "0")}${String(now.getSeconds()).padStart(2, "0")}[${timezone}]`;

  const seen = new Map<string, number>();
  const entries = sorted.map((t) => {
    const key = `${t.date}|${t.amount.toFixed(2)}|${t.description}`;
    const n = (seen.get(key) ?? 0) + 1; // transações idênticas no mesmo dia continuam com FITID único
    seen.set(key, n);
    const fitid = `${t.date.replace(/-/g, "")}${hash(`${key}|${n}`)}`;
    const description = xmlEscape(t.description).slice(0, 255);
    return [
      "<STMTTRN>",
      `<TRNTYPE>${t.amount < 0 ? "DEBIT" : "CREDIT"}`,
      `<DTPOSTED>${ofxDate(t.date, timezone)}`,
      `<TRNAMT>${t.amount.toFixed(2)}`,
      `<FITID>${fitid}`,
      `<NAME>${description.slice(0, 32)}`,
      `<MEMO>${description}`,
      "</STMTTRN>",
    ].join("\n");
  });

  return [
    "OFXHEADER:100",
    "DATA:OFXSGML",
    "VERSION:102",
    "SECURITY:NONE",
    "ENCODING:USASCII",
    "CHARSET:1252",
    "COMPRESSION:NONE",
    "OLDFILEUID:NONE",
    "NEWFILEUID:NONE",
    "",
    "<OFX>",
    "<SIGNONMSGSRSV1>",
    "<SONRS>",
    "<STATUS>",
    "<CODE>0",
    "<SEVERITY>INFO",
    "</STATUS>",
    `<DTSERVER>${stamp}`,
    "<LANGUAGE>POR",
    "</SONRS>",
    "</SIGNONMSGSRSV1>",
    "<BANKMSGSRSV1>",
    "<STMTTRNRS>",
    "<TRNUID>1",
    "<STATUS>",
    "<CODE>0",
    "<SEVERITY>INFO",
    "</STATUS>",
    "<STMTRS>",
    `<CURDEF>${currency}`,
    "<BANKACCTFROM>",
    `<BANKID>${bankId}`,
    `<ACCTID>${accountId}`,
    `<ACCTTYPE>${accountType}`,
    "</BANKACCTFROM>",
    "<BANKTRANLIST>",
    `<DTSTART>${ofxDate(start, timezone, "000000")}`,
    `<DTEND>${ofxDate(end, timezone, "235959")}`,
    ...entries,
    "</BANKTRANLIST>",
    "</STMTRS>",
    "</STMTTRNRS>",
    "</BANKMSGSRSV1>",
    "</OFX>",
    "",
  ].join("\n");
}

const CP1252_EXTRA: Record<string, string> = { "–": "-", "—": "-", "‘": "'", "’": "'", "“": '"', "”": '"', "…": "...", "•": "*" };

/** O cabeçalho declara CHARSET 1252: grava os bytes em Latin-1 (acentos preservados). */
export function ofxToBlob(ofx: string): Blob {
  const bytes = new Uint8Array(ofx.length);
  for (let i = 0; i < ofx.length; i++) {
    const ch = CP1252_EXTRA[ofx[i]] ?? ofx[i];
    const code = ch.charCodeAt(0);
    bytes[i] = code <= 0xff ? code : 0x3f; // '?'
  }
  return new Blob([bytes], { type: "application/x-ofx" });
}

// --- 4. Função principal -----------------------------------------------------------

export interface ConvertResult extends ParseResult {
  ofx: string;
}

export async function convertPdfToOfx(file: File, options?: OfxOptions): Promise<ConvertResult> {
  const lines = await extractPdfLines(await file.arrayBuffer());
  const { transactions, warnings } = parseStatementLines(lines);
  return { transactions, warnings, ofx: buildOfx(transactions, options) };
}
