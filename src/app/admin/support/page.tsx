import Link from "next/link";
import Header from "@/components/Header";
import SupportAdmin from "@/components/admin/SupportAdmin";

export const metadata = { title: "Suporte - Admin - ResolveLabs" };

export default function AdminSupportPage() {
  return (
    <>
      <Header />
      <main className="page-container flex-1 py-10 pb-20">
        <div className="mb-8">
          <Link href="/admin/dashboard" className="mb-3 inline-block text-sm text-stone-500 hover:text-stone-900 hover:underline">
            ← Painel administrativo
          </Link>
          <h1 className="mb-2 text-3xl font-semibold tracking-tight text-stone-900">Tickets de suporte</h1>
          <p className="max-w-2xl text-sm leading-relaxed text-stone-600">Responda aos clientes e feche os tickets resolvidos.</p>
        </div>
        <SupportAdmin />
      </main>
    </>
  );
}
