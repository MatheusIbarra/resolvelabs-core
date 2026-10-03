// Junta a estrutura (lib/seo-tools) com os textos do idioma pedido (i18n/messages/seo). Só no servidor.
import { FREE_PDF_LIMIT, PRO_PRICE_CENTS, PRO_TRIAL_DAYS } from "./content";
import { getSeoToolDef, SEO_TOOL_DEFS, type SeoKind, type SeoToolDef } from "./seo-tools";
import type { Locale } from "@/i18n/config";
import { getTranslator } from "@/i18n/server";
import type { ToolText } from "@/i18n/messages/seo";

export interface SeoFaq {
  q: string;
  a: string;
}

export interface SeoOffer {
  name: string;
  /** Preço em reais (0 = gratuito). */
  price: number;
  description: string;
}

export interface SeoTool {
  slug: string;
  /** Caminho canônico (sem idioma) desta landing. */
  path: string;
  render: SeoToolDef["render"];
  kind: SeoKind;
  /** <title> da página (a marca é adicionada no fim). */
  title: string;
  description: string;
  h1: string;
  intro: string;
  /** Nome curto usado no breadcrumb e nos links internos. */
  shortName: string;
  features: string[];
  /** Passos opcionais (ex.: como baixar o extrato em cada banco). */
  steps?: { title: string; items: string[] };
  faq: SeoFaq[];
  related: string[];
  /** Termos pesquisados que a página cobre. Só documentação interna; o Google ignora meta keywords. */
  keywords: string[];
  offers: SeoOffer[];
  /** Categoria do schema.org (padrão: BusinessApplication). */
  applicationCategory?: string;
  /** Texto do cartão de privacidade (ausente = padrão do idioma). */
  privacy?: string;
  /** CTA para ferramentas que não rodam dentro da página. */
  cta?: { label: string; href: string; note: string };
}

function build(locale: Locale, def: SeoToolDef): SeoTool {
  const tr = getTranslator(locale);
  const { t, raw } = tr;
  const price = t("common.pro.priceLabel");
  const vars = { freeLimit: FREE_PDF_LIMIT, price, trialDays: PRO_TRIAL_DAYS };
  const fill = (text: string, extra: Record<string, string | number> = {}) =>
    text.replace(/\{(\w+)\}/g, (m, k: string) => String({ ...vars, ...extra }[k] ?? m));

  const proPrice = PRO_PRICE_CENTS / 100;
  const offerOf = (key: "free" | "convFree" | "convPro" | "pro", priceValue: number): SeoOffer => {
    const o = raw(`seo.offers.${key}`);
    return { name: o.name, price: priceValue, description: fill(o.description) };
  };
  const offers: SeoOffer[] =
    def.offers === "free"
      ? [offerOf("free", 0)]
      : def.offers === "conv"
        ? [offerOf("convFree", 0), offerOf("convPro", proPrice)]
        : [offerOf("pro", proPrice)];

  const base = { slug: def.slug, path: def.path, render: def.render, kind: def.kind, related: def.related, offers, applicationCategory: def.applicationCategory };
  const ctaHref = def.ctaHref;

  if (def.bank) {
    const b = raw("seo.bank");
    const item = b.items[def.bank.key];
    const bankVars = { bank: def.bank.name, privacy: raw("seo.privacy"), note: raw("seo.bankStepsNote") };
    const f = (s: string) => fill(s, bankVars);
    return {
      ...base,
      shortName: f(b.shortName),
      title: f(b.title),
      description: f(b.description),
      h1: f(b.h1),
      intro: f(b.intro),
      features: b.features.map(f),
      steps: { title: f(b.stepsTitle), items: item.steps },
      faq: [item.extra, b.faq.free, b.faq.privacy, b.faq.diff].map((x) => ({ q: f(x.q), a: f(x.a) })),
      keywords: b.keywords.map(f),
      cta: ctaHref ? { label: b.cta.label, href: ctaHref, note: b.cta.note } : undefined,
    };
  }

  const tt = (raw("seo.tools") as unknown as Record<string, ToolText | undefined>)[def.slug];
  if (!tt) throw new Error(`[seo] sem texto para "${def.slug}" em ${locale}`);
  return {
    ...base,
    shortName: tt.shortName,
    title: tt.title,
    description: fill(tt.description),
    h1: tt.h1,
    intro: fill(tt.intro),
    features: tt.features.map((s) => fill(s)),
    faq: tt.faq.map((x) => ({ q: fill(x.q), a: fill(x.a) })),
    keywords: tt.keywords,
    privacy: tt.privacy,
    cta: tt.cta && ctaHref ? { label: tt.cta.label, href: ctaHref, note: tt.cta.note } : undefined,
  };
}

export function getSeoTool(locale: Locale, slug: string): SeoTool | undefined {
  const def = getSeoToolDef(slug);
  return def ? build(locale, def) : undefined;
}

export function listSeoTools(locale: Locale): SeoTool[] {
  return SEO_TOOL_DEFS.map((d) => build(locale, d));
}

export function relatedTools(locale: Locale, tool: SeoTool): SeoTool[] {
  return tool.related.map((slug) => getSeoTool(locale, slug)).filter((t): t is SeoTool => Boolean(t));
}
