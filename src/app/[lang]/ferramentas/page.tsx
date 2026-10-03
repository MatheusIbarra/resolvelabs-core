import type { Metadata } from "next";
import Header from "@/components/Header";
import Breadcrumbs from "@/components/Breadcrumbs";
import PageHeading from "@/components/PageHeading";
import ToolCardGrid from "@/components/tools/ToolCardGrid";
import SeoToolLinks from "@/components/seo/SeoToolLinks";
import { getTranslator, pageLocale, type LangParams } from "@/i18n/server";
import { privateTitle } from "@/i18n/seo";

export async function generateMetadata({ params }: LangParams): Promise<Metadata> {
  return { title: privateTitle(getTranslator(await pageLocale(params)).t("common.toolsIndex.metaTitle")) };
}

export default async function ToolsIndexPage({ params }: LangParams) {
  const locale = await pageLocale(params);
  const { t } = getTranslator(locale);
  return (
    <>
      <Header />
      <Breadcrumbs items={[t("common.nav.home"), t("common.toolsIndex.heading")]} />
      <main className="page-container flex-1 pb-20">
        <PageHeading title={t("common.toolsIndex.heading")} description={t("common.toolsIndex.description")} />
        <ToolCardGrid />
        <SeoToolLinks locale={locale} />
      </main>
    </>
  );
}
