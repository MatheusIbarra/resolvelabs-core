import type { Metadata } from "next";
import ToolPage from "@/components/seo/ToolPage";
import PasswordGenerator from "@/components/tools/PasswordGenerator";
import { getSeoTool } from "@/lib/seo-content";
import { buildSeoMetadata } from "@/lib/seo-schema";
import { pageLocale, type LangParams } from "@/i18n/server";

const SLUG = "gerador-senhas";

export async function generateMetadata({ params }: LangParams): Promise<Metadata> {
  const locale = await pageLocale(params);
  return buildSeoMetadata(locale, getSeoTool(locale, SLUG)!);
}

export default async function Page({ params }: LangParams) {
  const locale = await pageLocale(params);
  return (
    <ToolPage locale={locale} slug={SLUG} wide>
      <PasswordGenerator />
    </ToolPage>
  );
}
