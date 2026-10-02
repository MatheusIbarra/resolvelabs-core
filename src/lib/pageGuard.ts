import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getUserFromToken, type UserDoc } from "./serverAuth";
import { SESSION_COOKIE } from "./session";

/**
 * Guard de página no servidor: confere o role atual no banco (o middleware só vê o role do JWT, que pode estar desatualizado).
 * Redireciona para o login sem sessão e para `deniedPath` quando o role não é permitido.
 */
export async function requireRolePage(allowed: readonly UserDoc["role"][], deniedPath: string): Promise<UserDoc> {
  const user = await getUserFromToken((await cookies()).get(SESSION_COOKIE)?.value);
  if (!user) redirect("/login");
  if (!allowed.includes(user.role)) redirect(deniedPath);
  return user;
}
