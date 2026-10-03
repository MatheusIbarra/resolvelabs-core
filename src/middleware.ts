import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { SESSION_COOKIE, getJwtSecret, toSessionPayload, type SessionPayload } from "@/lib/session";
import { publicToolPaths } from "@/lib/seo-tools";
import { REF_COOKIE, REF_COOKIE_MAX_AGE_SECONDS, parseAffiliateCode } from "@/lib/affiliate";
import { LOCALE_COOKIE, LOCALE_COOKIE_MAX_AGE_SECONDS, isLocale, negotiateLocale, type Locale } from "@/i18n/config";
import { canonicalizeSegments, localizePath, localizeSegments, parsePath } from "@/i18n/paths";

const AUTH_PAGES = ["/login", "/register"];
/** Páginas indexadas antes do i18n (todas em português): URLs antigas sem prefixo vão com 301 para /pt. */
const LEGACY_INDEXED_PREFIXES = ["/ferramentas", "/blog", "/suporte", "/termos"];
const PROTECTED_PAGES = ["/dashboard", "/ferramentas", "/admin", "/checkout", "/upgrade"];

/** Landings de SEO e ferramentas só-navegador (match exato, nunca por prefixo): públicas e indexáveis sem login. */
const PUBLIC_SEO_PATHS = new Set(publicToolPaths());

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

/** Idioma preferido: cookie (escolha manual) > Accept-Language > padrão. Sempre validado contra a lista suportada. */
function preferredLocale(request: NextRequest): Locale {
  const cookie = request.cookies.get(LOCALE_COOKIE)?.value;
  return isLocale(cookie) ? cookie : negotiateLocale(request.headers.get("accept-language"));
}

function withLocaleCookie(request: NextRequest, response: NextResponse, locale: Locale): NextResponse {
  if (request.cookies.get(LOCALE_COOKIE)?.value !== locale) {
    response.cookies.set(LOCALE_COOKIE, locale, {
      sameSite: "lax",
      path: "/",
      maxAge: LOCALE_COOKIE_MAX_AGE_SECONDS,
      secure: process.env.NODE_ENV === "production",
    });
  }
  return response;
}

/** Redireciona para um caminho canônico (sem idioma), já localizado e com o prefixo. */
function redirectTo(request: NextRequest, locale: Locale, canonicalPath: string, params?: Record<string, string>, status = 307) {
  const url = request.nextUrl.clone();
  url.pathname = localizePath(locale, canonicalPath);
  url.search = "";
  for (const [k, v] of Object.entries(params ?? {})) url.searchParams.set(k, v);
  return NextResponse.redirect(url, status);
}

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const normalized = normalize(pathname);
  const parsed = parsePath(normalized);

  // 1) Sem prefixo de idioma: escolhe o idioma e redireciona.
  if (!parsed.locale) {
    const ref = parseAffiliateCode(request.nextUrl.searchParams.get("ref"));
    const isLegacyIndexed = LEGACY_INDEXED_PREFIXES.some((p) => matchesPrefix(normalized, p));
    // URLs antigas (só existiam em português) mantêm o ranking com 301 para /pt; o resto segue o navegador.
    const locale = isLegacyIndexed ? "pt" : preferredLocale(request);
    const target = normalized === "/" && ref ? "/register" : normalized;
    const url = request.nextUrl.clone();
    url.pathname = localizePath(locale, target);
    if (target !== normalized) url.search = "";
    return withRef(request, withLocaleCookie(request, NextResponse.redirect(url, isLegacyIndexed ? 301 : 307), locale));
  }

  const locale = parsed.locale;
  // Caminho canônico (nomes de pasta em src/app/[lang]) a partir da URL localizada.
  const canonical = canonicalizeSegments(locale, parsed.rest);
  const path = canonical.length > 1 ? canonical.replace(/\/$/, "") : canonical;

  // URL com segmentos de outro idioma/canônicos (ex.: /en/ferramentas/x): leva à forma localizada oficial.
  if (localizeSegments(locale, path) !== (parsed.rest.length > 1 ? parsed.rest.replace(/\/$/, "") : parsed.rest)) {
    const url = request.nextUrl.clone();
    url.pathname = localizePath(locale, path);
    return withRef(request, withLocaleCookie(request, NextResponse.redirect(url, 308), locale));
  }

  const respond = (response: NextResponse) => withRef(request, withLocaleCookie(request, response, locale));
  const next = () => {
    if (path === parsed.rest) return NextResponse.next();
    const url = request.nextUrl.clone();
    url.pathname = `/${locale}${path === "/" ? "" : path}`;
    return NextResponse.rewrite(url);
  };

  const isAuthPage = AUTH_PAGES.some((p) => matchesPrefix(path, p));
  const isPublicSeoPage = PUBLIC_SEO_PATHS.has(path);
  const isProtected = !isPublicSeoPage && PROTECTED_PAGES.some((p) => matchesPrefix(path, p));

  // Link de indicação na home (/pt?ref=CODIGO): leva direto ao cadastro, com o código guardado no cookie.
  if (path === "/" && parseAffiliateCode(request.nextUrl.searchParams.get("ref"))) {
    return respond(redirectTo(request, locale, "/register"));
  }

  // Demais páginas públicas: só capturam a indicação.
  if (!isAuthPage && !isProtected) return respond(next());

  const hadCookie = request.cookies.has(SESSION_COOKIE);
  const session = await readSession(request);

  // Páginas de login/cadastro: quem já está logado vai direto ao painel.
  if (isAuthPage) {
    return respond(session ? redirectTo(request, locale, "/dashboard") : next());
  }

  // Rotas protegidas: exigem sessão válida.
  if (!session) {
    const response = redirectTo(request, locale, "/login", { next: `${pathname}${search}` });
    if (hadCookie) response.cookies.delete(SESSION_COOKIE); // cookie inválido/expirado
    return respond(response);
  }

  // RBAC
  if (matchesPrefix(path, "/admin") && session.role !== "admin") {
    return respond(redirectTo(request, locale, "/dashboard"));
  }
  if (matchesPrefix(path, "/ferramentas/pro") && session.role === "free") {
    return respond(redirectTo(request, locale, "/upgrade"));
  }

  return respond(next());
}

// Todas as páginas, exceto API, internos do framework e arquivos estáticos (qualquer caminho com extensão).
export const config = {
  matcher: ["/((?!api/|_next/|@vite/|@id/|@fs/|@react-refresh|node_modules/|src/|assets/|.*\\..*).*)"],
};
