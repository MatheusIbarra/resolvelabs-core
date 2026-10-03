import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/config";
import { getTranslator } from "@/i18n/server";
import { relatedTools, type SeoTool } from "@/lib/seo-content";
import { breadcrumbSchema, faqPageSchema, softwareApplicationSchema } from "@/lib/seo-schema";
import JsonLd from "./JsonLd";

/** Texto de SEO em volta da ferramenta: recursos, privacidade, passos, FAQ visível e links relacionados + JSON-LD. */
export default function SeoSections({ tool, locale }: { tool: SeoTool; locale: Locale }) {
  const { t } = getTranslator(locale);
  const related = relatedTools(locale, tool);
  const offerLabel = (r: SeoTool): string => {
    const hasFree = r.offers.some((o) => o.price === 0);
    const hasPaid = r.offers.some((o) => o.price > 0);
    return hasFree && hasPaid ? t("common.seoSections.offerFreePro") : hasPaid ? t("common.seoSections.offerPro") : t("common.seoSections.offerFree");
  };
  return (
    <>
      <JsonLd data={softwareApplicationSchema(locale, tool)} />
      <JsonLd data={faqPageSchema(locale, tool)} />
      <JsonLd data={breadcrumbSchema(locale, tool)} />

      <div className="mt-12 grid gap-6 lg:grid-cols-3">
        <section className="card p-6 lg:col-span-2">
          <h2 className="section-title mb-4">{t("common.seoSections.whatYouGet")}</h2>
          <ul className="space-y-3 text-sm text-stone-700">
            {tool.features.map((f) => (
              <li key={f} className="flex gap-3">
                <span aria-hidden className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-teal-50 text-teal-700">
                  <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                </span>
                <span>{f}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="card p-6">
          <h2 className="section-title mb-2">{t("common.seoSections.privacyTitle")}</h2>
          <p className="text-sm leading-relaxed text-stone-600">{tool.privacy ?? t("common.seoSections.privacyDefault")}</p>
        </section>
      </div>

      {tool.steps && (
        <section className="card mt-6 p-6">
          <h2 className="section-title mb-4">{tool.steps.title}</h2>
          <ol className="space-y-3 text-sm text-stone-700">
            {tool.steps.items.map((step, i) => (
              <li key={step} className="flex gap-3">
                <span className="badge-brand shrink-0">{i + 1}</span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </section>
      )}

      <section className="mt-6" aria-labelledby="faq-title">
        <h2 id="faq-title" className="section-title mb-4">{t("common.seoSections.faq")}</h2>
        <div className="space-y-3">
          {tool.faq.map((item) => (
            <details key={item.q} className="card group p-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium text-stone-900">
                {item.q}
                <span aria-hidden className="text-stone-400 transition-transform group-open:rotate-180">▾</span>
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-stone-600">{item.a}</p>
            </details>
          ))}
        </div>
      </section>

      {related.length > 0 && (
        <nav className="mt-10" aria-label={t("common.seoSections.related")}>
          <h2 className="section-title mb-4">{t("common.seoSections.related")}</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((r) => (
              <Link key={r.slug} href={r.path} className="card card-interactive p-4 hover:border-teal-600">
                <span className="block text-sm font-medium text-stone-900">{r.shortName}</span>
                <span className="mt-1 block text-xs text-stone-500">{offerLabel(r)}</span>
              </Link>
            ))}
          </div>
        </nav>
      )}
    </>
  );
}
