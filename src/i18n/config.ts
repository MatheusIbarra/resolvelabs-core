// Configuração central de idiomas. Para adicionar um idioma: inclua o código em LOCALES, os metadados abaixo,
// os textos em cada arquivo de `messages/*.ts` e os slugs/segmentos em `paths.ts`. O TypeScript aponta o que faltar.

export const LOCALES = ["en", "es", "pt"] as const;
export type Locale = (typeof LOCALES)[number];

/** Idioma usado quando o navegador não indica nenhum idioma suportado. Troque aqui para mudar o padrão. */
export const DEFAULT_LOCALE: Locale = "en";

/** Cookie com a escolha manual do idioma (gravado pelo seletor de idioma). */
export const LOCALE_COOKIE = "NEXT_LOCALE";
export const LOCALE_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

/** Nome de cada idioma no próprio idioma (aparece no seletor). */
export const LOCALE_NAMES: Record<Locale, string> = { en: "English", es: "Español", pt: "Português" };

/** Código BCP 47 usado em `<html lang>`, hreflang e JSON-LD. */
export const HREFLANG: Record<Locale, string> = { en: "en", es: "es", pt: "pt-BR" };

/** Locale do Open Graph. */
export const OG_LOCALE: Record<Locale, string> = { en: "en_US", es: "es_ES", pt: "pt_BR" };

/** Locale do Stripe Checkout. */
export const STRIPE_LOCALE: Record<Locale, "en" | "es" | "pt-BR"> = { en: "en", es: "es", pt: "pt-BR" };

/** Locale de Intl (datas e números). */
export const INTL_LOCALE: Record<Locale, string> = { en: "en-US", es: "es-ES", pt: "pt-BR" };

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value);
}

/** Escolhe o idioma a partir do cabeçalho Accept-Language (respeita q-values). Sem correspondência, usa o padrão. */
export function negotiateLocale(acceptLanguage: string | null | undefined): Locale {
  if (!acceptLanguage || acceptLanguage.length > 500) return DEFAULT_LOCALE;
  const ranked = acceptLanguage
    .split(",")
    .map((part, index) => {
      const [tag, ...params] = part.trim().split(";");
      const q = Number(params.find((p) => p.trim().startsWith("q="))?.trim().slice(2) ?? "1");
      return { tag: tag.trim().toLowerCase(), q: Number.isFinite(q) ? q : 0, index };
    })
    .filter((x) => x.tag && x.q > 0)
    .sort((a, b) => b.q - a.q || a.index - b.index);
  for (const { tag } of ranked) {
    const base = tag.split("-")[0];
    if (isLocale(base)) return base;
  }
  return DEFAULT_LOCALE;
}
