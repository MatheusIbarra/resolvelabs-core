"use client";

import { useState } from "react";
import { useToast } from "../ui/Toast";
import { LoadingLabel } from "../ui/Loading";
import { apiFetch } from "@/i18n/active";
import { useI18n } from "@/i18n/I18nProvider";
import { localizeHref } from "@/i18n/navigation";

export default function LogoutButton({ className }: { className?: string }) {
  const toast = useToast();
  const { t, locale } = useI18n();
  const [isPending, setIsPending] = useState(false);

  const logout = async () => {
    if (isPending) return;
    setIsPending(true);
    try {
      const res = await apiFetch("/api/auth/logout", { method: "POST" });
      if (!res.ok) throw new Error();
      window.location.assign(localizeHref(locale, "/login"));
    } catch {
      toast.error(t("msg.auth.logoutFailed"));
      setIsPending(false);
    }
  };

  return (
    <button onClick={logout} disabled={isPending} className={className}>
      {isPending ? <LoadingLabel>{t("common.nav.loggingOut")}</LoadingLabel> : t("common.nav.logout")}
    </button>
  );
}
