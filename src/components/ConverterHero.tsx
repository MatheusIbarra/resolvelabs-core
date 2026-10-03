"use client";

import PageHeading from "./PageHeading";
import { useI18n } from "@/i18n/I18nProvider";

export default function ConverterHero() {
  const { t } = useI18n();
  return <PageHeading title={t("toolPages.pdfToOfx.title")} description={t("toolPages.pdfToOfx.description")} />;
}
