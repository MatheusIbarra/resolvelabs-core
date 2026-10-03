import type { Metadata } from "next";
import { absoluteUrl } from "./site";
import type { SeoTool } from "./seo-content";
import type { PostMeta } from "./blog";
import { HREFLANG, type Locale } from "@/i18n/config";
import { localizePath } from "@/i18n/paths";
import { buildAlternates, buildOpenGraph } from "@/i18n/seo";
import { getTranslator } from "@/i18n/server";

const BRAND = "ResolveLabs";

export function buildSeoMetadata(locale: Locale, tool: SeoTool): Metadata {
  const title = `${tool.title} | ${BRAND}`;
  const alternates = buildAlternates(locale, tool.path);
  return {
    title,
    description: tool.description,
    alternates,
    openGraph: buildOpenGraph(locale, {
      type: "website",
      url: alternates.canonical as string,
      title,
      description: tool.description,
      images: [{ url: "/og-image.png", width: 1200, height: 630, alt: tool.h1 }],
    }),
    twitter: { card: "summary_large_image", title, description: tool.description, images: ["/og-image.png"] },
  };
}

/** URL absoluta de um caminho canônico no idioma pedido. */
const urlOf = (locale: Locale, canonicalPath: string) => absoluteUrl(localizePath(locale, canonicalPath));

/** SoftwareApplication: app web no navegador, com as ofertas reais (gratuito e/ou PRO). Sem avaliações. */
export function softwareApplicationSchema(locale: Locale, tool: SeoTool) {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: tool.h1,
    description: tool.description,
    url: urlOf(locale, tool.path),
    applicationCategory: tool.applicationCategory ?? "BusinessApplication",
    operatingSystem: getTranslator(locale).t("seo.schema.operatingSystem"),
    inLanguage: HREFLANG[locale],
    featureList: tool.features,
    offers: tool.offers.map((o) => ({
      "@type": "Offer",
      name: o.name,
      price: o.price.toFixed(2),
      priceCurrency: "BRL",
      description: o.description,
    })),
    publisher: { "@type": "Organization", name: BRAND, url: urlOf(locale, "/") },
  };
}

/** FAQPage espelha exatamente o FAQ visível na página. */
export function faqPageSchema(locale: Locale, tool: SeoTool) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    inLanguage: HREFLANG[locale],
    mainEntity: tool.faq.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };
}

export function blogPostingSchema(locale: Locale, post: PostMeta) {
  const url = urlOf(locale, `/blog/${post.slug}`);
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    dateModified: post.updated ?? post.date,
    inLanguage: HREFLANG[locale],
    url,
    mainEntityOfPage: url,
    image: absoluteUrl("/og-image.png"),
    author: { "@type": "Organization", name: post.author },
    publisher: { "@type": "Organization", name: BRAND, url: urlOf(locale, "/") },
  };
}

export function blogBreadcrumbSchema(locale: Locale, post: PostMeta) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: getTranslator(locale).t("seo.schema.home"), item: urlOf(locale, "/") },
      { "@type": "ListItem", position: 2, name: "Blog", item: urlOf(locale, "/blog") },
      { "@type": "ListItem", position: 3, name: post.title, item: urlOf(locale, `/blog/${post.slug}`) },
    ],
  };
}

export function breadcrumbSchema(locale: Locale, tool: SeoTool) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: getTranslator(locale).t("seo.schema.home"), item: urlOf(locale, "/") },
      { "@type": "ListItem", position: 2, name: tool.shortName, item: urlOf(locale, tool.path) },
    ],
  };
}
