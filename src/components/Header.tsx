"use client";

import Logo from "./Logo";
import HeaderAuthLink from "./auth/HeaderAuthLink";
import LanguageSwitcher from "@/i18n/LanguageSwitcher";
import { Link } from "@/i18n/navigation";
import { useI18n } from "@/i18n/I18nProvider";

const NAV_LINK = "text-sm font-medium text-stone-600 hover:text-stone-900 transition-colors";

export default function Header() {
  const { t } = useI18n();
  return (
    <header className="border-b border-stone-200 bg-white">
      <div className="page-container flex h-16 items-center justify-between">
        <Link href="/" aria-label={t("common.brand.homeAria")}>
          <Logo />
        </Link>
        <nav className="hidden items-center gap-8 md:flex">
          <Link href="/ferramentas" className={NAV_LINK}>{t("common.nav.tools")}</Link>
          <Link href="/blog" className={NAV_LINK}>{t("common.nav.blog")}</Link>
          <Link href="/checkout" className={NAV_LINK}>{t("common.nav.pricing")}</Link>
        </nav>
        <div className="flex items-center gap-3">
          <LanguageSwitcher />
          <HeaderAuthLink />
          <Link href="/checkout" className="btn-primary">{t("common.nav.subscribePro")}</Link>
        </div>
      </div>
    </header>
  );
}
