import Link from "next/link";
import { resolveToolLink, validToolSlugs } from "@/lib/tool-links";

/**
 * Chamada para uma ferramenta, usada dentro dos artigos: <ToolCta slug="visualizador-ofx">texto</ToolCta>.
 * O slug precisa ser de uma página pública (dicionário de SEO ou ferramenta só-navegador): slug inválido
 * gera erro, então nenhum artigo aponta para uma rota que manda o visitante para o login.
 */
export default function ToolCta({ slug, children }: { slug: string; children?: React.ReactNode }) {
  const tool = resolveToolLink(slug);
  if (!tool) throw new Error(`[blog] <ToolCta slug="${slug}"> não é uma página pública. Válidos: ${validToolSlugs().join(", ")}`);
  return (
    <aside className="not-prose my-8 rounded-xl border border-teal-200 bg-teal-50 p-5">
      <p className="mb-1 text-sm font-semibold text-teal-900">{tool.name}</p>
      <p className="mb-4 text-sm leading-relaxed text-stone-700">{children ?? tool.description}</p>
      <Link href={tool.path} className="btn-primary btn-sm">Abrir a ferramenta →</Link>
    </aside>
  );
}
