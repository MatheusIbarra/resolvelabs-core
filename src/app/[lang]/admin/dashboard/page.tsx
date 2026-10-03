import type { Metadata } from "next";
import Header from "@/components/Header";
import AdminDashboard from "@/components/admin/AdminDashboard";
import { getTranslator, pageLocale, type LangParams } from "@/i18n/server";
import { privateTitle } from "@/i18n/seo";

export async function generateMetadata({ params }: LangParams): Promise<Metadata> {
  return { title: privateTitle(getTranslator(await pageLocale(params)).t("admin.meta.dashboard")) };
}

export default function AdminDashboardPage() {
  return (
    <>
      <Header />
      <main className="page-container flex-1 py-10 pb-20">
        <AdminDashboard />
      </main>
    </>
  );
}
