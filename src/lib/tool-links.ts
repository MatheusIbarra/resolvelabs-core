import { PUBLIC_CLIENT_TOOL_PATHS, SEO_TOOLS } from "./seo-tools";
import { getTool } from "./tools";

export interface ToolLink {
  name: string;
  description: string;
  path: string;
}

/** Destinos que os artigos podem linkar: só páginas públicas (acessíveis sem login). */
export function resolveToolLink(slug: string): ToolLink | undefined {
  const seo = SEO_TOOLS.find((t) => t.slug === slug);
  if (seo) return { name: seo.shortName, description: seo.description, path: seo.path };
  const path = PUBLIC_CLIENT_TOOL_PATHS.find((p) => p.endsWith(`/${slug}`));
  const tool = path ? getTool(slug) : undefined;
  return tool && path ? { name: tool.name, description: tool.description, path } : undefined;
}

export function validToolSlugs(): string[] {
  return [...SEO_TOOLS.map((t) => t.slug), ...PUBLIC_CLIENT_TOOL_PATHS.map((p) => p.split("/").pop()!)];
}
