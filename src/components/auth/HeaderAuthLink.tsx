"use client";

import { Link } from "@/i18n/navigation";
import { useI18n } from "@/i18n/I18nProvider";
import { useAuth } from "@/hooks/useAuth";

/** "Entrar" para visitantes, "Meu painel" para quem já tem sessão. */
export default function HeaderAuthLink() {
  const { t } = useI18n();
  const { profile, isLoading } = useAuth();
  const loggedIn = profile?.isAuthenticated === true;
  return (
    <Link
      href={loggedIn ? "/dashboard" : "/login"}
      className={`hidden text-sm font-medium text-stone-600 hover:text-stone-900 sm:block ${isLoading ? "invisible" : ""}`}
    >
      {loggedIn ? t("common.nav.dashboard") : t("common.nav.login")}
    </Link>
  );
}
