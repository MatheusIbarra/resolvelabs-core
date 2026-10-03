import { PUBLIC_CLIENT_TOOL_PATHS, SEO_TOOL_DEFS, getSeoToolDef } from "./seo-tools";
import { getTool, toolCopy } from "./tools";
import { getSeoTool } from "./seo-content";
import { getTranslator } from "@/i18n/server";
import type { Locale } from "@/i18n/config";

export interface ToolLink {
  name: string;
  description: string;
  path: string;
}

/** O slug aponta para uma página pública (acessível sem login)? Usado na validação dos artigos, sem idioma. */
export function isValidToolSlug(slug: string): boolean {
  return Boolean(getSeoToolDef(slug)) || PUBLIC_CLIENT_TOOL_PATHS.some((p) => p.endsWith(`/${slug}`));
}

/** Destinos que os artigos podem linkar: só páginas públicas (acessíveis sem login). */
export function resolveToolLink(locale: Locale, slug: string): ToolLink | undefined {
  const seo = getSeoTool(locale, slug);
  if (seo) return { name: seo.shortName, description: seo.description, path: seo.path };
  const path = PUBLIC_CLIENT_TOOL_PATHS.find((p) => p.endsWith(`/${slug}`));
  const tool = path ? getTool(slug) : undefined;
  if (!tool || !path) return undefined;
  const copy = toolCopy(getTranslator(locale).raw("common.tools.items"), slug);
  return { name: copy.name, description: copy.description, path };
}

export function validToolSlugs(): string[] {
  return [...SEO_TOOL_DEFS.map((t) => t.slug), ...PUBLIC_CLIENT_TOOL_PATHS.map((p) => p.split("/").pop()!)];
}
