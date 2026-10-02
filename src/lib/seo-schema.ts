import type { Metadata } from "next";
import { absoluteUrl } from "./site";
import type { SeoTool } from "./seo-tools";

const BRAND = "ResolveLabs";

export function buildSeoMetadata(tool: SeoTool): Metadata {
  const title = `${tool.title} | ${BRAND}`;
  return {
    title,
    description: tool.description,
    alternates: { canonical: tool.path },
    openGraph: {
      type: "website",
      siteName: BRAND,
      locale: "pt_BR",
      url: tool.path,
      title,
      description: tool.description,
      images: [{ url: "/og-image.png", width: 1200, height: 630, alt: tool.h1 }],
    },
    twitter: { card: "summary_large_image", title, description: tool.description, images: ["/og-image.png"] },
  };
}

/** SoftwareApplication: app web no navegador, com as ofertas reais (gratuito e/ou PRO). Sem avaliações. */
export function softwareApplicationSchema(tool: SeoTool) {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: tool.h1,
    description: tool.description,
    url: absoluteUrl(tool.path),
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web (navegador)",
    inLanguage: "pt-BR",
    featureList: tool.features,
    offers: tool.offers.map((o) => ({
      "@type": "Offer",
      name: o.name,
      price: o.price.toFixed(2),
      priceCurrency: "BRL",
      description: o.description,
    })),
    publisher: { "@type": "Organization", name: BRAND, url: absoluteUrl("/") },
  };
}

/** FAQPage espelha exatamente o FAQ visível na página. */
export function faqPageSchema(tool: SeoTool) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: tool.faq.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };
}

export function breadcrumbSchema(tool: SeoTool) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl("/") },
      { "@type": "ListItem", position: 2, name: tool.shortName, item: absoluteUrl(tool.path) },
    ],
  };
}
