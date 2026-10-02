import Link from "next/link";
import Header from "@/components/Header";
import { PRO_BENEFITS, PRO_PRICE_LABEL } from "@/lib/content";

export const metadata = { title: "Upgrade para PRO - ResolveLabs" };

export default function UpgradePage() {
  return (
    <>
      <Header />
      <main className="page-container flex flex-1 items-start justify-center py-12 sm:py-20">
        <section className="card w-full max-w-md p-6 sm:p-8">
          <span className="badge-warn mb-4">Recurso exclusivo PRO</span>
          <h1 className="mb-2 text-2xl font-semibold tracking-tight text-stone-900">Faça upgrade para continuar</h1>
          <p className="mb-6 text-sm leading-relaxed text-stone-600">
            Esta área está disponível apenas no plano PRO. Assine para liberar todas as ferramentas.
          </p>
          <ul className="mb-6 space-y-3">
            {PRO_BENEFITS.map((b) => (
              <li key={b} className="flex items-start gap-3 text-sm text-stone-800">
                <svg className="mt-0.5 h-5 w-5 shrink-0 text-teal-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                </svg>
                {b}
              </li>
            ))}
          </ul>
          <Link href="/checkout" className="btn-primary w-full py-3">Assinar PRO por {PRO_PRICE_LABEL}</Link>
          <Link href="/dashboard" className="btn-secondary mt-3 w-full">Voltar ao painel</Link>
        </section>
      </main>
    </>
  );
}
