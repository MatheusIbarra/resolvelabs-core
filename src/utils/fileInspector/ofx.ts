import { activeTranslator } from "@/i18n/active";
import type { OfxBalance, OfxData, OfxTransaction } from "./types";

const ENTITIES: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'" };
const decode = (s: string) => s.replace(/&(amp|lt|gt|quot|apos);/g, (_m, e: string) => ENTITIES[e]).trim();

/** Decodifica os bytes respeitando o CHARSET/ENCODING declarado no cabeçalho (Latin-1/1252 ou UTF-8). */
export function decodeOfxBytes(buffer: ArrayBuffer): string {
  const probe = new TextDecoder("latin1").decode(buffer.slice(0, 600));
  const encoding = probe.match(/ENCODING:\s*(\S+)/i)?.[1]?.toUpperCase();
  const charset = probe.match(/CHARSET:\s*(\S+)/i)?.[1];
  if (encoding === "UTF-8" || /encoding="utf-8"/i.test(probe)) return new TextDecoder("utf-8").decode(buffer);
  if (charset === "1252" || encoding === "USASCII" || !encoding) {
    // O arquivo pode já estar em UTF-8 mesmo declarando 1252: usa UTF-8 se for válido.
    try {
      return new TextDecoder("utf-8", { fatal: true }).decode(buffer);
    } catch {
      return new TextDecoder("windows-1252").decode(buffer);
    }
  }
  return new TextDecoder("latin1").decode(buffer);
}

/** "20261002120000 (fuso BRT)" -> "2026-10-02" */
export function parseOfxDate(raw: string | undefined): string | null {
  const m = raw?.match(/^(\d{4})(\d{2})(\d{2})/);
  if (!m) return null;
  const [, y, mo, d] = m;
  return +mo >= 1 && +mo <= 12 && +d >= 1 && +d <= 31 ? `${y}-${mo}-${d}` : null;
}

/** OFX usa ponto decimal, mas alguns bancos exportam vírgula ("-1.234,56" ou "-1234,56"). */
export function parseOfxAmount(raw: string | undefined): number {
  if (!raw) return NaN;
  let s = raw.trim();
  if (/,\d{1,2}$/.test(s)) s = s.replace(/\./g, "").replace(",", ".");
  else s = s.replace(/,/g, "");
  return Number(s);
}

/** Primeiro valor de uma tag (SGML sem fechamento ou XML com fechamento) dentro de um trecho. */
function tag(block: string, name: string): string | undefined {
  const m = block.match(new RegExp(`<${name}>\\s*([^<\\r\\n]*)`, "i"));
  return m ? decode(m[1]) : undefined;
}

const section = (text: string, name: string): string | undefined =>
  text.match(new RegExp(`<${name}>([\\s\\S]*?)</${name}>`, "i"))?.[1];

function balance(block: string | undefined, amountTag: string, dateTag: string): OfxBalance | null {
  if (!block) return null;
  const amount = parseOfxAmount(tag(block, amountTag));
  return Number.isFinite(amount) ? { amount, date: parseOfxDate(tag(block, dateTag)) } : null;
}

/** Interpreta OFX 1.x (SGML) e 2.x (XML): cabeçalho, instituição, conta, saldos e transações. */
export function parseOfx(text: string): OfxData {
  const warnings: string[] = [];
  const clean = text.replace(/^﻿/, "");

  const header: Record<string, string> = {};
  const headerEnd = clean.search(/<OFX[\s>]/i);
  const headerText = headerEnd > 0 ? clean.slice(0, headerEnd) : "";
  for (const m of headerText.matchAll(/^\s*([A-Z]+):\s*(.*)$/gm)) header[m[1]] = m[2].trim();
  for (const m of headerText.matchAll(/(\w+)="([^"]*)"/g)) header[m[1].toUpperCase()] = m[2]; // cabeçalho XML (<?OFX ...?>)

  if (headerEnd < 0) warnings.push(activeTranslator().t("tools.inspector.ofxNoTag"));

  const body = headerEnd >= 0 ? clean.slice(headerEnd) : clean;
  const sonrs = section(body, "SONRS");
  const org = sonrs ? tag(section(sonrs, "FI") ?? "", "ORG") : undefined;
  const fid = sonrs ? tag(section(sonrs, "FI") ?? "", "FID") : undefined;

  const bankStmt = section(body, "STMTRS");
  const cardStmt = section(body, "CCSTMTRS");
  const stmt = bankStmt ?? cardStmt ?? body;
  const acctBlock = section(stmt, "BANKACCTFROM") ?? section(stmt, "CCACCTFROM") ?? "";

  const tranList = section(stmt, "BANKTRANLIST") ?? stmt;
  const transactions: OfxTransaction[] = [];
  for (const m of tranList.matchAll(/<STMTTRN>([\s\S]*?)<\/STMTTRN>/gi)) {
    const block = m[1];
    const amount = parseOfxAmount(tag(block, "TRNAMT"));
    if (!Number.isFinite(amount)) {
      warnings.push(activeTranslator().t("tools.inspector.ofxSkipped", { fitid: tag(block, "FITID") ?? "?" }));
      continue;
    }
    const name = tag(block, "NAME") ?? "";
    const memo = tag(block, "MEMO");
    transactions.push({
      date: parseOfxDate(tag(block, "DTPOSTED")),
      type: (tag(block, "TRNTYPE") ?? (amount < 0 ? "DEBIT" : "CREDIT")).toUpperCase(),
      amount,
      description: memo && memo !== name ? (name ? `${name} — ${memo}` : memo) : name || memo || "",
      memo,
      fitid: tag(block, "FITID"),
      checkNumber: tag(block, "CHECKNUM"),
    });
  }
  if (transactions.length === 0 && headerEnd >= 0) warnings.push(activeTranslator().t("tools.inspector.ofxNone"));

  let credits = 0;
  let debits = 0;
  for (const t of transactions) (t.amount >= 0 ? (credits += t.amount) : (debits += t.amount));

  return {
    header,
    institution: { org, fid },
    account: {
      bankId: tag(acctBlock, "BANKID"),
      branchId: tag(acctBlock, "BRANCHID"),
      accountId: tag(acctBlock, "ACCTID"),
      accountType: tag(acctBlock, "ACCTTYPE"),
      currency: tag(stmt, "CURDEF"),
      kind: bankStmt ? "bank" : cardStmt ? "creditcard" : "unknown",
    },
    period: { start: parseOfxDate(tag(tranList, "DTSTART")), end: parseOfxDate(tag(tranList, "DTEND")) },
    ledgerBalance: balance(section(stmt, "LEDGERBAL"), "BALAMT", "DTASOF"),
    availableBalance: balance(section(stmt, "AVAILBAL"), "BALAMT", "DTASOF"),
    transactions,
    totals: { count: transactions.length, credits, debits },
    warnings,
  };
}
