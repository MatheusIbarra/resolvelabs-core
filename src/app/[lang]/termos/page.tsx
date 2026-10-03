import type { Metadata } from "next";
import Header from "@/components/Header";
import Breadcrumbs from "@/components/Breadcrumbs";
import { getTranslator, pageLocale, type LangParams } from "@/i18n/server";
import { buildAlternates } from "@/i18n/seo";

export async function generateMetadata({ params }: LangParams): Promise<Metadata> {
  const locale = await pageLocale(params);
  return { title: `${getTranslator(locale).t("legal.metaTitle")} - ResolveLabs`, alternates: buildAlternates(locale, "/termos") };
}

export default async function TermsPage({ params }: LangParams) {
  const { t, raw } = getTranslator(await pageLocale(params));
  return (
    <>
      <Header />
      <Breadcrumbs items={[t("common.nav.home"), t("legal.breadcrumb")]} />
      <main className="page-container max-w-3xl flex-1 pb-20">
        <h1 className="mb-8 text-3xl font-semibold tracking-tight text-stone-900 md:text-4xl">{t("legal.heading")}</h1>
        <div className="card space-y-8 p-6 sm:p-8">
          {raw("legal.sections").map((s) => (
            <section key={s.title}>
              <h2 className="mb-3 text-lg font-semibold text-stone-900">{s.title}</h2>
              <div className="space-y-3 text-sm leading-relaxed text-stone-800">
                {s.items.map((p) => (
                  <p key={p}>{p}</p>
                ))}
              </div>
            </section>
          ))}
        </div>
      </main>
    </>
  );
}
