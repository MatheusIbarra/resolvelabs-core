import type { Metadata } from "next";
import { requireRolePage } from "@/lib/pageGuard";
import ToolLayout from "@/components/tools/ToolLayout";
import ToolGuard from "@/components/tools/ToolGuard";
import XmlFixer from "@/components/tools/XmlFixer";
import { getTranslator, pageLocale, type LangParams } from "@/i18n/server";

// Rota protegida (PRO): não indexar. A landing pública é /ferramentas/reparador-xml-merchant.
export async function generateMetadata({ params }: LangParams): Promise<Metadata> {
  const { t } = getTranslator(await pageLocale(params));
  return { title: `${t("toolPages.xml.metaTitle")} - ResolveLabs`, robots: { index: false, follow: false } };
}

export const dynamic = "force-dynamic";

export default async function Page({ params }: LangParams) {
  const locale = await pageLocale(params);
  await requireRolePage(locale, ["pro", "admin"], "/upgrade");
  const { t } = getTranslator(locale);
  return (
    <ToolLayout
      wide
      breadcrumbs={[t("common.nav.home"), t("common.nav.allTools"), t("toolPages.xml.breadcrumb")]}
      title={t("toolPages.xml.title")}
      description={t("toolPages.xml.description")}
    >
      <ToolGuard slug="reparador-xml">
        <XmlFixer />
      </ToolGuard>
    </ToolLayout>
  );
}
