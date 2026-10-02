import Link from "next/link";
import Header from "@/components/Header";
import SupportAdmin from "@/components/admin/SupportAdmin";
import { MONO } from "@/components/admin/adminUi";

export const metadata = { title: "Suporte - Admin - ResolveLabs" };

export default function AdminSupportPage() {
  return (
    <>
      <Header />
      <main className="page-container flex-1 py-10 pb-20">
        <div className="mb-8 border-b border-stone-950 pb-6">
          <p className={`${MONO} mb-3 text-stone-500`}>
            <Link href="/admin/dashboard" className="hover:underline">
              Área restrita / admin
            </Link>{" "}
            / suporte
          </p>
          <h1 className="font-mono text-2xl font-semibold uppercase tracking-tight text-stone-950 md:text-3xl">Tickets de suporte</h1>
        </div>
        <SupportAdmin />
      </main>
    </>
  );
}
