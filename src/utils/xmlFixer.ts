import { activeTranslator } from "@/i18n/active";

import type { ClientDictionary } from "@/i18n/messages";

type IssueKey = keyof ClientDictionary["tools"]["xml"]["issue"];
/** Mensagem do relatório no idioma atual (textos em i18n/messages/tools.ts). */
const I18N = (key: IssueKey, vars?: Record<string, string | number>) => activeTranslator().t(`tools.xml.issue.${key}`, vars);
/**
 * Reparador de feeds XML do Google Merchant (RSS 2.0 `<item>` ou Atom `<entry>`), 100% no navegador.
 *
 * Corrige automaticamente: HTML nas descrições/títulos (remove ou envolve em CDATA), `&` e `<` soltos,
 * preços fora do padrão ("199,90" -> "199.90 BRL"), GTIN com máscara e ID ausente.
 * Reporta sem alterar: campos obrigatórios vazios, preço ausente, GTIN com dígito verificador inválido, IDs duplicados.
 */

export type IssueSeverity = "fixed" | "warning" | "error";

export interface XmlIssue {
  itemIndex: number;
  itemId: string | null;
  field: string;
  severity: IssueSeverity;
  message: string;
}

export interface XmlFixOptions {
  /** "strip" remove as tags (recomendado pelo Google); "cdata" preserva o HTML dentro de CDATA. */
  htmlMode?: "strip" | "cdata";
  defaultCurrency?: string;
  generateMissingIds?: boolean;
}

export interface XmlFixResult {
  xml: string;
  issues: XmlIssue[];
  stats: { items: number; fixed: number; warnings: number; errors: number };
  /** `null` quando o navegador não oferece DOMParser (ex.: testes em Node). */
  wellFormed: boolean | null;
}

const REQUIRED_TEXT_FIELDS = ["title", "description", "link", "image_link"] as const;
const BLOCK_TAGS = /<\/?(?:p|div|br|li|ul|ol|tr|table|h[1-6]|section|article)\b[^>]*>/gi;
const ANY_TAG = /<\/?[a-z][a-z0-9:-]*(?:\s[^<>]*)?\/?>/gi;
const NAMED_ENTITIES: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " };

// --- Utilitários de texto ---------------------------------------------------------

function decodeEntities(text: string): string {
  return text.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (match, ent: string) => {
    if (ent[0] === "#") {
      const code = ent[1].toLowerCase() === "x" ? parseInt(ent.slice(2), 16) : parseInt(ent.slice(1), 10);
      return Number.isFinite(code) && code > 0 && code < 0x110000 ? String.fromCodePoint(code) : match;
    }
    return NAMED_ENTITIES[ent.toLowerCase()] ?? match;
  });
}

/** Escapa para texto XML. */
const escapeXml = (text: string) => text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const hasHtml = (text: string) => /<\/?[a-z][a-z0-9:-]*(?:\s[^<>]*)?\/?>/i.test(text);

const stripHtml = (html: string) =>
  html.replace(BLOCK_TAGS, " ").replace(ANY_TAG, "").replace(/\s+/g, " ").trim();

/** Remove um CDATA envolvente e devolve o texto interno. */
function unwrapCdata(raw: string): { text: string; wasCdata: boolean } {
  const m = raw.trim().match(/^<!\[CDATA\[([\s\S]*?)\]\]>$/);
  return m ? { text: m[1], wasCdata: true } : { text: raw, wasCdata: false };
}

interface SanitizedText {
  value: string;
  changed: boolean;
  reason?: string;
}

