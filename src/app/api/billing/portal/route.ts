import { apiError } from "@/lib/apiError";
import { getRequestLocale } from "@/i18n/server";
import { localizePath } from "@/i18n/paths";
import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser, unauthenticated } from "@/lib/serverAuth";
import { StripeNotConfiguredError, appUrl, getStripe } from "@/lib/stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Portal do cliente do Stripe: trocar cartão, ver faturas e cancelar a assinatura. */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) return unauthenticated(request);
    if (!user.stripeCustomerId) {
      return apiError(request, "noStripeCustomer", 400);
    }

    const session = await getStripe().billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${appUrl(request.nextUrl.origin)}${localizePath(getRequestLocale(request), "/dashboard")}`,
    });
    return NextResponse.json({ url: session.url });
  } catch (err) {
    if (err instanceof StripeNotConfiguredError) {
      return apiError(request, "paymentsUnavailable", 503);
    }
    console.error("[billing/portal]", err);
    return apiError(request, "portalFailed", 500);
  }
}
