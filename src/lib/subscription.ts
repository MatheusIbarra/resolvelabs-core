import { PRO_PRICE_LABEL } from "./content";

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

export function formatDaysLeft(days: number): string {
  if (days === 0) return "termina hoje";
  return days === 1 ? "falta 1 dia" : `faltam ${days} dias`;
}

const fmt = (iso: string) => new Date(iso).toLocaleDateString("pt-BR");

export interface SubscriptionView {
  label: string;
  tone: "brand" | "warn" | "neutral";
  message: string;
  /** Dias restantes até o evento principal (fim do teste, cobrança ou expiração). */
  days: number | null;
  daysCaption: string | null;
}

/** Texto exibido ao cliente para cada situação da assinatura. `null` = nada a mostrar. */
export function describeSubscription(s: SubscriptionSummary): SubscriptionView | null {
  switch (s.kind) {
    case "trial": {
      const days = daysUntil(s.endsAt);
      return {
        label: "Teste grátis",
        tone: "brand",
        message: `Seu teste grátis termina em ${fmt(s.endsAt)} (${formatDaysLeft(days)}). Depois disso, a cobrança de ${PRO_PRICE_LABEL} é feita automaticamente. Cancele antes para não ser cobrado.`,
        days,
        daysCaption: "dias de teste restantes",
      };
    }
    case "active": {
      const days = daysUntil(s.nextBillingAt);
      return {
        label: "Assinatura ativa",
        tone: "brand",
        message: `Próxima cobrança de ${PRO_PRICE_LABEL} em ${fmt(s.nextBillingAt)}${days > 0 ? ` (em ${days} ${days === 1 ? "dia" : "dias"})` : " (hoje)"}.`,
        days,
        daysCaption: "dias até a próxima cobrança",
      };
    }
    case "canceling": {
      const days = daysUntil(s.endsAt);
      return {
        label: "Cancelamento agendado",
        tone: "warn",
        message: `Sua assinatura foi cancelada e não será renovada. Você mantém o acesso PRO até ${fmt(s.endsAt)} (${formatDaysLeft(days)}).`,
        days,
        daysCaption: "dias de acesso restantes",
      };
    }
    case "temporary": {
      const days = daysUntil(s.endsAt);
      return {
        label: "PRO temporário",
        tone: "warn",
        message: `Seu acesso PRO (bônus ou concessão) vai até ${fmt(s.endsAt)} (${formatDaysLeft(days)}). Assine para manter o acesso depois dessa data.`,
        days,
        daysCaption: "dias de acesso restantes",
      };
    }
    case "lifetime":
      return { label: "PRO vitalício", tone: "brand", message: "Seu acesso PRO não tem data de expiração.", days: null, daysCaption: null };
    case "past_due":
      return {
        label: "Pagamento pendente",
        tone: "warn",
        message: "Não conseguimos cobrar seu cartão. Atualize a forma de pagamento para manter o acesso.",
        days: null,
        daysCaption: null,
      };
    default:
      return null;
  }
}
