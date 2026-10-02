import Link from "next/link";
import Header from "@/components/Header";
import ToolCardGrid from "@/components/tools/ToolCardGrid";
import SeoToolLinks from "@/components/seo/SeoToolLinks";

export default function Home() {
  return (
    <>
      <Header />
      <main className="page-container flex-1 pb-20">
        <section className="py-16 md:py-24">
          <h1 className="mb-5 max-w-3xl text-4xl font-semibold tracking-tight text-stone-900 md:text-6xl">
            Resolva tarefas chatas em poucos cliques.
          </h1>
          <p className="mb-8 max-w-2xl text-lg leading-relaxed text-stone-600">
            Conversores, validadores e geradores para contadores, lojistas, corretores e
            desenvolvedores. Comece grátis, sem cadastro.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/ferramentas" className="btn-primary px-5 py-3">Ver todas as ferramentas</Link>
            <Link href="/dashboard" className="btn-secondary px-5 py-3">Acessar meu painel</Link>
          </div>
        </section>
        <h2 className="section-title mb-4">Ferramentas</h2>
        <ToolCardGrid />
        <SeoToolLinks />
      </main>
    </>
  );
}
