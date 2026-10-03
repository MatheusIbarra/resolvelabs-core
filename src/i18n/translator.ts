import { INTL_LOCALE, type Locale } from "./config";
import type { NodePath, PathValue, Plural, PluralPath, StringPath } from "./types";

export type Vars = Record<string, string | number>;

function lookup(dict: unknown, key: string): unknown {
  let node = dict;
  for (const part of key.split(".")) {
    if (node === null || typeof node !== "object") return undefined;
    node = (node as Record<string, unknown>)[part];
  }
  return node;
}

function interpolate(text: string, vars?: Vars): string {
  if (!vars) return text;
  return text.replace(/\{(\w+)\}/g, (match, name: string) => (name in vars ? String(vars[name]) : match));
}

export interface Translator<D> {
  locale: Locale;
  /** Texto simples, com `{variavel}` opcional. */
  t: (key: StringPath<D>, vars?: Vars) => string;
  /** Texto com plural (`{ one, other }`); `{count}` já vem preenchido. */
  tn: (key: PluralPath<D>, count: number, vars?: Vars) => string;
  /** Valor cru (listas, objetos). */
  raw: <K extends NodePath<D>>(key: K) => PathValue<D, K>;
  /** Data curta (dd/mm/aaaa no pt, mm/dd/aaaa no en...). */
  date: (value: string | number | Date | null | undefined, options?: Intl.DateTimeFormatOptions) => string;
  /** Data e hora curtas (dd/mm hh:mm no pt). */
  dateTime: (value: string | number | Date | null | undefined, options?: Intl.DateTimeFormatOptions) => string;
  number: (value: number, options?: Intl.NumberFormatOptions) => string;
}

export function createTranslator<D>(dict: D, locale: Locale): Translator<D> {
  const intl = INTL_LOCALE[locale];
  const rules = new Intl.PluralRules(intl);
  return {
    locale,
    t(key, vars) {
      const value = lookup(dict, key);
      if (typeof value !== "string") {
        if (process.env.NODE_ENV !== "production") console.warn(`[i18n] chave ausente: ${locale}:${key}`);
        return key;
      }
      return interpolate(value, vars);
    },
    tn(key, count, vars) {
      const value = lookup(dict, key) as Plural | undefined;
      if (!value || typeof value !== "object") return key;
      const form = rules.select(count) === "one" ? value.one : value.other;
      return interpolate(form, { count: new Intl.NumberFormat(intl).format(count), ...vars });
    },
    raw: ((key: string) => lookup(dict, key)) as Translator<D>["raw"],
    date(value, options = { day: "2-digit", month: "2-digit", year: "numeric" }) {
      if (value === null || value === undefined || value === "") return "—";
      const d = new Date(value);
      return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString(intl, options);
    },
    dateTime(value, options = { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }) {
      if (value === null || value === undefined || value === "") return "—";
      const d = new Date(value);
      return Number.isNaN(d.getTime()) ? "—" : d.toLocaleString(intl, options);
    },
    number: (value, options) => new Intl.NumberFormat(intl, options).format(value),
  };
}
