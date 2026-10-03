import type { ClientTranslator } from "@/i18n/I18nProvider";

export type SubscriptionSummary =
  | { kind: "none" }
  | { kind: "admin" }
  | { kind: "lifetime" }
  | { kind: "temporary"; endsAt: string }
  | { kind: "trial"; endsAt: string }
  | { kind: "active"; nextBillingAt: string }
  | { kind: "canceling"; endsAt: string }
  | { kind: "past_due" }
  | { kind: "ended" };

const DAY_MS = 24 * 60 * 60 * 1000;

export function daysUntil(iso: string, now = Date.now()): number {
  return Math.max(0, Math.ceil((new Date(iso).getTime() - now) / DAY_MS));
}

export function formatDaysLeft(tr: ClientTranslator, days: number): string {
  return days === 0 ? tr.t("dashboard.subscription.endsToday") : tr.tn("dashboard.subscription.daysLeft", days);
}

export interface SubscriptionView {
  label: string;
  tone: "brand" | "warn" | "neutral";
  message: string;
  /** Dias restantes até o evento principal (fim do teste, cobrança ou expiração). */
  days: number | null;
  daysCaption: string | null;
}

/** Texto exibido ao cliente para cada situação da assinatura. `null` = nada a mostrar. */
export function describeSubscription(s: SubscriptionSummary, tr: ClientTranslator): SubscriptionView | null {
  const price = tr.t("common.pro.priceLabel");
  switch (s.kind) {
    case "trial": {
      const days = daysUntil(s.endsAt);
      return {
        label: tr.t("dashboard.subscription.trial.label"),
        tone: "brand",
        message: tr.t("dashboard.subscription.trial.message", { date: tr.date(s.endsAt), left: formatDaysLeft(tr, days), price }),
        days,
        daysCaption: tr.t("dashboard.subscription.trial.caption"),
      };
    }
    case "active": {
      const days = daysUntil(s.nextBillingAt);
      return {
        label: tr.t("dashboard.subscription.active.label"),
        tone: "brand",
        message: tr.t("dashboard.subscription.active.message", {
          price,
          date: tr.date(s.nextBillingAt),
          when: days > 0 ? tr.tn("dashboard.subscription.inDays", days) : tr.t("dashboard.subscription.today"),
        }),
        days,
        daysCaption: tr.t("dashboard.subscription.active.caption"),
      };
    }
    case "canceling": {
      const days = daysUntil(s.endsAt);
      return {
        label: tr.t("dashboard.subscription.canceling.label"),
        tone: "warn",
        message: tr.t("dashboard.subscription.canceling.message", { date: tr.date(s.endsAt), left: formatDaysLeft(tr, days) }),
        days,
        daysCaption: tr.t("dashboard.subscription.canceling.caption"),
      };
    }
    case "temporary": {
      const days = daysUntil(s.endsAt);
      return {
        label: tr.t("dashboard.subscription.temporary.label"),
        tone: "warn",
        message: tr.t("dashboard.subscription.temporary.message", { date: tr.date(s.endsAt), left: formatDaysLeft(tr, days) }),
        days,
        daysCaption: tr.t("dashboard.subscription.temporary.caption"),
      };
    }
    case "lifetime":
      return { label: tr.t("dashboard.subscription.lifetime.label"), tone: "brand", message: tr.t("dashboard.subscription.lifetime.message"), days: null, daysCaption: null };
    case "past_due":
      return { label: tr.t("dashboard.subscription.pastDue.label"), tone: "warn", message: tr.t("dashboard.subscription.pastDue.message"), days: null, daysCaption: null };
    default:
      return null;
  }
}
