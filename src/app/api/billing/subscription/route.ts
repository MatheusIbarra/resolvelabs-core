import { apiError } from "@/lib/apiError";
import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser, unauthenticated } from "@/lib/serverAuth";
import { StripeNotConfiguredError, getStripe } from "@/lib/stripe";
import type { SubscriptionSummary } from "@/lib/subscription";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const iso = (unixSeconds: number) => new Date(unixSeconds * 1000).toISOString();

/** Situação da assinatura do usuário logado: teste, próxima cobrança, cancelamento agendado, etc. */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) return unauthenticated(request);

    let summary: SubscriptionSummary = { kind: "none" };

    if (user.role === "admin") {
      summary = { kind: "admin" };
    } else if (user.stripeSubscriptionId) {
      // Fonte da verdade: o Stripe (datas de teste, ciclo e cancelamento agendado).
      const sub = await getStripe().subscriptions.retrieve(user.stripeSubscriptionId);
      const periodEnd = sub.items.data[0]?.current_period_end; // a partir das APIs recentes, o ciclo fica no item

      if (sub.status === "trialing" && sub.trial_end && sub.metadata?.bonus_extended === "true" && !sub.cancel_at) {
        // Cliente que já pagou e ganhou dias de bônus: para ele isso é "próxima cobrança", não teste grátis.
        summary = { kind: "active", nextBillingAt: iso(sub.trial_end) };
      } else if (sub.status === "trialing" && sub.trial_end) {
        summary = sub.cancel_at_period_end || sub.cancel_at
          ? { kind: "canceling", endsAt: iso(sub.cancel_at ?? sub.trial_end) }
          : { kind: "trial", endsAt: iso(sub.trial_end) };
      } else if (sub.status === "active") {
        const cancelAt = sub.cancel_at ?? (sub.cancel_at_period_end ? periodEnd : null);
        summary = cancelAt
          ? { kind: "canceling", endsAt: iso(cancelAt) }
          : periodEnd
            ? { kind: "active", nextBillingAt: iso(periodEnd) }
            : { kind: "none" };
      } else if (sub.status === "past_due" || sub.status === "unpaid") {
        summary = { kind: "past_due" };
      } else {
        summary = { kind: "ended" };
      }
    } else if (user.role === "pro") {
      summary = user.planExpiresAt ? { kind: "temporary", endsAt: user.planExpiresAt.toISOString() } : { kind: "lifetime" };
    }

    return NextResponse.json({ summary, bonusDays: user.referralRewardDays ?? 0 }, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    if (err instanceof StripeNotConfiguredError) {
      return apiError(request, "paymentsUnavailable", 503);
    }
    console.error("[billing/subscription]", err);
    return apiError(request, "subscriptionFailed", 500);
  }
}
