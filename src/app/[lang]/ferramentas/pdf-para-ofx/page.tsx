import type { Metadata } from "next";
import ConverterPage from "@/components/ConverterPage";
import { getTranslator, pageLocale, type LangParams } from "@/i18n/server";

// Rota protegida (login): não indexar. A landing pública é /ferramentas/conversor-pdf-para-ofx.
export async function generateMetadata({ params }: LangParams): Promise<Metadata> {
  const { t } = getTranslator(await pageLocale(params));
  return { title: `ResolveLabs - ${t("toolPages.pdfToOfx.metaTitle")}`, robots: { index: false, follow: false } };
}

export default function Page() {
  return <ConverterPage />;
}
