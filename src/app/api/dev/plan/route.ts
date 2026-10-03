import { apiError } from "@/lib/apiError";
import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser, issueSession, publicUser, unauthenticated } from "@/lib/serverAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * SOMENTE DESENVOLVIMENTO: simula a assinatura PRO (checkout e controles de demo).
 * Em produção o role deve mudar via webhook do Stripe, nunca por uma chamada do cliente.
 */
export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV === "production" && process.env.ENABLE_DEV_BILLING !== "true") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let body: { plan?: unknown; resetUsage?: unknown };
  try {
    body = await request.json();
  } catch {
    return apiError(request, "invalidBody", 400);
  }

  try {
    const user = await getCurrentUser(request);
    if (!user) return unauthenticated(request);
    if (user.role === "admin") {
      return apiError(request, "adminNoPlan", 403);
    }

    if (body.plan === "FREE" || body.plan === "PRO") {
      user.role = body.plan === "PRO" ? "pro" : "free";
      user.planExpiresAt = undefined;
    }
    else if (body.plan !== undefined) return apiError(request, "invalidPlan", 400);
    if (body.resetUsage === true) user.usageCount = 0;
    await user.save();

    const response = NextResponse.json({ user: publicUser(user) });
    // O middleware lê o role do cookie: reemite com o novo valor.
    await issueSession(response, user);
    return response;
  } catch (err) {
    console.error("[dev/plan]", err);
    return apiError(request, "internal", 500);
  }
}
