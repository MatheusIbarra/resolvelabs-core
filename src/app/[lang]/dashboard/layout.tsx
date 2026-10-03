import type { Metadata } from "next";
import Sidebar from "@/components/dashboard/Sidebar";
import Logo from "@/components/Logo";
import LogoutButton from "@/components/auth/LogoutButton";
import LanguageSwitcher from "@/i18n/LanguageSwitcher";
import { getTranslator, pageLocale, type LangParams } from "@/i18n/server";
import { privateTitle } from "@/i18n/seo";

export async function generateMetadata({ params }: LangParams): Promise<Metadata> {
  return { title: privateTitle(getTranslator(await pageLocale(params)).t("dashboard.meta.dashboard")) };
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-1">
      <Sidebar />
      <div className="min-w-0 flex-1">
        {/* Barra superior apenas no mobile, onde a sidebar fica oculta */}
        <div className="flex h-14 items-center justify-between gap-3 border-b border-stone-200 bg-white px-4 md:hidden">
          <Logo />
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <LogoutButton className="text-sm text-stone-600" />
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}
