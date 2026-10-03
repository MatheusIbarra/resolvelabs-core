import { NextResponse, type NextRequest } from "next/server";
import { isValidObjectId } from "mongoose";
import type Stripe from "stripe";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/models/User";
import { getStripe } from "@/lib/stripe";
import { rewardReferrerFor } from "@/lib/referrals";
import { consumeCoupon } from "@/lib/couponRedeem";
import type { UserDoc as UserDocLike } from "@/lib/serverAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const idOf = (value: string | { id: string } | null | undefined) => (typeof value === "string" ? value : value?.id);

/** Assinatura de uma fatura (API recente: invoice.parent.subscription_details.subscription). */
const invoiceSubscriptionId = (invoice: Stripe.Invoice) => idOf(invoice.parent?.subscription_details?.subscription);

/**
 * Anti-abuso do teste grátis: o mesmo cartão em outra conta não ganha novo período de teste.
 * Em produção (livemode) o teste é encerrado na hora e a cobrança é feita; em modo teste só registra.
 * Retorna true quando o uso do teste foi considerado repetido.
 */
async function isRepeatedTrialCard(user: UserDocLike, subscriptionId: string, livemode: boolean): Promise<boolean> {
  const stripe = getStripe();
  const sub = await stripe.subscriptions.retrieve(subscriptionId, { expand: ["default_payment_method"] });
  const method = sub.default_payment_method;
  const fingerprint = method && typeof method !== "string" ? method.card?.fingerprint : null;
  if (!fingerprint) return false;

  const usedByAnother = await User.exists({ _id: { $ne: user._id }, cardFingerprints: fingerprint });
  await User.updateOne({ _id: user._id }, { $addToSet: { cardFingerprints: fingerprint } });
  if (!usedByAnother) return false;

  console.warn("[stripe webhook] cartão já usado em outra conta", { user: user.id, subscriptionId, livemode });
  if (!livemode) return false; // no modo teste os mesmos cartões 4242... se repetem o tempo todo

  if (sub.status === "trialing") {
    await stripe.subscriptions.update(subscriptionId, { trial_end: "now", proration_behavior: "none" });
  }
  return true;
}

/** O usuário assinou (iniciou o trial): vira PRO e guarda os IDs do Stripe. */
async function onCheckoutCompleted(session: Stripe.Checkout.Session) {
  if (session.mode !== "subscription") return;

  const userId = session.client_reference_id ?? session.metadata?.userId;
  const customerId = idOf(session.customer);
  const subscriptionId = idOf(session.subscription);
  if (!userId || !isValidObjectId(userId) || !customerId || !subscriptionId) {
    console.error("[stripe webhook] checkout.session.completed sem usuário/cliente/assinatura", session.id);
    return;
  }

  const user = await User.findById(userId);
  if (!user) {
    console.error("[stripe webhook] usuário não encontrado para a sessão", session.id, userId);
    return;
  }

  const previousSubscriptionId = user.stripeSubscriptionId;
  user.stripeCustomerId = customerId;
  user.stripeSubscriptionId = subscriptionId;
  if (user.role !== "admin") {
    user.role = "pro";
    user.planExpiresAt = undefined; // o Stripe passa a controlar o acesso
  }
  user.paymentFailedAt = undefined;

  // Cupom usado no checkout: consome 1 uso uma única vez (o webhook pode ser reenviado).
  const couponCode = session.metadata?.couponCode;
  if (couponCode && user.couponCode !== couponCode) {
    user.couponCode = couponCode;
    if (!(await consumeCoupon(couponCode))) {
      console.warn("[stripe webhook] cupom sem usos disponíveis após o checkout", couponCode, session.id);
    }
  }
  await user.save();

  // Mesmo cartão em outra conta: sem novo teste grátis e sem bônus de indicação.
  const repeatedCard = await isRepeatedTrialCard(user, subscriptionId, session.livemode);

  // Programa de indicação: o indicador ganha dias de PRO quando o indicado entra no trial.
  if (!repeatedCard) await rewardReferrerFor(user);

  // Reassinatura: encerra a assinatura anterior para não cobrar em duplicidade.
  if (previousSubscriptionId && previousSubscriptionId !== subscriptionId) {
    try {
      await getStripe().subscriptions.cancel(previousSubscriptionId);
    } catch (err) {
      console.warn("[stripe webhook] não foi possível cancelar a assinatura anterior", previousSubscriptionId, err);
    }
  }
}

/** Cobrança falhou (ex.: após o trial): remove o acesso PRO até o pagamento ser regularizado. */
async function onPaymentFailed(invoice: Stripe.Invoice) {
  const subscriptionId = invoiceSubscriptionId(invoice);
  if (!subscriptionId) return;

  // Marca a falha (a tela mostra o aviso) e suspende o acesso PRO.
  await User.updateOne(
    { stripeSubscriptionId: subscriptionId, role: { $ne: "admin" } },
    { $set: { paymentFailedAt: new Date() } },
  );
  const result = await User.updateOne(
    { stripeSubscriptionId: subscriptionId, role: "pro" },
    { $set: { role: "free" } },
  );
  if (result.modifiedCount > 0) {
    // Ponto de extensão: enviar e-mail de aviso de falha de pagamento.
    console.warn("[stripe webhook] pagamento falhou; usuário rebaixado para free", subscriptionId);
  }
}

/** Pagamento confirmado (inclusive retentativa após falha): restaura o acesso PRO. */
async function onInvoicePaid(invoice: Stripe.Invoice) {
  const subscriptionId = invoiceSubscriptionId(invoice);
  if (!subscriptionId) return;
  await User.updateOne({ stripeSubscriptionId: subscriptionId, role: "free" }, { $set: { role: "pro" } });
  await User.updateOne({ stripeSubscriptionId: subscriptionId }, { $unset: { paymentFailedAt: "" } });
}

/** Assinatura encerrada (cancelamento chega aqui ao fim do período pago): volta para free. */
async function onSubscriptionDeleted(subscription: Stripe.Subscription) {
  await User.updateOne(
    { stripeSubscriptionId: subscription.id, role: { $ne: "admin" } },
    { $set: { role: "free" }, $unset: { stripeSubscriptionId: "", planExpiresAt: "", paymentFailedAt: "" } },
  );
}

export async function POST(request: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    console.error("[stripe webhook] STRIPE_WEBHOOK_SECRET ausente");
    return NextResponse.json({ error: "Webhook not configured." }, { status: 500 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) return NextResponse.json({ error: "Missing signature." }, { status: 400 });

  // O corpo precisa ser o texto cru: qualquer re-serialização invalida a assinatura.
  const payload = await request.text();

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(payload, signature, secret);
  } catch (err) {
    console.warn("[stripe webhook] assinatura inválida", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  try {
    await connectDB();
    switch (event.type) {
      case "checkout.session.completed":
        await onCheckoutCompleted(event.data.object);
        break;
      case "invoice.payment_failed":
        await onPaymentFailed(event.data.object);
        break;
      case "invoice.paid":
        await onInvoicePaid(event.data.object);
        break;
      case "customer.subscription.deleted":
        await onSubscriptionDeleted(event.data.object);
        break;
      default:
        break; // eventos não tratados são confirmados para o Stripe não reenviar
    }
    return NextResponse.json({ received: true });
  } catch (err) {
    // 500 faz o Stripe reenviar o evento (os handlers são idempotentes).
    console.error("[stripe webhook] falha ao processar", event.type, err);
    return NextResponse.json({ error: "Failed to process the event." }, { status: 500 });
  }
}
