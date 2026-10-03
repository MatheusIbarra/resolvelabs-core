import { Link } from "@/i18n/navigation";
import Header from "@/components/Header";
import ToolCardGrid from "@/components/tools/ToolCardGrid";
import SeoToolLinks from "@/components/seo/SeoToolLinks";
import { getTranslator, pageLocale, type LangParams } from "@/i18n/server";

export default async function Home({ params }: LangParams) {
  const locale = await pageLocale(params);
  const { t } = getTranslator(locale);
  return (
    <>
      <Header />
      <main className="page-container flex-1 pb-20">
        <section className="py-16 md:py-24">
          <h1 className="mb-5 max-w-3xl text-4xl font-semibold tracking-tight text-stone-900 md:text-6xl">
            {t("common.home.heading")}
          </h1>
          <p className="mb-8 max-w-2xl text-lg leading-relaxed text-stone-600">{t("common.home.subheading")}</p>
          <div className="flex flex-wrap gap-3">
            <Link href="/ferramentas" className="btn-primary px-5 py-3">{t("common.home.ctaTools")}</Link>
            <Link href="/dashboard" className="btn-secondary px-5 py-3">{t("common.home.ctaDashboard")}</Link>
          </div>
        </section>
        <h2 className="section-title mb-4">{t("common.tools.sectionTitle")}</h2>
        <ToolCardGrid />
        <SeoToolLinks locale={locale} />
      </main>
    </>
  );
}
