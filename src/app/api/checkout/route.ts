import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser, unauthenticated } from "@/lib/serverAuth";
import { StripeNotConfiguredError, appUrl, getStripe } from "@/lib/stripe";
import { PRO_PRICE_CENTS, PRO_TRIAL_DAYS } from "@/lib/content";
import { consumeCoupon, findUsableCoupon } from "@/lib/couponRedeem";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Cria a sessão do Stripe Checkout: assinatura de R$ 7,99/mês com 7 dias de teste grátis. */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) return unauthenticated();

    if (user.role === "admin") {
      return NextResponse.json({ error: "Contas admin já têm acesso total." }, { status: 400 });
    }
    if (user.role === "pro" && user.stripeSubscriptionId) {
      return NextResponse.json({ error: "Você já possui uma assinatura ativa." }, { status: 409 });
    }

    let body: { couponCode?: unknown } = {};
    try {
      body = await request.json();
    } catch {
      // corpo vazio: checkout sem cupom
    }

    // Cupom opcional. O cliente só envia o código; o desconto vem sempre do banco.
    let coupon: Awaited<ReturnType<typeof findUsableCoupon>> | null = null;
    if (body.couponCode !== undefined && body.couponCode !== null && body.couponCode !== "") {
      coupon = await findUsableCoupon(body.couponCode);
      if (!coupon.ok) return NextResponse.json({ error: coupon.error }, { status: 400 });
    }

    // 100% de desconto = acesso gratuito vitalício: não passa pelo Stripe.
    if (coupon?.ok && coupon.coupon.discountPercent === 100) {
      if (user.role === "pro" && !user.planExpiresAt) {
        return NextResponse.json({ error: "Você já tem acesso PRO vitalício." }, { status: 409 });
      }
      if (!(await consumeCoupon(coupon.coupon.code))) {
        return NextResponse.json({ error: "Este cupom atingiu o limite de usos." }, { status: 400 });
      }
      user.role = "pro";
      user.planExpiresAt = undefined;
      user.couponCode = coupon.coupon.code;
      await user.save();
      return NextResponse.json({ redeemed: true });
    }

    const stripe = getStripe();
    const base = appUrl(request.nextUrl.origin);
    const userId = user.id;

    // Quem já assinou antes (tem customer no Stripe) não ganha um novo período de teste.
    const eligibleForTrial = !user.stripeCustomerId;

    // Desconto percentual: vale para a primeira cobrança (após o teste grátis, quando houver).
    const discount =
      coupon?.ok
        ? await stripe.coupons.create({
            percent_off: coupon.coupon.discountPercent,
            duration: "once",
            name: coupon.coupon.code,
            max_redemptions: 1,
          })
        : null;

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "brl",
            unit_amount: PRO_PRICE_CENTS,
            recurring: { interval: "month" },
            product_data: {
              name: "ResolveLabs PRO",
              description: "Acesso ilimitado a todas as ferramentas do ResolveLabs.",
            },
          },
        },
      ],
      // Identifica o comprador no webhook.
      client_reference_id: userId,
      metadata: { userId, ...(coupon?.ok ? { couponCode: coupon.coupon.code } : {}) },
      ...(discount ? { discounts: [{ coupon: discount.id }] } : {}),
      subscription_data: {
        ...(eligibleForTrial ? { trial_period_days: PRO_TRIAL_DAYS } : {}),
        metadata: { userId },
      },
      payment_method_collection: "always", // exige cartão já no início do teste
      ...(user.stripeCustomerId ? { customer: user.stripeCustomerId } : { customer_email: user.email }),
      locale: "pt-BR",
      success_url: `${base}/dashboard?checkout=success`,
      cancel_url: `${base}/checkout?checkout=canceled`,
    });

    if (!session.url) throw new Error("Stripe não retornou a URL do checkout.");
    return NextResponse.json({ url: session.url, trial: eligibleForTrial });
  } catch (err) {
    if (err instanceof StripeNotConfiguredError) {
      return NextResponse.json({ error: "Pagamentos indisponíveis no momento." }, { status: 503 });
    }
    console.error("[checkout]", err);
    return NextResponse.json({ error: "Não foi possível iniciar o checkout. Tente novamente." }, { status: 500 });
  }
}
