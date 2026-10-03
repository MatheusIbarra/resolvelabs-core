import type { Metadata } from "next";
import { DEFAULT_LOCALE, HREFLANG, LOCALES, OG_LOCALE, type Locale } from "./config";
import { localizePath } from "./paths";

/**
 * `alternates` de uma página: canonical no idioma atual + hreflang de todos os idiomas + x-default.
 * `canonicalPath` é o caminho canônico (sem idioma). `only` limita os idiomas (ex.: artigo sem tradução).
 * `pathFor` permite caminhos diferentes por idioma (ex.: slug do artigo traduzido).
 */
export function buildAlternates(
  locale: Locale,
  canonicalPath: string,
  options?: { only?: readonly Locale[]; pathFor?: (locale: Locale) => string },
): NonNullable<Metadata["alternates"]> {
  const locales = options?.only ?? LOCALES;
  const pathOf = (l: Locale) => localizePath(l, options?.pathFor?.(l) ?? canonicalPath);
  const languages: Record<string, string> = {};
  for (const l of locales) languages[HREFLANG[l]] = pathOf(l);
  const fallback = locales.includes(DEFAULT_LOCALE) ? DEFAULT_LOCALE : locales[0];
  languages["x-default"] = pathOf(fallback);
  return { canonical: pathOf(locale), languages };
}

/** Bloco Open Graph com o locale certo e os outros idiomas como alternativos. */
export function buildOpenGraph(locale: Locale, extra: NonNullable<Metadata["openGraph"]> & { type?: "website" | "article" }) {
  return {
    siteName: "ResolveLabs",
    locale: OG_LOCALE[locale],
    alternateLocale: LOCALES.filter((l) => l !== locale).map((l) => OG_LOCALE[l]),
    ...extra,
  } as NonNullable<Metadata["openGraph"]>;
}

/** Título de páginas privadas/internas: "<título> - ResolveLabs". */
export function privateTitle(title: string): string {
  return `${title} - ResolveLabs`;
}
