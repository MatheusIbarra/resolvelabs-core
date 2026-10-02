/**
 * Sessão via JWT (jose). Este módulo é compatível com o Edge Runtime:
 * NÃO importe mongoose, bcryptjs ou qualquer API exclusiva do Node aqui.
 */
import { SignJWT, jwtVerify } from "jose";
import { isRole, type Role } from "./roles";

export const SESSION_COOKIE = "resolvelabs_session";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 dias

export interface SessionPayload {
  id: string;
  email: string;
  role: Role;
}

export function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("JWT_SECRET ausente ou curto demais (mínimo de 32 caracteres).");
  }
  return new TextEncoder().encode(secret);
}

/** Segundos de vida da sessão: 7 dias, ou menos se o PRO manual expira antes disso. */
export function sessionLifetimeSeconds(planExpiresAt?: Date | null): number {
  if (!planExpiresAt) return SESSION_MAX_AGE_SECONDS;
  const untilExpiry = Math.floor((planExpiresAt.getTime() - Date.now()) / 1000);
  return Math.max(1, Math.min(SESSION_MAX_AGE_SECONDS, untilExpiry));
}

export async function signSession(payload: SessionPayload, planExpiresAt?: Date | null): Promise<string> {
  return new SignJWT({ id: payload.id, email: payload.email, role: payload.role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.id)
    .setIssuedAt()
    .setExpirationTime(`${sessionLifetimeSeconds(planExpiresAt)}s`)
    .sign(getJwtSecret());
}

/** Extrai e valida o payload de um JWT já verificado. Retorna null se o formato for inesperado. */
export function toSessionPayload(claims: Record<string, unknown>): SessionPayload | null {
  const { id, email, role } = claims;
  if (typeof id !== "string" || typeof email !== "string" || !isRole(role)) return null;
  return { id, email, role };
}

export async function verifySession(token: string | undefined): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getJwtSecret(), { algorithms: ["HS256"] });
    return toSessionPayload(payload);
  } catch {
    return null; // assinatura inválida, expirado ou malformado
  }
}

export function sessionCookieOptions(planExpiresAt?: Date | null) {
  return {
    httpOnly: true,
    // Em produção o cookie é Secure. INSECURE_COOKIES=true existe só para testar um build de produção
    // por http local (o Safari não aceita cookie Secure sem https).
    secure: process.env.NODE_ENV === "production" && process.env.INSECURE_COOKIES !== "true",
    sameSite: "lax" as const,
    path: "/",
    maxAge: sessionLifetimeSeconds(planExpiresAt),
  };
}
