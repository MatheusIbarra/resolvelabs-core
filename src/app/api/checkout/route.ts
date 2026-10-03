import { apiError } from "@/lib/apiError";
import { getRequestLocale, requestTranslator } from "@/i18n/server";
import { STRIPE_LOCALE } from "@/i18n/config";
import { localizePath } from "@/i18n/paths";
import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser, unauthenticated } from "@/lib/serverAuth";
import { StripeNotConfiguredError, appUrl, getStripe } from "@/lib/stripe";
import { PRO_PRICE_CENTS, PRO_TRIAL_DAYS } from "@/lib/content";
import { rateLimit } from "@/lib/rateLimit";
import { consumeCoupon, findUsableCoupon } from "@/lib/couponRedeem";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Cria a sessão do Stripe Checkout: assinatura de R$ 7,99/mês com 7 dias de teste grátis. */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) return unauthenticated(request);

    if (user.role === "admin") {
      return apiError(request, "adminFullAccess", 400);
    }
    if (user.role === "pro" && user.stripeSubscriptionId) {
      return apiError(request, "activeSubscription", 409);
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
      const limited = rateLimit(`coupon:${user.id}`, 10, 10 * 60_000, request);
      if (limited) return limited;
      coupon = await findUsableCoupon(body.couponCode);
      if (!coupon.ok) return apiError(request, coupon.error, 400);
    }

    // 100% de desconto = acesso gratuito vitalício: não passa pelo Stripe.
    if (coupon?.ok && coupon.coupon.discountPercent === 100) {
      if (user.role === "pro" && !user.planExpiresAt) {
        return apiError(request, "lifetimePro", 409);
      }
      if (!(await consumeCoupon(coupon.coupon.code))) {
        return apiError(request, "couponExhausted", 400);
      }
      user.role = "pro";
      user.planExpiresAt = undefined;
      user.couponCode = coupon.coupon.code;
      await user.save();
      return NextResponse.json({ redeemed: true });
    }

    const stripe = getStripe();
    const locale = getRequestLocale(request);
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
              description: requestTranslator(request).t("api.stripeProductDescription"),
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
      locale: STRIPE_LOCALE[locale],
      success_url: `${base}${localizePath(locale, "/dashboard")}?checkout=success`,
      cancel_url: `${base}${localizePath(locale, "/checkout")}?checkout=canceled`,
    });

    if (!session.url) throw new Error("Stripe did not return the checkout URL.");
    return NextResponse.json({ url: session.url, trial: eligibleForTrial });
  } catch (err) {
    if (err instanceof StripeNotConfiguredError) {
      return apiError(request, "paymentsUnavailable", 503);
    }
    console.error("[checkout]", err);
    return apiError(request, "checkoutFailed", 500);
  }
}
