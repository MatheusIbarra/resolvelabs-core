import Link from "next/link";
import { SEO_TOOLS, getSeoTool } from "@/lib/seo-tools";

/**
 * Chamada para uma ferramenta, usada dentro dos artigos: <ToolCta slug="visualizador-ofx">texto</ToolCta>.
 * O slug precisa existir no dicionário de SEO (só páginas públicas): slug inválido derruba o build,
 * então nenhum artigo aponta para uma rota que manda o visitante para o login.
 */
export default function ToolCta({ slug, children }: { slug: string; children?: React.ReactNode }) {
  const tool = getSeoTool(slug);
  if (!tool) throw new Error(`[blog] <ToolCta slug="${slug}"> não existe em SEO_TOOLS. Válidos: ${SEO_TOOLS.map((t) => t.slug).join(", ")}`);
  return (
    <aside className="not-prose my-8 rounded-xl border border-teal-200 bg-teal-50 p-5">
      <p className="mb-1 text-sm font-semibold text-teal-900">{tool.shortName}</p>
      <p className="mb-4 text-sm leading-relaxed text-stone-700">{children ?? tool.description}</p>
      <Link href={tool.path} className="btn-primary btn-sm">Abrir a ferramenta →</Link>
    </aside>
  );
}
