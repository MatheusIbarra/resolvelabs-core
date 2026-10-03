import type { Metadata } from "next";
import ToolLayout from "@/components/tools/ToolLayout";
import TrackView from "@/components/seo/TrackView";
import MockDataGenerator from "@/components/tools/MockDataGenerator";
import { getTranslator, pageLocale, type LangParams } from "@/i18n/server";
import { buildAlternates } from "@/i18n/seo";

export async function generateMetadata({ params }: LangParams): Promise<Metadata> {
  const locale = await pageLocale(params);
  const { t } = getTranslator(locale);
  return {
    title: `${t("toolPages.mock.metaTitle")} - ResolveLabs`,
    description: t("toolPages.mock.metaDescription"),
    alternates: buildAlternates(locale, "/ferramentas/mock-data-br"),
  };
}

export default async function Page({ params }: LangParams) {
  const { t } = getTranslator(await pageLocale(params));
  return (
    <ToolLayout
      wide
      breadcrumbs={[t("common.nav.home"), t("common.nav.allTools"), t("toolPages.mock.breadcrumb")]}
      title={t("toolPages.mock.title")}
      description={t("toolPages.mock.description")}
    >
      <TrackView tool="mock-data-br" />
      <MockDataGenerator />
    </ToolLayout>
  );
}
