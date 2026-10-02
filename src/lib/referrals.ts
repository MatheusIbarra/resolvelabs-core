import { User, type IUser } from "@/models/User";
import type { UserDoc } from "./serverAuth";
import { AFFILIATE_REWARD_DAYS, PRO_PRICE_CENTS } from "./content";
import { generateAffiliateCode } from "./affiliate";
import { isDuplicateKeyError } from "./validation";
import { getStripe } from "./stripe";

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Estende de verdade o acesso de quem assina pelo Stripe, para os dias aparecerem na tela:
 *  - em teste grátis: adia o fim do teste (e o cancelamento agendado, se houver);
 *  - ativa com cancelamento agendado: adia a data do cancelamento;
 *  - ativa: adia a próxima cobrança (sem cobrar proporcional);
 *  - qualquer outro status: crédito em dinheiro proporcional, abatido da próxima fatura.
 */
export async function extendStripeSubscription(referrer: UserDoc, days: number): Promise<void> {
  const stripe = getStripe();
  const extra = days * 86400;
  const sub = await stripe.subscriptions.retrieve(referrer.stripeSubscriptionId!);
  const periodEnd = sub.items.data[0]?.current_period_end;

  if (sub.status === "trialing" && sub.trial_end) {
    await stripe.subscriptions.update(sub.id, {
      trial_end: sub.trial_end + extra,
      ...(sub.cancel_at ? { cancel_at: sub.cancel_at + extra } : {}),
      proration_behavior: "none",
    });
  } else if (sub.status === "active" && sub.cancel_at) {
    await stripe.subscriptions.update(sub.id, { cancel_at: sub.cancel_at + extra, proration_behavior: "none" });
  } else if (sub.status === "active" && periodEnd) {
    // Marca que isso é um adiamento de quem já pagou (o Stripe passa a mostrar "trialing").
    await stripe.subscriptions.update(sub.id, {
      trial_end: periodEnd + extra,
      proration_behavior: "none",
      metadata: { bonus_extended: "true" },
    });
  } else {
    await stripe.customers.createBalanceTransaction(referrer.stripeCustomerId!, {
      amount: -Math.round((PRO_PRICE_CENTS * days) / 30),
      currency: "brl",
      description: `Bônus de indicação: ${days} dias de PRO`,
    });
  }
}

/** Garante que o usuário tenha um código de indicação (contas antigas ganham um sob demanda). */
export async function ensureAffiliateCode(user: UserDoc): Promise<string> {
  for (let attempt = 0; !user.affiliateCode && attempt < 5; attempt++) {
    try {
      user.affiliateCode = generateAffiliateCode();
      await user.save();
    } catch (err) {
      user.affiliateCode = undefined;
      if (!isDuplicateKeyError(err)) throw err;
    }
  }
  if (!user.affiliateCode) throw new Error("Não foi possível gerar o código de indicação.");
  return user.affiliateCode;
}

/** PRO controlado pelo Stripe (sem data de expiração própria): a bonificação vira crédito na fatura. */
const isStripeManaged = (u: Pick<IUser, "role" | "stripeSubscriptionId" | "planExpiresAt">) =>
  u.role === "pro" && Boolean(u.stripeSubscriptionId) && !u.planExpiresAt;

async function applyRewardDays(referrer: UserDoc, days: number) {
  if (referrer.role === "admin") {
    // já tem acesso total: só contabiliza
  } else if (isStripeManaged(referrer) && referrer.stripeCustomerId) {
    await extendStripeSubscription(referrer, days);
  } else if (referrer.role === "pro" && !referrer.planExpiresAt) {
    // PRO vitalício (concedido manualmente): nada a estender
  } else {
    // free ou PRO com data de expiração: soma os dias a partir do vencimento atual (ou de agora)
    const now = Date.now();
    const base = referrer.planExpiresAt && referrer.planExpiresAt.getTime() > now ? referrer.planExpiresAt.getTime() : now;
    referrer.role = "pro";
    referrer.planExpiresAt = new Date(base + days * DAY_MS);
    await referrer.save();
  }

  await User.updateOne({ _id: referrer._id }, { $inc: { referralRewardDays: days } });
}

/**
 * Chamado quando o usuário indicado inicia a assinatura (entra no trial).
 * Paga a recompensa UMA única vez por indicado, mesmo com reenvios do webhook.
 */
export async function rewardReferrerFor(referred: UserDoc): Promise<void> {
  if (!referred.referredBy) return;

  // "Claim" atômico: só quem conseguir marcar o indicado como recompensado prossegue.
  const claimed = await User.findOneAndUpdate(
    { _id: referred._id, referralRewardedAt: { $exists: false } },
    { $set: { referralRewardedAt: new Date() } },
  );
  if (!claimed) return;

  try {
    const referrer = await User.findOne({ affiliateCode: referred.referredBy });
    if (!referrer || referrer.id === referred.id) return;
    await applyRewardDays(referrer, AFFILIATE_REWARD_DAYS);
  } catch (err) {
    // Libera o claim para que o reenvio do webhook tente de novo.
    await User.updateOne({ _id: referred._id }, { $unset: { referralRewardedAt: "" } });
    throw err;
  }
}
