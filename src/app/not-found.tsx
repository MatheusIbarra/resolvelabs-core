import type { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/Header";
import { TOOLS } from "@/lib/tools";

export const metadata: Metadata = {
  title: "Página não encontrada - ResolveLabs",
};

export default function NotFound() {
  return (
    <>
      <Header />
      <main className="page-container flex-1 pb-20">
        <section className="py-16 md:py-24">
          <span className="badge-brand mb-5">Erro 404</span>
          <h1 className="mb-5 max-w-3xl text-4xl font-semibold tracking-tight text-stone-900 md:text-6xl">
            Página não encontrada.
          </h1>
          <p className="mb-8 max-w-2xl text-lg leading-relaxed text-stone-600">
            O endereço que você tentou acessar não existe ou foi movido. Volte para o início ou abra uma das
            ferramentas abaixo.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/" className="btn-primary px-5 py-3">Voltar ao início</Link>
            <Link href="/suporte" className="btn-secondary px-5 py-3">Falar com o suporte</Link>
          </div>
        </section>

        <h2 className="section-title mb-4">Ferramentas</h2>
        <div className="stagger grid gap-4 sm:grid-cols-2">
          {TOOLS.map((tool) => (
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
                <span className="block text-sm font-semibold text-stone-900">{tool.name}</span>
                <span className="block text-sm text-stone-600">{tool.audience}</span>
              </span>
              <span className="text-sm font-medium text-teal-700 group-hover:underline">Abrir →</span>
            </Link>
          ))}
        </div>
      </main>
    </>
  );
}
