// Tradutor "ativo" para código que roda no navegador fora de componentes React (fetch wrappers, utilitários de arquivo).
// O I18nProvider registra o tradutor ao montar; nunca use isto durante a renderização no servidor.
import { DEFAULT_LOCALE, isLocale, type Locale } from "./config";
import type { ClientTranslator } from "./I18nProvider";

let active: ClientTranslator | null = null;

export function setActiveTranslator(tr: ClientTranslator) {
  active = tr;
}

/** Tradutor do idioma atual da página (só no navegador). */
export function activeTranslator(): ClientTranslator {
  if (!active) throw new Error("Tradutor ativo indisponível: use dentro de um evento no navegador.");
  return active;
}

export function activeLocale(): Locale {
  if (active) return active.locale;
  const base = typeof document !== "undefined" ? document.documentElement.lang.split("-")[0] : "";
  return isLocale(base) ? base : DEFAULT_LOCALE;
}

/** `fetch` que informa o idioma da página (`x-locale`), para a API devolver mensagens no idioma certo. */
export function apiFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const headers = new Headers(init?.headers);
  headers.set("x-locale", activeLocale());
  return fetch(input, { ...init, headers });
}
