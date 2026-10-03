import { NextResponse, type NextRequest } from "next/server";
import { clientIp, rateLimit } from "@/lib/rateLimit";
import { getCurrentUser } from "@/lib/serverAuth";
import { cleanPath, cleanReferrer, logActivity } from "@/lib/activityLog";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Visita de página (qualquer rota, logada ou não). Lê só { path, referrer } do body, sem query string.
 * Usuário, IP, local e navegador vêm do servidor (cookie e cabeçalhos), nunca do cliente.
 */
export async function POST(request: NextRequest) {
  const limited = rateLimit(`activity:${clientIp(request)}`, 240, 10 * 60_000, request);
  if (limited) return limited;

  let body: { path?: unknown; referrer?: unknown };
  try {
    body = await request.json();
  } catch {
    return new NextResponse(null, { status: 400 });
  }
  const path = cleanPath(body.path);
  if (!path) return new NextResponse(null, { status: 400 });

  const user = await getCurrentUser(request).catch(() => null);
  await logActivity(request, {
    event: "pageview",
    user: user && { id: user.id, email: user.email, role: user.role },
    path,
    referrer: cleanReferrer(body.referrer),
  });
  return new NextResponse(null, { status: 204 });
}
