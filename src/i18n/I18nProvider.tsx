"use client";

import { createContext, useContext, useMemo } from "react";
import type { Locale } from "./config";
import type { ClientDictionary } from "./messages";
import { setActiveTranslator } from "./active";
import { createTranslator, type Translator } from "./translator";

export type ClientTranslator = Translator<ClientDictionary>;

const I18nContext = createContext<ClientTranslator | null>(null);

export function I18nProvider({ locale, dictionary, children }: { locale: Locale; dictionary: ClientDictionary; children: React.ReactNode }) {
  const value = useMemo(() => createTranslator(dictionary, locale), [dictionary, locale]);
  // Disponibiliza o tradutor para código fora do React (só no navegador; eventos sempre rodam depois da hidratação).
  if (typeof window !== "undefined") setActiveTranslator(value);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

/** Tradutor do idioma atual (client components). Em server components use `getTranslator(locale)`. */
export function useI18n(): ClientTranslator {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n fora do I18nProvider");
  return ctx;
}

export function useLocale(): Locale {
  return useI18n().locale;
}
