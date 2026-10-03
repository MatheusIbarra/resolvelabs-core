import { apiError } from "@/lib/apiError";
import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySession } from "@/lib/session";
import { getCurrentUser, issueSession, publicUser, unauthenticated } from "@/lib/serverAuth";
import { ensureAffiliateCode } from "@/lib/referrals";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const session = await verifySession(token);

  try {
    // Estado atual no banco (role pode ter mudado; PRO manual pode ter expirado).
    const user = session ? await getCurrentUser(request) : null;
    if (!user) {
      const response = unauthenticated(request);
      if (token) response.cookies.delete(SESSION_COOKIE);
      return response;
    }

    // Usuários antigos (criados antes dos afiliados) ganham um código sob demanda.
    await ensureAffiliateCode(user);

    const response = NextResponse.json(
      { isAuthenticated: true, user: publicUser(user) },
      { headers: { "Cache-Control": "no-store" } },
    );

    // Reemite o cookie quando o role mudou (promoção, rebaixamento ou expiração).
    if (session && user.role !== session.role) await issueSession(response, user);
    return response;
  } catch (err) {
    console.error("[auth/me]", err);
    return apiError(request, "internal", 500);
  }
}
