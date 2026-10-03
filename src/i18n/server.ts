import { notFound, redirect as nextRedirect } from "next/navigation";
import { DEFAULT_LOCALE, LOCALE_COOKIE, isLocale, negotiateLocale, type Locale } from "./config";
import { DICTIONARIES, type Dictionary } from "./messages";
import { localizePath } from "./paths";
import { createTranslator, type Translator } from "./translator";

export type ServerTranslator = Translator<Dictionary>;

const cache = new Map<Locale, ServerTranslator>();

/** Tradutor completo para server components, metadata e rotas de API. */
export function getTranslator(locale: Locale): ServerTranslator {
  let tr = cache.get(locale);
  if (!tr) {
    tr = createTranslator(DICTIONARIES[locale], locale);
    cache.set(locale, tr);
  }
  return tr;
}

/** Redireciona para um caminho canônico já no idioma certo. */
export function redirect(locale: Locale, path: string): never {
  return nextRedirect(localizePath(locale, path));
}

/**
 * Idioma de uma requisição de API: cabeçalho `x-locale` (enviado pelo app) > cookie > Accept-Language > padrão.
 * Sempre validado contra a lista de idiomas suportados: nada que vem do cliente é usado cru.
 */
export function getRequestLocale(request: Request): Locale {
  const header = request.headers.get("x-locale");
  if (isLocale(header)) return header;
  const cookie = request.headers.get("cookie")?.match(new RegExp(`(?:^|;\\s*)${LOCALE_COOKIE}=([^;]+)`))?.[1];
  if (isLocale(cookie)) return cookie;
  const accept = request.headers.get("accept-language");
  return accept ? negotiateLocale(accept) : DEFAULT_LOCALE;
}

/** Tradutor do idioma da requisição (rotas de API). */
export function requestTranslator(request: Request): ServerTranslator {
  return getTranslator(getRequestLocale(request));
}

export type LangParams = { params: Promise<{ lang: string }> };

/** Idioma validado do segmento [lang] da rota (qualquer outro valor vira 404). */
export async function pageLocale(params: LangParams["params"]): Promise<Locale> {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  return lang;
}
