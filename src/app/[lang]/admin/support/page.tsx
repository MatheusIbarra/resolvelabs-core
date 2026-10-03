import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import Header from "@/components/Header";
import SupportAdmin from "@/components/admin/SupportAdmin";
import { getTranslator, pageLocale, type LangParams } from "@/i18n/server";
import { privateTitle } from "@/i18n/seo";

export async function generateMetadata({ params }: LangParams): Promise<Metadata> {
  return { title: privateTitle(getTranslator(await pageLocale(params)).t("admin.meta.support")) };
}

export default async function AdminSupportPage({ params }: LangParams) {
  const { t } = getTranslator(await pageLocale(params));
  return (
    <>
      <Header />
      <main className="page-container flex-1 py-10 pb-20">
        <div className="mb-8">
          <Link href="/admin/dashboard" className="mb-3 inline-block text-sm text-stone-500 hover:text-stone-900 hover:underline">
            {t("admin.supportPage.back")}
          </Link>
          <h1 className="mb-2 text-3xl font-semibold tracking-tight text-stone-900">{t("admin.supportPage.title")}</h1>
          <p className="max-w-2xl text-sm leading-relaxed text-stone-600">{t("admin.supportPage.description")}</p>
        </div>
        <SupportAdmin />
      </main>
    </>
  );
}
