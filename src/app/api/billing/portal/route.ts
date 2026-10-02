import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser, unauthenticated } from "@/lib/serverAuth";
import { StripeNotConfiguredError, appUrl, getStripe } from "@/lib/stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Portal do cliente do Stripe: trocar cartão, ver faturas e cancelar a assinatura. */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) return unauthenticated();
    if (!user.stripeCustomerId) {
      return NextResponse.json({ error: "Sua conta não possui assinatura no Stripe." }, { status: 400 });
    }

    const session = await getStripe().billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${appUrl(request.nextUrl.origin)}/dashboard`,
    });
    return NextResponse.json({ url: session.url });
  } catch (err) {
    if (err instanceof StripeNotConfiguredError) {
      return NextResponse.json({ error: "Pagamentos indisponíveis no momento." }, { status: 503 });
    }
    console.error("[billing/portal]", err);
    return NextResponse.json({ error: "Não foi possível abrir o portal. Tente novamente." }, { status: 500 });
  }
}
