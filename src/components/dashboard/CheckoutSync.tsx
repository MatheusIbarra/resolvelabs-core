"use client";

import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useI18n } from "@/i18n/I18nProvider";
import { localizeHref } from "@/i18n/navigation";
import { useToast } from "../ui/Toast";

const MAX_ATTEMPTS = 8;
const INTERVAL_MS = 2000;

/** Depois de voltar do Stripe (?checkout=success), aguarda o webhook promover a conta para PRO. */
export default function CheckoutSync() {
  const toast = useToast();
  const { t, locale } = useI18n();
  const { profile, isLoading, refresh } = useAuth();
  const [pending, setPending] = useState(false);
  const attempts = useRef(0);

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("checkout") === "success") {
      setPending(true);
      toast.info(t("msg.billing.confirming"));
      window.history.replaceState(window.history.state, "", localizeHref(locale, "/dashboard"));
    }
  }, [toast, t, locale]);

  useEffect(() => {
    if (!pending || !profile || isLoading) return;
    // Só vale quando o webhook vinculou a conta ao Stripe (hasBilling). Contas que já eram PRO
    // por concessão manual NÃO contam como confirmação.
    if (profile.plan === "PRO" && profile.hasBilling) {
      toast.success(t("msg.billing.subscribed"), { title: t("msg.billing.subscribedTitle") });
      setPending(false);
      return;
    }
    if (attempts.current >= MAX_ATTEMPTS) {
      toast.warning(t("msg.billing.stillProcessing"));
      setPending(false);
      return;
    }
    const timer = setTimeout(() => {
      attempts.current += 1;
      refresh();
    }, INTERVAL_MS);
    return () => clearTimeout(timer);
  }, [pending, profile, isLoading, refresh, toast, t]);

  return null;
}
