import Link from "next/link";
import { relatedTools, type SeoTool } from "@/lib/seo-tools";
import { breadcrumbSchema, faqPageSchema, softwareApplicationSchema } from "@/lib/seo-schema";
import JsonLd from "./JsonLd";

function offerLabel(t: SeoTool): string {
  const hasFree = t.offers.some((o) => o.price === 0);
  const hasPaid = t.offers.some((o) => o.price > 0);
  return hasFree && hasPaid ? "Grátis + PRO" : hasPaid ? "PRO" : "Gratuito";
}

/** Texto de SEO em volta da ferramenta: recursos, privacidade, passos, FAQ visível e links relacionados + JSON-LD. */
export default function SeoSections({ tool }: { tool: SeoTool }) {
  const related = relatedTools(tool);
  return (
    <>
      <JsonLd data={softwareApplicationSchema(tool)} />
      <JsonLd data={faqPageSchema(tool)} />
      <JsonLd data={breadcrumbSchema(tool)} />

      <div className="mt-12 grid gap-6 lg:grid-cols-3">
        <section className="card p-6 lg:col-span-2">
          <h2 className="section-title mb-4">O que você ganha</h2>
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
          <h2 className="section-title mb-2">Privacidade no navegador</h2>
          <p className="text-sm leading-relaxed text-stone-600">
            {tool.privacy ??
              "O arquivo é processado no seu navegador e não passa pelos nossos servidores. Você pode usar a ferramenta com extratos e documentos de clientes sem expor o conteúdo a terceiros."}
          </p>
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
        <h2 id="faq-title" className="section-title mb-4">Perguntas frequentes</h2>
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
        <nav className="mt-10" aria-label="Ferramentas relacionadas">
          <h2 className="section-title mb-4">Ferramentas relacionadas</h2>
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
