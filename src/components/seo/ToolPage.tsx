import { notFound } from "next/navigation";
import ToolLayout from "../tools/ToolLayout";
import SeoSections from "./SeoSections";
import TrackView from "./TrackView";
import { getSeoTool } from "@/lib/seo-content";
import { getTranslator } from "@/i18n/server";
import type { Locale } from "@/i18n/config";

/** Página de ferramenta com rota própria: título/introdução do dicionário de SEO, a ferramenta e o texto de SEO (FAQ + JSON-LD). */
export default function ToolPage({ locale, slug, wide, children }: { locale: Locale; slug: string; wide?: boolean; children: React.ReactNode }) {
  const tool = getSeoTool(locale, slug);
  if (!tool) notFound();
  const { t } = getTranslator(locale);
  return (
    <ToolLayout wide={wide} breadcrumbs={[t("common.nav.home"), tool.shortName]} title={tool.h1} description={tool.intro}>
      <TrackView tool={tool.slug} />
      {children}
      <SeoSections tool={tool} locale={locale} />
    </ToolLayout>
  );
}
