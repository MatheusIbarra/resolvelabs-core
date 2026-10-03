import { apiError } from "@/lib/apiError";
import { NextResponse, type NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/models/User";
import { expireProIfNeeded, issueSession, publicUser } from "@/lib/serverAuth";
import { parseEmail } from "@/lib/validation";
import { clientIp, rateLimit } from "@/lib/rateLimit";
import { logActivity } from "@/lib/activityLog";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";


// Hash descartável para igualar o tempo de resposta quando o e-mail não existe
// (evita enumeração de usuários por diferença de timing).
let dummyHash: Promise<string> | null = null;
const getDummyHash = () => (dummyHash ??= bcrypt.hash("resolvelabs-dummy-password", 12));

export async function POST(request: NextRequest) {
  const limited = rateLimit(`login:ip:${clientIp(request)}`, 20, 15 * 60_000, request);
  if (limited) return limited;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return apiError(request, "invalidBody", 400);
  }

  const email = parseEmail(body?.email);
  const password = body?.password;
  if (!email || typeof password !== "string" || password.length === 0 || password.length > 1024) {
    return apiError(request, "invalidCredentials", 401);
  }

  // Limite extra por e-mail: freia ataques de senha distribuídos entre IPs.
  const emailLimited = rateLimit(`login:email:${email}`, 10, 15 * 60_000, request);
  if (emailLimited) return emailLimited;

  try {
    await connectDB();
    const user = await User.findOne({ email }).select("+password");

    const passwordHash = user?.password ?? (await getDummyHash());
    const valid = await bcrypt.compare(password, passwordHash);
    if (!user || !valid) {
      await logActivity(request, { event: "login_failed", email });
      return apiError(request, "invalidCredentials", 401);
    }

    await expireProIfNeeded(user);

    await logActivity(request, { event: "login", user: { id: user.id, email: user.email, role: user.role } });
    const response = NextResponse.json({ user: publicUser(user) });
    await issueSession(response, user);
    return response;
  } catch (err) {
    console.error("[auth/login]", err);
    return apiError(request, "internal", 500);
  }
}
