import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ToolLayout from "@/components/tools/ToolLayout";
import FileInspector from "@/components/inspector/FileInspector";
import TrackView from "@/components/seo/TrackView";
import SeoSections from "@/components/seo/SeoSections";
import { dynamicSeoSlugs, getSeoTool } from "@/lib/seo-tools";
import { buildSeoMetadata } from "@/lib/seo-schema";

// Só geramos os slugs do dicionário; qualquer outro vira 404.
export const dynamicParams = false;

type Params = { slug: string };

export function generateStaticParams(): Params[] {
  return dynamicSeoSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const tool = getSeoTool((await params).slug);
  return tool ? buildSeoMetadata(tool) : {};
}

export default async function Page({ params }: { params: Promise<Params> }) {
  const tool = getSeoTool((await params).slug);
  if (!tool) notFound();

  return (
    <ToolLayout
      wide
      breadcrumbs={["Home", tool.shortName]}
      title={tool.h1}
      description={tool.intro}
    >
      <TrackView tool={tool.slug} />
      {tool.render === "inspector" && <FileInspector toolSlug={tool.slug} />}
      {tool.render === "cta" && tool.cta && (
        <div className="card flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="max-w-xl text-sm text-stone-600">{tool.cta.note}</p>
          <Link href={tool.cta.href} className="btn-primary px-5 py-3">{tool.cta.label}</Link>
        </div>
      )}
      <SeoSections tool={tool} />
    </ToolLayout>
  );
}
