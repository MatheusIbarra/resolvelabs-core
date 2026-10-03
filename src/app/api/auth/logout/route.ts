import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/lib/session";
import { getCurrentUser } from "@/lib/serverAuth";
import { logActivity } from "@/lib/activityLog";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const user = await getCurrentUser(request).catch(() => null);
  if (user) await logActivity(request, { event: "logout", user: { id: user.id, email: user.email, role: user.role } });
  const response = NextResponse.json({ ok: true });
  response.cookies.delete(SESSION_COOKIE);
  return response;
}
