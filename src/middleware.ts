import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { SESSION_COOKIE, getJwtSecret, toSessionPayload, type SessionPayload } from "@/lib/session";
import { REF_COOKIE, REF_COOKIE_MAX_AGE_SECONDS, parseAffiliateCode } from "@/lib/affiliate";

const AUTH_PAGES = ["/login", "/register"];
const PROTECTED_PAGES = ["/dashboard", "/ferramentas", "/admin", "/checkout", "/upgrade"];

/** Captura `?ref=CODIGO` em um cookie para o cadastro (a existência do código é validada no register). */
function withRef(request: NextRequest, response: NextResponse): NextResponse {
  const ref = parseAffiliateCode(request.nextUrl.searchParams.get("ref"));
  if (ref) {
    response.cookies.set(REF_COOKIE, ref, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: REF_COOKIE_MAX_AGE_SECONDS,
    });
  }
  return response;
}

/** Normaliza o caminho antes de comparar (decodifica, remove barras duplicadas e ignora caixa). */
function normalize(pathname: string): string {
  let path = pathname;
  try {
    path = decodeURIComponent(pathname);
  } catch {
    // mantém o caminho cru
  }
  return path.replace(/\/{2,}/g, "/").toLowerCase();
}

/** Casa o prefixo respeitando limite de segmento: "/ferramentas/pro" não casa com "/ferramentas/processador-imagens". */
function matchesPrefix(path: string, prefix: string): boolean {
  return path === prefix || path.startsWith(`${prefix}/`);
}

async function readSession(request: NextRequest): Promise<SessionPayload | null> {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getJwtSecret(), { algorithms: ["HS256"] });
    return toSessionPayload(payload);
  } catch (err) {
    if (err instanceof Error && err.message.startsWith("JWT_SECRET")) console.error("[middleware]", err.message);
    return null;
  }
}

function redirectTo(request: NextRequest, pathname: string, params?: Record<string, string>) {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  url.search = "";
  for (const [k, v] of Object.entries(params ?? {})) url.searchParams.set(k, v);
  return NextResponse.redirect(url);
}

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const path = normalize(pathname);
  const isAuthPage = AUTH_PAGES.some((p) => matchesPrefix(path, p));
  const isProtected = PROTECTED_PAGES.some((p) => matchesPrefix(path, p));

  // Link de indicação na home (/?ref=CODIGO): leva direto ao cadastro, com o código guardado no cookie.
  if (path === "/" && parseAffiliateCode(request.nextUrl.searchParams.get("ref"))) {
    return withRef(request, redirectTo(request, "/register"));
  }

  // Demais páginas públicas: só capturam a indicação.
  if (!isAuthPage && !isProtected) return withRef(request, NextResponse.next());

  const hadCookie = request.cookies.has(SESSION_COOKIE);
  const session = await readSession(request);

  // Páginas de login/cadastro: quem já está logado vai direto ao painel.
  if (isAuthPage) {
    return withRef(request, session ? redirectTo(request, "/dashboard") : NextResponse.next());
  }

  // Rotas protegidas: exigem sessão válida.
  if (!session) {
    const response = redirectTo(request, "/login", { next: `${pathname}${search}` });
    if (hadCookie) response.cookies.delete(SESSION_COOKIE); // cookie inválido/expirado
    return withRef(request, response);
  }

  // RBAC
  if (matchesPrefix(path, "/admin") && session.role !== "admin") {
    return withRef(request, redirectTo(request, "/dashboard"));
  }
  if (matchesPrefix(path, "/ferramentas/pro") && session.role === "free") {
    return withRef(request, redirectTo(request, "/upgrade"));
  }

  return withRef(request, NextResponse.next());
}

export const config = {
  matcher: ["/", "/dashboard/:path*", "/ferramentas/:path*", "/admin/:path*", "/checkout/:path*", "/upgrade/:path*", "/login", "/register"],
};
