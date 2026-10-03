import { activeTranslator } from "@/i18n/active";
/**
 * Nós de árvore com filhos calculados sob demanda (só quando o usuário expande): permite navegar em JSON/XML
 * com centenas de milhares de itens sem montar a árvore inteira na memória nem no DOM.
 */
export interface TreeNode {
  id: string;
  label: string;
  /** Resumo exibido na linha: valor primitivo ou "{3}" / "[10]" / "<tag>". */
  summary: string;
  type: "object" | "array" | "string" | "number" | "boolean" | "null" | "element" | "attribute" | "text";
  childCount: number;
  children(): TreeNode[];
  /** Texto copiado ao clicar em copiar no nó. */
  copy(): string;
}

const MAX_SUMMARY = 120;
const clip = (s: string) => (s.length > MAX_SUMMARY ? `${s.slice(0, MAX_SUMMARY)}…` : s);

// --- JSON ---------------------------------------------------------------------------

export function jsonNode(value: unknown, label: string, id = "$"): TreeNode {
  if (Array.isArray(value)) {
    return {
      id, label, summary: `[${value.length}]`, type: "array", childCount: value.length,
      children: () => value.map((v, i) => jsonNode(v, String(i), `${id}[${i}]`)),
      copy: () => JSON.stringify(value, null, 2),
    };
  }
  if (value !== null && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>);
    return {
      id, label, summary: `{${entries.length}}`, type: "object", childCount: entries.length,
      children: () => entries.map(([k, v]) => jsonNode(v, k, `${id}.${k}`)),
      copy: () => JSON.stringify(value, null, 2),
    };
  }
  const type = value === null ? "null" : (typeof value as "string" | "number" | "boolean");
  const text = value === null ? "null" : typeof value === "string" ? JSON.stringify(value) : String(value);
  return { id, label, summary: clip(text), type, childCount: 0, children: () => [], copy: () => (typeof value === "string" ? value : text) };
}

// --- XML ------------------------------------------------------------------------------

function elementOpenSummary(el: Element): string {
  const attrs = Array.from(el.attributes).slice(0, 3).map((a) => `${a.name}="${a.value}"`);
  return clip(attrs.length ? attrs.join(" ") + (el.attributes.length > 3 ? " …" : "") : "");
}

export function xmlNode(el: Element, id = "/"): TreeNode {
  const attributes = Array.from(el.attributes);
  const childElements = Array.from(el.children);
  const ownText = Array.from(el.childNodes)
    .filter((n) => n.nodeType === 3 || n.nodeType === 4)
    .map((n) => n.nodeValue ?? "")
    .join("")
    .trim();

  // Elemento folha com só texto: mostra o texto na própria linha.
  const isLeaf = childElements.length === 0;
  return {
    id,
    label: el.tagName,
    summary: isLeaf && ownText ? clip(ownText) : elementOpenSummary(el),
    type: "element",
    childCount: attributes.length + childElements.length + (!isLeaf && ownText ? 1 : 0),
    children: () => {
      const nodes: TreeNode[] = attributes.map((a) => ({
        id: `${id}@${a.name}`, label: `@${a.name}`, summary: clip(JSON.stringify(a.value)), type: "attribute" as const,
        childCount: 0, children: () => [], copy: () => a.value,
      }));
      if (!isLeaf && ownText) {
        nodes.push({ id: `${id}#text`, label: "#text", summary: clip(ownText), type: "text", childCount: 0, children: () => [], copy: () => ownText });
      }
      childElements.forEach((child, i) => nodes.push(xmlNode(child, `${id}/${child.tagName}[${i}]`)));
      return nodes;
    },
    copy: () => formatXml(el),
  };
}

/** XML com indentação (2 espaços), preservando atributos, texto, CDATA e comentários. */
export function formatXml(node: Node, indent = 0): string {
  const pad = "  ".repeat(indent);
  if (node.nodeType === 9) return Array.from(node.childNodes).map((n) => formatXml(n, 0)).filter(Boolean).join("\n");
  if (node.nodeType === 3) return node.nodeValue?.trim() ? `${pad}${escapeText(node.nodeValue.trim())}` : "";
  if (node.nodeType === 4) return `${pad}<![CDATA[${node.nodeValue}]]>`;
  if (node.nodeType === 8) return `${pad}<!--${node.nodeValue}-->`;
  if (node.nodeType !== 1) return "";

  const el = node as Element;
  const attrs = Array.from(el.attributes).map((a) => ` ${a.name}="${a.value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;")}"`).join("");
  const kids = Array.from(el.childNodes).map((n) => formatXml(n, indent + 1)).filter(Boolean);
  if (kids.length === 0) return `${pad}<${el.tagName}${attrs}/>`;
  const onlyText = el.childElementCount === 0 && kids.length === 1 && el.firstChild?.nodeType !== 8;
  if (onlyText) return `${pad}<${el.tagName}${attrs}>${kids[0].trim()}</${el.tagName}>`;
  return `${pad}<${el.tagName}${attrs}>\n${kids.join("\n")}\n${pad}</${el.tagName}>`;
}

const escapeText = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export interface ParsedXml {
  root: Element;
  doc: Document;
}

export function parseXml(text: string): ParsedXml {
  const doc = new DOMParser().parseFromString(text.replace(/^﻿/, ""), "application/xml");
  const err = doc.getElementsByTagName("parsererror")[0];
  if (err) {
    const message = err.textContent?.split("\n").find((l) => l.trim() && !/^This page/i.test(l))?.trim() ?? activeTranslator().t("tools.inspector.xmlInvalidShort");
    throw new Error(activeTranslator().t("tools.inspector.xmlInvalid", { message: message.slice(0, 160) }));
  }
  return { root: doc.documentElement, doc };
}

/** Linha e coluna do erro de JSON.parse quando o navegador informa a posição. */
export function parseJson(text: string): unknown {
  try {
    return JSON.parse(text.replace(/^﻿/, ""));
  } catch (err) {
    const message = err instanceof Error ? err.message : activeTranslator().t("tools.inspector.jsonInvalidShort");
    const pos = message.match(/position (\d+)/)?.[1];
    if (pos) {
      const before = text.slice(0, Number(pos));
      const line = before.split("\n").length;
      const col = before.length - before.lastIndexOf("\n");
      throw new Error(activeTranslator().t("tools.inspector.jsonLine", { line, col, message: message.replace(/ in JSON at position \d+.*/, "").slice(0, 120) }));
    }
    throw new Error(activeTranslator().t("tools.inspector.jsonInvalid", { message: message.slice(0, 160) }));
  }
}
