import { NextResponse, type NextRequest } from "next/server";
import type { HydratedDocument } from "mongoose";
import { connectDB } from "./mongodb";
import { SESSION_COOKIE, sessionCookieOptions, signSession, verifySession } from "./session";
import { User, type IUser } from "@/models/User";

export type UserDoc = HydratedDocument<IUser>;

/** Se o PRO manual venceu, rebaixa o usuário para free. Retorna true quando houve mudança. */
export async function expireProIfNeeded(user: UserDoc): Promise<boolean> {
  if (user.role === "pro" && user.planExpiresAt && user.planExpiresAt.getTime() <= Date.now()) {
    user.role = "free";
    user.planExpiresAt = undefined;
    await user.save();
    return true;
  }
  return false;
}

/** Resolve o usuário atual (estado vivo do banco, com expiração de PRO aplicada). */
export async function getCurrentUser(request: NextRequest): Promise<UserDoc | null> {
  const session = await verifySession(request.cookies.get(SESSION_COOKIE)?.value);
  if (!session) return null;
  await connectDB();
  const user = await User.findById(session.id);
  if (user) await expireProIfNeeded(user);
  return user;
}

/** Grava o cookie de sessão com o role/expiração atuais do usuário. */
export async function issueSession(response: NextResponse, user: UserDoc) {
  const token = await signSession({ id: user.id, email: user.email, role: user.role }, user.planExpiresAt);
  response.cookies.set(SESSION_COOKIE, token, sessionCookieOptions(user.planExpiresAt));
}

export function publicUser(user: UserDoc) {
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    usageCount: user.usageCount,
    planExpiresAt: user.planExpiresAt ?? null,
    affiliateCode: user.affiliateCode ?? null,
    hasBilling: Boolean(user.stripeCustomerId),
    paymentFailed: Boolean(user.paymentFailedAt),
  };
}

export function unauthenticated() {
  return NextResponse.json({ error: "Sessão inválida ou expirada.", code: "UNAUTHENTICATED" }, { status: 401 });
}

type AdminGuard = { admin: UserDoc; response?: never } | { admin?: never; response: NextResponse };

/** RBAC no servidor: confere o role atual no banco, sem confiar apenas no token/middleware. */
export async function requireAdmin(request: NextRequest): Promise<AdminGuard> {
  const user = await getCurrentUser(request);
  if (!user) return { response: unauthenticated() };
  if (user.role !== "admin") {
    return { response: NextResponse.json({ error: "Acesso restrito a administradores." }, { status: 403 }) };
  }
  return { admin: user };
}
