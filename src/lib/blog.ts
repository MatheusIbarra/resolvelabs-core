/// <reference types="vite/client" />
// Motor do blog: posts em content/blog/*.mdx com frontmatter (gray-matter).
// Os arquivos são EMBUTIDOS no build (import.meta.glob) em vez de lidos com `fs` em runtime:
// em deploys serverless (Nitro/Vercel) a pasta content/ não acompanha a função do servidor.
import matter from "gray-matter";
import { resolveToolLink, validToolSlugs } from "./tool-links";

export interface PostMeta {
  slug: string;
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

const FILES = import.meta.glob("/content/blog/*.mdx", { query: "?raw", import: "default", eager: true }) as Record<string, string>;

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

function parse(path: string, raw: string): (Post & { draft: boolean }) | null {
  const file = path.split("/").pop()!;
  const slug = file.replace(/\.mdx$/, "");
  const { data, content } = matter(raw);
  const post: Post & { draft: boolean } = {
    slug,
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
    if (!resolveToolLink(m[1])) throw new Error(`[blog] ${file}: <ToolCta slug="${m[1]}"> inválido. Válidos: ${validToolSlugs().join(", ")}`);
  }
  return post;
}

const POSTS: Post[] = Object.entries(FILES)
  .map(([path, raw]) => parse(path, raw)!)
  .filter((p) => !p.draft)
  .sort((a, b) => (a.date === b.date ? a.title.localeCompare(b.title) : a.date < b.date ? 1 : -1));

/** Posts publicados (sem rascunhos), do mais recente para o mais antigo. */
export function getAllPosts(): PostMeta[] {
  return POSTS.map(({ content: _content, ...meta }) => meta);
}

export function getPostBySlug(slug: string): Post | undefined {
  return POSTS.find((p) => p.slug === slug);
}

/** "2 de outubro de 2026" (fixo em UTC: a data do post não muda com o fuso do leitor). */
export function formatPostDate(day: string): string {
  return new Date(`${day}T00:00:00Z`).toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
}