/** Normaliza o conteúdo de um campo de texto para XML válido. */
function sanitizeText(raw: string, mode: "strip" | "cdata"): SanitizedText {
  const { text, wasCdata } = unwrapCdata(raw);

  // HTML direto, ou HTML escapado (&lt;p&gt;...), ou HTML dentro de CDATA.
  const decoded = decodeEntities(text);
  const html = hasHtml(text) ? text : hasHtml(decoded) ? decoded : null;

  if (html !== null) {
    if (mode === "cdata") {
      if (wasCdata) return { value: raw, changed: false };
      return { value: `<![CDATA[${html.replace(/\]\]>/g, "]]]]><![CDATA[>")}]]>`, changed: true, reason: I18N("htmlCdata") };
    }
    return { value: escapeXml(decodeEntities(stripHtml(html)).replace(/\s+/g, " ").trim()), changed: true, reason: I18N("htmlRemoved") };
  }

  if (wasCdata) return { value: raw, changed: false };

  // Texto simples: arruma `&` e `<` soltos, preservando entidades já válidas.
  const fixed = text
    .replace(/&(?!(?:amp|lt|gt|quot|apos|#\d+|#x[0-9a-f]+);)/gi, "&amp;")
    .replace(/<(?![/!?]|[a-z])/gi, "&lt;")
    .replace(/>/g, "&gt;");
  const changed = fixed !== text;
  return { value: fixed, changed, reason: changed ? I18N("escaped") : undefined };
}

// --- Preço e GTIN -------------------------------------------------------------------

/** "R$ 1.299,90" / "1299.9 BRL" / "199,9" -> { amount: "1299.90", currency } */
export function normalizePrice(raw: string, defaultCurrency: string): { value: string; currency: string } | null {
  const text = decodeEntities(unwrapCdata(raw).text).trim();
  if (!text) return null;
  const currency = (text.match(/\b([A-Z]{3})\b/)?.[1] ?? (/R\$/.test(text) ? "BRL" : defaultCurrency)).toUpperCase();
  const numeric = text.replace(/[^\d.,]/g, "");
  if (!/\d/.test(numeric)) return null;

  let normalized: string;
  const lastComma = numeric.lastIndexOf(",");
  const lastDot = numeric.lastIndexOf(".");
  if (lastComma > lastDot) normalized = numeric.replace(/\./g, "").replace(",", "."); // 1.299,90
  else if (lastDot > lastComma && lastComma !== -1) normalized = numeric.replace(/,/g, ""); // 1,299.90
  else if (lastComma !== -1) normalized = numeric.replace(",", "."); // 199,90
  else normalized = numeric;

  const amount = Number(normalized);
  if (!Number.isFinite(amount) || amount <= 0) return null;
  return { value: amount.toFixed(2), currency };
}

/** Valida GTIN-8/12/13/14 pelo dígito verificador (módulo 10). */
export function isValidGtin(gtin: string): boolean {
  if (!/^\d{8}$|^\d{12,14}$/.test(gtin)) return false;
  const digits = gtin.split("").map(Number);
  const check = digits.pop()!;
  const sum = digits.reverse().reduce((acc, d, i) => acc + d * (i % 2 === 0 ? 3 : 1), 0);
  return (10 - (sum % 10)) % 10 === check;
}

// --- Leitura/escrita de campos ------------------------------------------------------

function fieldRegex(name: string): RegExp {
  // <g:price>..</g:price> ou <price>..</price>; também aceita <g:price/> (vazio)
  return new RegExp(`<((?:g:)?${name})(\\s[^>]*)?(?:/>|>([\\s\\S]*?)</\\1\\s*>)`, "i");
}

interface FieldMatch {
  full: string;
  tag: string;
  attrs: string;
  content: string;
}

function findField(body: string, name: string): FieldMatch | null {
  const m = body.match(fieldRegex(name));
  return m ? { full: m[0], tag: m[1], attrs: m[2] ?? "", content: m[3] ?? "" } : null;
}

const replaceField = (body: string, field: FieldMatch, content: string) =>
  body.replace(field.full, () => `<${field.tag}${field.attrs}>${content}</${field.tag}>`);

const slugify = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

// --- Função principal -----------------------------------------------------------------

export function fixMerchantXml(input: string, options: XmlFixOptions = {}): XmlFixResult {
  const { htmlMode = "strip", defaultCurrency = "BRL", generateMissingIds = true } = options;
  const issues: XmlIssue[] = [];
  const prefix = /xmlns:g\s*=/.test(input) ? "g:" : "";
  const seenIds = new Map<string, number>();
  let itemCount = 0;

  const source = input.replace(/^﻿/, "");

  const xml = source.replace(/(<(item|entry)\b[^>]*>)([\s\S]*?)(<\/\2\s*>)/gi, (_all, open: string, _t: string, original: string, close: string) => {
    const index = itemCount++;
    let body = original;
    const report = (field: string, severity: IssueSeverity, message: string) =>
      issues.push({ itemIndex: index, itemId, field, severity, message });

    // ID --------------------------------------------------------------------------------
    let itemId: string | null = null;
    const idField = findField(body, "id");
    const idValue = idField ? decodeEntities(unwrapCdata(idField.content).text).trim() : "";
    if (idValue) {
      itemId = idValue;
    } else if (generateMissingIds) {
      const link = findField(body, "link");
      const slug = link ? slugify(decodeEntities(unwrapCdata(link.content).text).split("/").filter(Boolean).pop() ?? "") : "";
      itemId = slug || `item-${index + 1}`;
      body = idField ? replaceField(body, idField, escapeXml(itemId)) : `\n<${prefix}id>${escapeXml(itemId)}</${prefix}id>${body}`;
      report("id", "fixed", I18N("idGenerated", { id: itemId }));
    } else {
      report("id", "error", I18N("idMissing"));
    }
    if (itemId) {
      if (seenIds.has(itemId)) report("id", "error", I18N("idDuplicate", { n: seenIds.get(itemId)! + 1 }));
      else seenIds.set(itemId, index);
    }

    // Campos de texto: HTML, & e < soltos -------------------------------------------------
    for (const name of ["title", "description", "product_type", "brand"]) {
      const field = findField(body, name);
      if (!field) continue;
      const result = sanitizeText(field.content, htmlMode);
      if (result.changed) {
        body = replaceField(body, field, result.value);
        report(name, "fixed", result.reason ?? "");
      }
      const plain = decodeEntities(stripHtml(unwrapCdata(result.value).text));
      if (name === "title" && plain.length > 150) report(name, "warning", I18N("titleLong", { n: plain.length }));
      if (name === "description" && plain.length > 5000) report(name, "warning", I18N("descLong", { n: plain.length }));
    }

    // Campos obrigatórios --------------------------------------------------------------------
    for (const name of REQUIRED_TEXT_FIELDS) {
      const field = findField(body, name);
      const text = field ? decodeEntities(stripHtml(unwrapCdata(field.content).text)).trim() : "";
      if (!text) report(name, "error", I18N(field ? "requiredEmpty" : "requiredMissing", { field: name }));
    }
    if (!findField(body, "availability")) report("availability", "warning", I18N("availabilityMissing"));

    // Preço -----------------------------------------------------------------------------------
    for (const name of ["price", "sale_price"]) {
      const field = findField(body, name);
      if (!field) {
        if (name === "price") report("price", "error", I18N("priceMissing"));
        continue;
      }
      const raw = field.content;
      if (!raw.trim()) {
        report(name, "error", name === "price" ? I18N("priceEmpty") : I18N("salePriceEmpty"));
        continue;
      }
      const price = normalizePrice(raw, defaultCurrency);
      if (!price) {
        report(name, "error", I18N("priceInvalid", { value: decodeEntities(raw).trim() }));
        continue;
      }
      const normalized = `${price.value} ${price.currency}`;
      if (normalized !== raw.trim()) {
        body = replaceField(body, field, normalized);
        report(name, "fixed", I18N("priceNormalized", { value: normalized }));
      }
    }

    // GTIN --------------------------------------------------------------------------------------
    const gtinField = findField(body, "gtin");
    if (gtinField) {
      const digits = decodeEntities(unwrapCdata(gtinField.content).text).replace(/[\s.-]/g, "");
      if (!digits) {
        report("gtin", "error", I18N("gtinEmpty"));
      } else if (!isValidGtin(digits)) {
        report("gtin", "error", I18N("gtinInvalid", { gtin: digits }));
      } else if (digits !== gtinField.content.trim()) {
        body = replaceField(body, gtinField, digits);
        report("gtin", "fixed", I18N("gtinMask"));
      }
    } else if (!findField(body, "mpn") && !findField(body, "identifier_exists")) {
      report("gtin", "warning", I18N("noIdentifiers"));
    }

    return `${open}${body}${close}`;
  });

  if (itemCount === 0) {
    issues.push({ itemIndex: -1, itemId: null, field: "feed", severity: "error", message: I18N("noItems") });
  }

  const stats = {
    items: itemCount,
    fixed: issues.filter((i) => i.severity === "fixed").length,
    warnings: issues.filter((i) => i.severity === "warning").length,
    errors: issues.filter((i) => i.severity === "error").length,
  };
  return { xml, issues, stats, wellFormed: checkWellFormed(xml) };
}

/** Confere se o XML final é bem formado (DOMParser do navegador). */
export function checkWellFormed(xml: string): boolean | null {
  if (typeof DOMParser === "undefined") return null;
  const doc = new DOMParser().parseFromString(xml, "application/xml");
  return doc.getElementsByTagName("parsererror").length === 0;
}

export function xmlToBlob(xml: string): Blob {
  return new Blob([xml], { type: "application/xml;charset=utf-8" });
}
