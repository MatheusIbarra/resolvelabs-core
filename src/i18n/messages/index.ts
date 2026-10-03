import type { Locale } from "../config";
import common from "./common";
import msg from "./msg";
import dashboard from "./dashboard";
import seo from "./seo";
import toolPages from "./toolpages";
import auth from "./auth";
import support from "./support";
import admin from "./admin";
import tools from "./tools";
import blog from "./blog";
import legal from "./legal";
import api from "./api";

/** Todos os domínios de texto. Cada arquivo exporta { en, es, pt } com a mesma forma (garantido pelo TypeScript). */
const DOMAINS = { common, msg, dashboard, seo, toolPages, auth, support, admin, tools, blog, legal, api };

type Domains = typeof DOMAINS;

function build<L extends Locale>(locale: L) {
  return Object.fromEntries(Object.entries(DOMAINS).map(([name, d]) => [name, d[locale]])) as { [K in keyof Domains]: Domains[K][L] };
}

export const DICTIONARIES = { en: build("en"), es: build("es"), pt: build("pt") } as const;

export type Dictionary = (typeof DICTIONARIES)["en"];

/** Domínios que só o servidor usa (conteúdo de SEO, artigos e termos): não vão para o bundle/payload do cliente. */
export type ServerOnlyDomain = "seo" | "blog" | "legal" | "api";
export type ClientDictionary = Omit<Dictionary, ServerOnlyDomain>;

export function clientDictionary(locale: Locale): ClientDictionary {
  const { seo: _seo, blog: _blog, legal: _legal, api: _api, ...client } = DICTIONARIES[locale];
  return client;
}
