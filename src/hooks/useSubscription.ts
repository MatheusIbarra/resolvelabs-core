"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "./useAuth";
import { getSubscription } from "@/lib/fakeApi";
import { useI18n } from "@/i18n/I18nProvider";
import type { SubscriptionSummary } from "@/lib/subscription";

/** Carrega a situação da assinatura de quem tem PRO, assinatura no Stripe ou pagamento pendente. */
export function useSubscription() {
  const { t } = useI18n();
  const { profile } = useAuth();
  const [summary, setSummary] = useState<SubscriptionSummary | null>(null);
  const [bonusDays, setBonusDays] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const relevant = Boolean(profile && (profile.plan === "PRO" || profile.hasBilling || profile.paymentFailed));

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getSubscription();
      setSummary(data.summary);
      setBonusDays(data.bonusDays);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("dashboard.subscription.loadFailed"));
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  // Recarrega quando o plano muda (ex.: depois do webhook do Stripe).
  const plan = profile?.plan;
  const hasBilling = profile?.hasBilling;
  useEffect(() => {
    if (relevant) load();
    else setSummary(null);
  }, [relevant, plan, hasBilling, load]);

  return { summary, bonusDays, isLoading, error, reload: load };
}
