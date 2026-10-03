import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import { notFound } from "next/navigation";
import ToolLayout from "@/components/tools/ToolLayout";
import FileInspector from "@/components/inspector/FileInspector";
import TrackView from "@/components/seo/TrackView";
import SeoSections from "@/components/seo/SeoSections";
import { LOCALES } from "@/i18n/config";
import { getTranslator, pageLocale } from "@/i18n/server";
import { dynamicSeoSlugs } from "@/lib/seo-tools";
import { getSeoTool } from "@/lib/seo-content";
import { buildSeoMetadata } from "@/lib/seo-schema";

// Só geramos os slugs do dicionário; qualquer outro vira 404.
export const dynamicParams = false;

type Params = { lang: string; slug: string };

export function generateStaticParams(): Params[] {
  return LOCALES.flatMap((lang) => dynamicSeoSlugs().map((slug) => ({ lang, slug })));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const p = await params;
  const locale = await pageLocale(Promise.resolve(p));
  const tool = getSeoTool(locale, p.slug);
  return tool ? buildSeoMetadata(locale, tool) : {};
}

export default async function Page({ params }: { params: Promise<Params> }) {
  const p = await params;
  const locale = await pageLocale(Promise.resolve(p));
  const tool = getSeoTool(locale, p.slug);
  if (!tool) notFound();
  const { t } = getTranslator(locale);

  return (
    <ToolLayout
      wide
      breadcrumbs={[t("common.nav.home"), tool.shortName]}
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
      <SeoSections tool={tool} locale={locale} />
    </ToolLayout>
  );
}
