import type { Metadata } from "next";
import { requireRolePage } from "@/lib/pageGuard";
import ToolLayout from "@/components/tools/ToolLayout";
import ToolGuard from "@/components/tools/ToolGuard";
import ImageBatchProcessor from "@/components/tools/ImageBatchProcessor";
import { getTranslator, pageLocale, type LangParams } from "@/i18n/server";

export async function generateMetadata({ params }: LangParams): Promise<Metadata> {
  const { t } = getTranslator(await pageLocale(params));
  return { title: `${t("toolPages.images.metaTitle")} - ResolveLabs` };
}

export const dynamic = "force-dynamic";

export default async function Page({ params }: LangParams) {
  const locale = await pageLocale(params);
  await requireRolePage(locale, ["pro", "admin"], "/upgrade");
  const { t } = getTranslator(locale);
  return (
    <ToolLayout
      wide
      breadcrumbs={[t("common.nav.home"), t("common.nav.allTools"), t("toolPages.images.breadcrumb")]}
      title={t("toolPages.images.title")}
      description={t("toolPages.images.description")}
    >
      <ToolGuard slug="processador-imagens">
        <ImageBatchProcessor />
      </ToolGuard>
    </ToolLayout>
  );
}
