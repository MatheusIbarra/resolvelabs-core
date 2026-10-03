"use client";

import { usePathname as useRawPathname } from "next/navigation";
import { HREFLANG, LOCALES, LOCALE_COOKIE, LOCALE_COOKIE_MAX_AGE_SECONDS, LOCALE_NAMES, isLocale } from "./config";
import { useI18n } from "./I18nProvider";
import { switchLocalePath } from "./paths";

/**
 * Seletor de idioma. Grava a escolha no cookie (que vence o idioma do navegador) e abre a mesma página no outro idioma.
 * Os idiomas vêm de `LOCALES` em `i18n/config.ts`.
 */
export default function LanguageSwitcher({ className = "" }: { className?: string }) {
  const { locale, t } = useI18n();
  const pathname = useRawPathname();

  const change = (value: string) => {
    if (!isLocale(value) || value === locale) return;
    document.cookie = `${LOCALE_COOKIE}=${value}; path=/; max-age=${LOCALE_COOKIE_MAX_AGE_SECONDS}; samesite=lax`;
    // Páginas com URL própria por idioma (artigos do blog) declaram as alternativas em <link rel="alternate" hreflang>.
    const alt = document.querySelector<HTMLLinkElement>(`link[rel="alternate"][hreflang="${HREFLANG[value]}"]`);
    const target = alt ? new URL(alt.href).pathname : switchLocalePath(pathname ?? "/", value);
    window.location.assign(`${target}${window.location.search}${window.location.hash}`);
  };

  return (
    <label className={`inline-flex items-center gap-1.5 text-sm text-stone-600 ${className}`}>
      <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24" aria-hidden>
        <circle cx="12" cy="12" r="9" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12h18M12 3c2.5 2.7 3.8 5.7 3.8 9s-1.3 6.3-3.8 9c-2.5-2.7-3.8-5.7-3.8-9S9.5 5.7 12 3z" />
      </svg>
      <span className="sr-only">{t("common.language.label")}</span>
      <select
        value={locale}
        onChange={(e) => change(e.target.value)}
        aria-label={t("common.language.switchTo")}
        className="cursor-pointer rounded-md border border-stone-200 bg-white py-1 pl-2 pr-6 text-sm font-medium text-stone-700 hover:border-stone-300 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
      >
        {LOCALES.map((l) => (
          <option key={l} value={l} lang={l}>
            {LOCALE_NAMES[l]}
          </option>
        ))}
      </select>
    </label>
  );
}
