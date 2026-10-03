import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import Header from "@/components/Header";
import { getTranslator, pageLocale, type LangParams } from "@/i18n/server";
import { privateTitle } from "@/i18n/seo";

export async function generateMetadata({ params }: LangParams): Promise<Metadata> {
  return { title: privateTitle(getTranslator(await pageLocale(params)).t("dashboard.meta.upgrade")) };
}

export default async function UpgradePage({ params }: LangParams) {
  const { t, raw } = getTranslator(await pageLocale(params));
  return (
    <>
      <Header />
      <main className="page-container flex flex-1 items-start justify-center py-12 sm:py-20">
        <section className="card w-full max-w-md p-6 sm:p-8">
          <span className="badge-warn mb-4">{t("dashboard.upgrade.badge")}</span>
          <h1 className="mb-2 text-2xl font-semibold tracking-tight text-stone-900">{t("dashboard.upgrade.heading")}</h1>
          <p className="mb-6 text-sm leading-relaxed text-stone-600">{t("dashboard.upgrade.body")}</p>
          <ul className="mb-6 space-y-3">
            {raw("common.pro.benefits").map((b) => (
              <li key={b} className="flex items-start gap-3 text-sm text-stone-800">
                <svg className="mt-0.5 h-5 w-5 shrink-0 text-teal-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                </svg>
                {b}
              </li>
            ))}
          </ul>
          <p className="mb-3 rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-900">{t("common.pro.brazilOnly")}</p>
          <Link href="/checkout" className="btn-primary w-full py-3">{t("dashboard.upgrade.cta", { price: t("common.pro.priceLabel") })}</Link>
          <Link href="/dashboard" className="btn-secondary mt-3 w-full">{t("dashboard.upgrade.back")}</Link>
        </section>
      </main>
    </>
  );
}
