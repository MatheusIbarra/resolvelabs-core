"use client";

import Header from "./Header";
import Breadcrumbs from "./Breadcrumbs";
import ConverterHero from "./ConverterHero";
import UploadZone from "./UploadZone";
import { useI18n } from "@/i18n/I18nProvider";

export default function ConverterPage() {
  const { t } = useI18n();
  return (
    <>
      <Header />
      <Breadcrumbs items={[t("common.nav.home"), t("common.nav.allTools"), t("toolPages.pdfToOfx.breadcrumb")]} />
      <main className="page-container max-w-4xl flex-1 pb-16">
        <ConverterHero />
        <UploadZone />
      </main>
    </>
  );
}
