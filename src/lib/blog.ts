/// <reference types="vite/client" />
// Motor do blog: posts em content/blog/<idioma>/<slug>.mdx com frontmatter (gray-matter).
// O mesmo nome de arquivo nos três idiomas liga as traduções (hreflang).
// Os arquivos são EMBUTIDOS no build (import.meta.glob) em vez de lidos com `fs` em runtime:
// em deploys serverless (Nitro/Vercel) a pasta content/ não acompanha a função do servidor.
import matter from "gray-matter";
import { isValidToolSlug, validToolSlugs } from "./tool-links";
import { INTL_LOCALE, LOCALES, type Locale } from "@/i18n/config";

export interface PostMeta {
  /** Slug da URL neste idioma (frontmatter `slug`; sem ele, o nome do arquivo). */
  slug: string;
  /** Nome do arquivo: o mesmo nos três idiomas, liga as traduções. */
  key: string;
  title: string;
  description: string;
  /** AAAA-MM-DD */
  date: string;
  /** AAAA-MM-DD */
  updated?: string;
  author: string;
  readingMinutes: number;
}

export interface Post extends PostMeta {
  content: string;
}

const FILES = import.meta.glob("/content/blog/*/*.mdx", { query: "?raw", import: "default", eager: true }) as Record<string, string>;

const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;

/** O YAML converte `date: 2026-10-02` em Date (UTC); normalizamos para string para não perder um dia por fuso. */
function toDay(value: unknown, field: string, file: string): string {
  const day = value instanceof Date ? value.toISOString().slice(0, 10) : value;
  if (typeof day !== "string" || !ISO_DAY.test(day)) throw new Error(`[blog] ${file}: "${field}" deve ser AAAA-MM-DD.`);
  return day;
}

function requiredString(data: Record<string, unknown>, field: string, file: string): string {
  const v = data[field];
  if (typeof v !== "string" || !v.trim()) throw new Error(`[blog] ${file}: frontmatter "${field}" é obrigatório.`);
  return v.trim();
}

function parse(path: string, raw: string): (Post & { draft: boolean; locale: Locale }) | null {
  const [, , , lang, file] = path.split("/");
  const locale = LOCALES.find((l) => l === lang);
  if (!locale) throw new Error(`[blog] ${path}: pasta de idioma inválida (use ${LOCALES.join(", ")}).`);
  const key = file.replace(/\.mdx$/, "");
  const { data, content } = matter(raw);
  const post: Post & { draft: boolean; locale: Locale } = {
    locale,
    key,
    slug: typeof data.slug === "string" && data.slug.trim() ? data.slug.trim() : key,
    title: requiredString(data, "title", file),
    description: requiredString(data, "description", file),
    date: toDay(data.date, "date", file),
    updated: data.updated === undefined ? undefined : toDay(data.updated, "updated", file),
    author: requiredString(data, "author", file),
    readingMinutes: Math.max(1, Math.round(content.split(/\s+/).filter(Boolean).length / 200)),
    content,
    draft: data.draft === true,
  };
  // Falha cedo (sitemap, listagem e artigo) se algum <ToolCta slug="..."> apontar para página que não é pública.
  for (const m of content.matchAll(/<ToolCta\s+slug="([^"]+)"/g)) {
    if (!isValidToolSlug(m[1])) throw new Error(`[blog] ${file}: <ToolCta slug="${m[1]}"> inválido. Válidos: ${validToolSlugs().join(", ")}`);
  }
  return post;
}

const POSTS: (Post & { locale: Locale })[] = Object.entries(FILES)
  .map(([path, raw]) => parse(path, raw)!)
  .filter((p) => !p.draft)
  .sort((a, b) => (a.date === b.date ? a.title.localeCompare(b.title) : a.date < b.date ? 1 : -1));

/** Posts publicados no idioma (sem rascunhos), do mais recente para o mais antigo. */
export function getAllPosts(locale: Locale): PostMeta[] {
  return POSTS.filter((p) => p.locale === locale).map(({ content: _content, locale: _l, ...meta }) => meta);
}

export function getPostBySlug(locale: Locale, slug: string): Post | undefined {
  return POSTS.find((p) => p.locale === locale && p.slug === slug);
}

/** Idiomas em que o artigo (identificado por `key`) existe: o hreflang só lista traduções reais. */
export function postLocales(key: string): Locale[] {
  return LOCALES.filter((l) => POSTS.some((p) => p.locale === l && p.key === key));
}

/** Slug do artigo em um idioma (cada tradução pode ter o seu). */
export function postSlugFor(key: string, locale: Locale): string | undefined {
  return POSTS.find((p) => p.locale === locale && p.key === key)?.slug;
}

/** "2 de outubro de 2026" (fixo em UTC: a data do post não muda com o fuso do leitor). */
export function formatPostDate(day: string, locale: Locale): string {
  return new Date(`${day}T00:00:00Z`).toLocaleDateString(INTL_LOCALE[locale], { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
}
