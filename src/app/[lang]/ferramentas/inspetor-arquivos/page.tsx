import type { Metadata } from "next";
import ToolLayout from "@/components/tools/ToolLayout";
import TrackView from "@/components/seo/TrackView";
import FileInspector from "@/components/inspector/FileInspector";
import { getTranslator, pageLocale, type LangParams } from "@/i18n/server";
import { buildAlternates } from "@/i18n/seo";

export async function generateMetadata({ params }: LangParams): Promise<Metadata> {
  const locale = await pageLocale(params);
  const { t } = getTranslator(locale);
  return {
    title: `${t("toolPages.inspector.metaTitle")} - ResolveLabs`,
    description: t("toolPages.inspector.metaDescription"),
    alternates: buildAlternates(locale, "/ferramentas/inspetor-arquivos"),
  };
}

export default async function Page({ params }: LangParams) {
  const { t } = getTranslator(await pageLocale(params));
  return (
    <ToolLayout
      wide
      breadcrumbs={[t("common.nav.home"), t("toolPages.inspector.breadcrumbGroup"), t("toolPages.inspector.breadcrumb")]}
      title={t("toolPages.inspector.title")}
      description={t("toolPages.inspector.description")}
    >
      <TrackView tool="inspetor-arquivos" />
      <FileInspector toolSlug="inspetor-arquivos" />
    </ToolLayout>
  );
}
