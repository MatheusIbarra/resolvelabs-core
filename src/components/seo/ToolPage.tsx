import { notFound } from "next/navigation";
import ToolLayout from "../tools/ToolLayout";
import SeoSections from "./SeoSections";
import TrackView from "./TrackView";
import { getSeoTool } from "@/lib/seo-tools";

/** Página de ferramenta com rota própria: título/introdução do dicionário de SEO, a ferramenta e o texto de SEO (FAQ + JSON-LD). */
export default function ToolPage({ slug, wide, children }: { slug: string; wide?: boolean; children: React.ReactNode }) {
  const tool = getSeoTool(slug);
  if (!tool) notFound();
  return (
    <ToolLayout wide={wide} breadcrumbs={["Home", tool.shortName]} title={tool.h1} description={tool.intro}>
      <TrackView tool={tool.slug} />
      {children}
      <SeoSections tool={tool} />
    </ToolLayout>
  );
}
