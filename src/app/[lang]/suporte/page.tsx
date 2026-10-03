import type { Metadata } from "next";
import Header from "@/components/Header";
import Breadcrumbs from "@/components/Breadcrumbs";
import PageHeading from "@/components/PageHeading";
import { getTranslator, pageLocale, type LangParams } from "@/i18n/server";
import { buildAlternates } from "@/i18n/seo";

export async function generateMetadata({ params }: LangParams): Promise<Metadata> {
  const locale = await pageLocale(params);
  return {
    title: `${getTranslator(locale).t("support.page.metaTitle")} - ResolveLabs`,
    alternates: buildAlternates(locale, "/suporte"),
  };
}

export default async function SupportPage({ params }: LangParams) {
  const { t } = getTranslator(await pageLocale(params));
  return (
    <>
      <Header />
      <Breadcrumbs items={[t("common.nav.home"), t("support.page.breadcrumb")]} />
      <main className="page-container max-w-4xl flex-1 pb-20">
        <PageHeading title={t("support.page.heading")} description={t("support.page.description")} />
        <a href="mailto:suporte@resolvelabs.com" className="btn-primary px-5 py-3">
          suporte@resolvelabs.com
        </a>
      </main>
    </>
  );
}
