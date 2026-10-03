import { apiError } from "@/lib/apiError";
import { NextResponse, type NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/models/User";
import { isDuplicateKeyError, parseEmail, parsePhone, passwordError } from "@/lib/validation";
import { clientIp, rateLimit } from "@/lib/rateLimit";
import { logActivity } from "@/lib/activityLog";
import { generateAffiliateCode, parseAffiliateCode, REF_COOKIE } from "@/lib/affiliate";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BCRYPT_ROUNDS = 12;
const MAX_CODE_ATTEMPTS = 5;

export async function POST(request: NextRequest) {
  const limited = rateLimit(`register:ip:${clientIp(request)}`, 10, 60 * 60_000, request);
  if (limited) return limited;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return apiError(request, "invalidBody", 400);
  }

  // Só lemos email, password, phone, termsAccepted e ref. Qualquer outro campo (ex.: role) é ignorado.
  const email = parseEmail(body?.email);
  if (!email) return apiError(request, "invalidEmail", 400);

  const pwError = passwordError(body?.password);
  if (pwError) return apiError(request, pwError.key, 400, pwError.vars);

  const phone = parsePhone(body?.phone);
  if (!phone) return apiError(request, "invalidPhone", 400);

  if (body?.termsAccepted !== true) {
    return apiError(request, "termsRequired", 400);
  }

  try {
    await connectDB();
    const hash = await bcrypt.hash(body.password as string, BCRYPT_ROUNDS);

    // Indicação: só vale se o código pertence a um usuário existente.
    const refCode = parseAffiliateCode(request.cookies.get(REF_COOKIE)?.value) ?? parseAffiliateCode(body?.ref);
    const referrer = refCode ? await User.exists({ affiliateCode: refCode }) : null;

    for (let attempt = 0; attempt < MAX_CODE_ATTEMPTS; attempt++) {
      try {
        const user = await User.create({
          email,
          password: hash,
          phone,
          termsAccepted: true,
          termsAcceptedAt: new Date(),
          role: "free",
          usageCount: 0,
          affiliateCode: generateAffiliateCode(),
          ...(referrer && refCode ? { referredBy: refCode } : {}),
        });
        await logActivity(request, { event: "register", user: { id: user.id, email: user.email, role: user.role } });
        const response = NextResponse.json(
          { user: { id: user.id, email: user.email, role: user.role } },
          { status: 201 },
        );
        response.cookies.delete(REF_COOKIE); // indicação consumida
        return response;
      } catch (err) {
        if (!isDuplicateKeyError(err)) throw err;
        // Duplicidade de e-mail encerra; colisão de affiliateCode tenta outro código.
        const keyPattern = (err as { keyPattern?: Record<string, unknown> }).keyPattern;
        if (keyPattern && !("affiliateCode" in keyPattern)) {
          return apiError(request, "emailTaken", 409);
        }
      }
    }
    throw new Error("Não foi possível gerar um affiliateCode único.");
  } catch (err) {
    console.error("[auth/register]", err);
    return apiError(request, "internal", 500);
  }
}
