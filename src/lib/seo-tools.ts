// Dicionário de SEO: uma entrada por página pública, cada uma para UMA intenção de busca real.
// Sinônimos ("abrir", "ler", "ver") entram no texto e no FAQ, nunca em páginas separadas.
// Aqui fica só a ESTRUTURA (slug, tipo, relacionadas, ofertas), leve o bastante para o middleware.
// Os textos de cada idioma ficam em i18n/messages/seo.ts e são montados em lib/seo-content.ts.
// Preços e limites vêm de lib/content; nada de avaliações inventadas.

export type SeoKind = "viewer" | "converter" | "repair";

/** "free" = só gratuito; "conv" = gratuito com limite + PRO; "pro" = só PRO. */
export type SeoOfferKind = "free" | "conv" | "pro";

export type BankKey = "nubank" | "itau" | "bradesco";

export interface SeoToolDef {
  slug: string;
  /** Caminho público canônico desta landing (o `Link` aplica idioma e segmentos traduzidos). */
  path: string;
  /** "inspector" embute o Inspetor Universal; "cta" leva à ferramenta protegida; "page" = a ferramenta tem rota própria (app/ferramentas/<slug>). */
  render: "inspector" | "cta" | "page";
  kind: SeoKind;
  related: string[];
  offers: SeoOfferKind;
  /** Categoria do schema.org (padrão: BusinessApplication). */
  applicationCategory?: string;
  /** Destino do CTA (render "cta"). */
  ctaHref?: string;
  /** Página de banco: os textos vêm do modelo `seo.bank` com o nome do banco. */
  bank?: { key: BankKey; name: string };
}

const BANKS: { slug: string; key: BankKey; name: string }[] = [
  { slug: "pdf-para-ofx-nubank", key: "nubank", name: "Nubank" },
  { slug: "pdf-para-ofx-itau", key: "itau", name: "Itaú" },
  { slug: "pdf-para-ofx-bradesco", key: "bradesco", name: "Bradesco" },
];

const tool = (slug: string, def: Omit<SeoToolDef, "slug" | "path">): SeoToolDef => ({ slug, path: `/ferramentas/${slug}`, ...def });

export const SEO_TOOL_DEFS: SeoToolDef[] = [
  tool("visualizador-ofx", {
    render: "inspector",
    kind: "viewer",
    offers: "free",
    related: ["conversor-pdf-para-ofx", "planilha-para-ofx", "visualizador-xml", "visualizador-planilhas"],
  }),
  tool("visualizador-xml", {
    render: "inspector",
    kind: "viewer",
    offers: "free",
    related: ["visualizador-ofx", "visualizador-json", "reparador-xml-merchant", "visualizador-planilhas"],
  }),
  tool("visualizador-planilhas", {
    render: "inspector",
    kind: "viewer",
    offers: "free",
    related: ["visualizador-ofx", "visualizador-json", "visualizador-xml"],
  }),
  tool("visualizador-json", {
    render: "inspector",
    kind: "viewer",
    offers: "free",
    related: ["visualizador-xml", "visualizador-planilhas", "visualizador-ofx"],
  }),
  tool("conversor-pdf-para-ofx", {
    render: "cta",
    kind: "converter",
    offers: "conv",
    ctaHref: "/ferramentas/pdf-para-ofx",
    related: ["planilha-para-ofx", ...BANKS.map((b) => b.slug), "visualizador-ofx"],
  }),
  ...BANKS.map((b) =>
    tool(b.slug, {
      render: "cta",
      kind: "converter",
      offers: "conv",
      ctaHref: "/ferramentas/pdf-para-ofx",
      bank: { key: b.key, name: b.name },
      related: ["conversor-pdf-para-ofx", "visualizador-ofx", ...BANKS.filter((o) => o.slug !== b.slug).map((o) => o.slug)],
    }),
  ),
  tool("planilha-para-ofx", {
    render: "page",
    kind: "converter",
    offers: "free",
    related: ["conversor-pdf-para-ofx", "visualizador-ofx", "visualizador-planilhas", "pdf-para-ofx-nubank"],
  }),
  tool("gerador-senhas", {
    render: "page",
    kind: "viewer",
    offers: "free",
    applicationCategory: "SecurityApplication",
    related: ["gerador-qrcode", "visualizador-json", "visualizador-ofx"],
  }),
  tool("gerador-qrcode", {
    render: "page",
    kind: "viewer",
    offers: "free",
    applicationCategory: "UtilitiesApplication",
    related: ["gerador-senhas", "visualizador-json", "visualizador-xml"],
  }),
  tool("reparador-xml-merchant", {
    render: "cta",
    kind: "repair",
    offers: "pro",
    ctaHref: "/ferramentas/reparador-xml",
    related: ["visualizador-xml", "visualizador-planilhas", "visualizador-json"],
  }),
];

/** Ferramentas 100% client-side (sem chamar API) liberadas sem login, além das landings acima. */
export const PUBLIC_CLIENT_TOOL_PATHS = ["/ferramentas/inspetor-arquivos", "/ferramentas/mock-data-br"];

/** Todo caminho (canônico) de ferramenta acessível sem login (match exato). */
export function publicToolPaths(): string[] {
  return [...SEO_TOOL_DEFS.map((t) => t.path), ...PUBLIC_CLIENT_TOOL_PATHS];
}

export function getSeoToolDef(slug: string): SeoToolDef | undefined {
  return SEO_TOOL_DEFS.find((t) => t.slug === slug);
}

/** Slugs gerados pela rota dinâmica (as ferramentas com rota própria ficam de fora). */
export function dynamicSeoSlugs(): string[] {
  return SEO_TOOL_DEFS.filter((t) => t.render !== "page").map((t) => t.slug);
}
