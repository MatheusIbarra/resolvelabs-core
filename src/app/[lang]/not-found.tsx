"use client";

import { Link } from "@/i18n/navigation";
import { useI18n } from "@/i18n/I18nProvider";
import Header from "@/components/Header";
import { TOOLS, toolCopy } from "@/lib/tools";

// Cliente de propósito: o not-found não recebe `params`, então o idioma vem do contexto (layout [lang]).
export default function NotFound() {
  const { t, raw } = useI18n();
  const items = raw("common.tools.items");
  return (
    <>
      <Header />
      <main className="page-container flex-1 pb-20">
        <section className="py-16 md:py-24">
          <span className="badge-brand mb-5">{t("common.notFound.badge")}</span>
          <h1 className="mb-5 max-w-3xl text-4xl font-semibold tracking-tight text-stone-900 md:text-6xl">
            {t("common.notFound.heading")}
          </h1>
          <p className="mb-8 max-w-2xl text-lg leading-relaxed text-stone-600">{t("common.notFound.body")}</p>
          <div className="flex flex-wrap gap-3">
            <Link href="/" className="btn-primary px-5 py-3">{t("common.notFound.backHome")}</Link>
            <Link href="/suporte" className="btn-secondary px-5 py-3">{t("common.notFound.support")}</Link>
          </div>
        </section>

        <h2 className="section-title mb-4">{t("common.tools.sectionTitle")}</h2>
        <div className="stagger grid gap-4 sm:grid-cols-2">
          {TOOLS.map((tool) => {
            const copy = toolCopy(items, tool.slug);
            return (
              <Link
                key={tool.slug}
                href={tool.href}
                className="card card-interactive group flex items-center gap-4 p-4 hover:border-teal-600"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-teal-700">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d={tool.iconPath} />
                  </svg>
                </span>
                <span className="flex-1">
                  <span className="block text-sm font-semibold text-stone-900">{copy.name}</span>
                  <span className="block text-sm text-stone-600">{copy.audience}</span>
                </span>
                <span className="text-sm font-medium text-teal-700 group-hover:underline">{t("common.tools.open")}</span>
              </Link>
            );
          })}
        </div>
      </main>
    </>
  );
}
