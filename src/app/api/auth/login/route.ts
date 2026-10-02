import { NextResponse, type NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/models/User";
import { expireProIfNeeded, issueSession, publicUser } from "@/lib/serverAuth";
import { parseEmail } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const INVALID_CREDENTIALS = { error: "E-mail ou senha incorretos." };

// Hash descartável para igualar o tempo de resposta quando o e-mail não existe
// (evita enumeração de usuários por diferença de timing).
let dummyHash: Promise<string> | null = null;
const getDummyHash = () => (dummyHash ??= bcrypt.hash("resolvelabs-dummy-password", 12));

export async function POST(request: NextRequest) {
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

  try {
    await connectDB();
    const user = await User.findOne({ email }).select("+password");

    const passwordHash = user?.password ?? (await getDummyHash());
    const valid = await bcrypt.compare(password, passwordHash);
    if (!user || !valid) return NextResponse.json(INVALID_CREDENTIALS, { status: 401 });

    await expireProIfNeeded(user);

    const response = NextResponse.json({ user: publicUser(user) });
    await issueSession(response, user);
    return response;
  } catch (err) {
    console.error("[auth/login]", err);
    return NextResponse.json({ error: "Erro interno. Tente novamente." }, { status: 500 });
  }
}
