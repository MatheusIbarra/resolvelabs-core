"use client";

import { useAuth } from "@/hooks/useAuth";
import { Link, usePathname } from "@/i18n/navigation";
import { useI18n } from "@/i18n/I18nProvider";
import LanguageSwitcher from "@/i18n/LanguageSwitcher";
import Logo from "../Logo";
import { Loading } from "../ui/Loading";
import LogoutButton from "../auth/LogoutButton";

const MENU = [
  {
    key: "overview",
    href: "/dashboard",
    icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6",
  },
  {
    key: "subscription",
    href: "/checkout",
    icon: "M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z",
  },
  {
    key: "referrals",
    href: "/dashboard/afiliados",
    icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z",
  },
] as const;

const ADMIN_ITEM = {
  key: "admin",
  href: "/admin/dashboard",
  icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
} as const;

export default function Sidebar() {
  const { t } = useI18n();
  const pathname = usePathname();
  const { profile, isLoading, error } = useAuth();

  return (
    <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-stone-200 bg-white md:flex">
      <Link href="/" className="flex h-16 items-center border-b border-stone-200 px-5" aria-label={t("common.brand.homeAria")}>
        <Logo />
      </Link>

      <nav className="flex-1 space-y-1 p-3">
        {(profile?.role === "admin" ? [...MENU, ADMIN_ITEM] : MENU).map((item) => {
          const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.key}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                active ? "bg-teal-50 text-teal-800" : "text-stone-600 hover:bg-stone-100 hover:text-stone-900"
              }`}
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d={item.icon} />
              </svg>
              {t(`dashboard.sidebar.${item.key}`)}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-stone-200 p-4">
        <LanguageSwitcher className="mb-3" />
        <p className="truncate text-sm text-stone-700" title={profile?.email}>
          {isLoading ? <Loading className="text-xs text-stone-500">{t("dashboard.sidebar.loadingProfile")}</Loading> : error ? t("dashboard.sidebar.profileError") : profile?.email}
        </p>
        <LogoutButton className="mt-1 text-sm text-stone-500 hover:text-stone-900 hover:underline disabled:opacity-60" />
      </div>
    </aside>
  );
}
