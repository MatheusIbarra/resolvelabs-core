import Link from "next/link";
import { SEO_TOOLS } from "@/lib/seo-tools";

/** Lista de guias por formato e banco: dá links internos rastreáveis para as páginas de SEO. */
export default function SeoToolLinks() {
  return (
    <section className="mt-12" aria-labelledby="guias-title">
      <h2 id="guias-title" className="section-title mb-4">Abrir e converter por formato</h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {SEO_TOOLS.map((t) => (
          <Link key={t.slug} href={t.path} className="card card-interactive p-4 hover:border-teal-600">
            <span className="block text-sm font-medium text-stone-900">{t.shortName}</span>
            <span className="mt-1 line-clamp-2 block text-xs text-stone-500">{t.description}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
