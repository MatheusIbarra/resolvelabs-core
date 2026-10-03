import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/config";
import { getTranslator } from "@/i18n/server";
import { listSeoTools } from "@/lib/seo-content";

/** Lista de guias por formato e banco: dá links internos rastreáveis para as páginas de SEO. */
export default function SeoToolLinks({ locale }: { locale: Locale }) {
  const { t } = getTranslator(locale);
  return (
    <section className="mt-12" aria-labelledby="guias-title">
      <h2 id="guias-title" className="section-title mb-4">{t("common.seoLinks.title")}</h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {listSeoTools(locale).map((tool) => (
          <Link key={tool.slug} href={tool.path} className="card card-interactive p-4 hover:border-teal-600">
            <span className="block text-sm font-medium text-stone-900">{tool.shortName}</span>
            <span className="mt-1 line-clamp-2 block text-xs text-stone-500">{tool.description}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
