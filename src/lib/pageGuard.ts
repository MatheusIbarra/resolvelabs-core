import { cookies } from "next/headers";
import { getUserFromToken, type UserDoc } from "./serverAuth";
import { SESSION_COOKIE } from "./session";
import { redirect } from "@/i18n/server";
import type { Locale } from "@/i18n/config";

/**
 * Guard de página no servidor: confere o role atual no banco (o middleware só vê o role do JWT, que pode estar desatualizado).
 * Redireciona para o login sem sessão e para `deniedPath` quando o role não é permitido (sempre no idioma da página).
 */
export async function requireRolePage(locale: Locale, allowed: readonly UserDoc["role"][], deniedPath: string): Promise<UserDoc> {
  const user = await getUserFromToken((await cookies()).get(SESSION_COOKIE)?.value);
  if (!user) redirect(locale, "/login");
  if (!allowed.includes(user.role)) redirect(locale, deniedPath);
  return user;
}
