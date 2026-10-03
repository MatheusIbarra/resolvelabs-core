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

const INVALID_CREDENTIALS = { error: "E-mail ou senha incorretos." };

// Hash descartável para igualar o tempo de resposta quando o e-mail não existe
// (evita enumeração de usuários por diferença de timing).
let dummyHash: Promise<string> | null = null;
const getDummyHash = () => (dummyHash ??= bcrypt.hash("resolvelabs-dummy-password", 12));

export async function POST(request: NextRequest) {
  const limited = rateLimit(`login:ip:${clientIp(request)}`, 20, 15 * 60_000);
  if (limited) return limited;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corpo da requisição inválido." }, { status: 400 });
  }

  const email = parseEmail(body?.email);
  const password = body?.password;
  if (!email || typeof password !== "string" || password.length === 0 || password.length > 1024) {
    return NextResponse.json(INVALID_CREDENTIALS, { status: 401 });
  }

  // Limite extra por e-mail: freia ataques de senha distribuídos entre IPs.
  const emailLimited = rateLimit(`login:email:${email}`, 10, 15 * 60_000);
  if (emailLimited) return emailLimited;

  try {
    await connectDB();
    const user = await User.findOne({ email }).select("+password");

    const passwordHash = user?.password ?? (await getDummyHash());
    const valid = await bcrypt.compare(password, passwordHash);
    if (!user || !valid) {
      await logActivity(request, { event: "login_failed", email });
      return NextResponse.json(INVALID_CREDENTIALS, { status: 401 });
    }

    await expireProIfNeeded(user);

    await logActivity(request, { event: "login", user: { id: user.id, email: user.email, role: user.role } });
    const response = NextResponse.json({ user: publicUser(user) });
    await issueSession(response, user);
    return response;
  } catch (err) {
    console.error("[auth/login]", err);
    return NextResponse.json({ error: "Erro interno. Tente novamente." }, { status: 500 });
  }
}
