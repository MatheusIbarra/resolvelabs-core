/**
 * Camada de API do front-end.
 *
 * - Perfil, controle de acesso, uso e plano falam com a API real (`/api/*`, MongoDB + JWT).
 */
import { FREE_PDF_LIMIT, type DenyReason } from "./content";
import { getTool } from "./tools";
import type { Role } from "./roles";

export type Plan = "FREE" | "PRO";

export interface UserProfile {
  isAuthenticated: boolean;
  plan: Plan;
  role?: Role;
  usageCount: number;
  email: string;
  /** Fim do PRO temporário (bônus/concessão). Ausente = sem data de expiração. */
  planExpiresAt?: string | null;
  /** Tem cliente no Stripe (pode abrir o portal de cobrança). */
  hasBilling?: boolean;
  /** A última cobrança foi recusada: o acesso PRO foi suspenso até regularizar. */
  paymentFailed?: boolean;
}

export type ApiErrorCode =
  | "UNAUTHENTICATED"
  | "LIMIT_REACHED"
  | "PRO_REQUIRED"
  | "INVALID_FILE"
  | "UNKNOWN_TOOL"
  | "REQUEST_FAILED";

export class ApiError extends Error {
  constructor(
    public code: ApiErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export type AccessResult = { allowed: true } | { allowed: false; reason: DenyReason };

const LATENCY = { fast: 1000, normal: 1500, slow: 2000 };
const ANONYMOUS: UserProfile = { isAuthenticated: false, plan: "FREE", usageCount: 0, email: "" };

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/** Executa `fn` após `ms` simulando latência (somente endpoints ainda simulados). */
function respond<T>(ms: number, fn: () => T): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    setTimeout(() => {
      try {
        resolve(fn());
      } catch (err) {
        reject(err);
      }
    }, ms);
  });
}

// --- Cliente HTTP -----------------------------------------------------------

interface ApiUser {
  id: string;
  email: string;
  role: Role;
  usageCount: number;
  planExpiresAt?: string | null;
  hasBilling?: boolean;
  paymentFailed?: boolean;
}

function toProfile(user: ApiUser): UserProfile {
  return {
    isAuthenticated: true,
    plan: user.role === "free" ? "FREE" : "PRO",
    role: user.role,
    usageCount: user.usageCount,
    email: user.email,
    planExpiresAt: user.planExpiresAt ?? null,
    hasBilling: user.hasBilling ?? false,
    paymentFailed: user.paymentFailed ?? false,
  };
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, { cache: "no-store", ...init });
  } catch {
    throw new ApiError("REQUEST_FAILED", "Não foi possível conectar ao servidor.");
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const code: ApiErrorCode =
      res.status === 401 ? "UNAUTHENTICATED" : data?.code === "LIMIT_REACHED" ? "LIMIT_REACHED" : "REQUEST_FAILED";
    throw new ApiError(code, data?.error ?? "Falha na requisição.");
  }
  return data as T;
}

const postJson = <T>(url: string, body: unknown) =>
  request<T>(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });

// --- Endpoints reais ---------------------------------------------------------

/** GET /api/auth/me. Visitante sem sessão recebe um perfil anônimo (sem erro). */
export async function getProfile(): Promise<UserProfile> {
  try {
    const { user } = await request<{ user: ApiUser }>("/api/auth/me");
    return toProfile(user);
  } catch (err) {
    if (err instanceof ApiError && err.code === "UNAUTHENTICATED") return ANONYMOUS;
    throw err;
  }
}

function evaluateAccess(slug: string, profile: UserProfile): AccessResult {
  const tool = getTool(slug);
  if (!tool) throw new ApiError("UNKNOWN_TOOL", "Ferramenta não encontrada.");
  if (!profile.isAuthenticated) throw new ApiError("UNAUTHENTICATED", "Sessão expirada. Faça login novamente.");
  if (profile.plan === "PRO") return { allowed: true };
  if (tool.requiresPro) return { allowed: false, reason: "PRO_REQUIRED" };
  if (tool.freeLimit !== undefined && profile.usageCount >= tool.freeLimit) {
    return { allowed: false, reason: "LIMIT_REACHED" };
  }
  return { allowed: true };
}

/** Valida permissão (plano + limite de uso) com o estado atual do banco. */
export async function checkToolAccess(slug: string): Promise<AccessResult> {
  return evaluateAccess(slug, await getProfile());
}

/**
 * Registra 1 uso gratuito da conversão PDF -> OFX. A conversão em si acontece no navegador:
 * nenhum dado do arquivo é enviado, apenas o contador de uso. O servidor reaplica o limite de forma atômica.
 */
export async function registerPdfUsage(): Promise<{ usageCount: number }> {
  return postJson<{ usageCount: number }>("/api/usage", { tool: "pdf-para-ofx" });
}

/** Cria a sessão do Stripe Checkout (7 dias grátis + R$ 7,99/mês) e devolve a URL para redirecionar. */
export async function startCheckout(couponCode?: string): Promise<{ url?: string; redeemed?: boolean }> {
  return postJson<{ url?: string; redeemed?: boolean }>("/api/checkout", { couponCode });
}

/** Valida um cupom (sem consumi-lo) e devolve o desconto. */
export function validateCoupon(code: string): Promise<{ code: string; discountPercent: number }> {
  return postJson("/api/coupons/validate", { code });
}

/** Abre o portal do cliente do Stripe (cartão, faturas, cancelamento). */
export async function openBillingPortal(): Promise<string> {
  return (await postJson<{ url: string }>("/api/billing/portal", {})).url;
}

import type { SubscriptionSummary } from "./subscription";

/** Situação da assinatura (teste, próxima cobrança, cancelamento agendado...). */
export async function getSubscription(): Promise<{ summary: SubscriptionSummary; bonusDays: number }> {
  return request<{ summary: SubscriptionSummary; bonusDays: number }>("/api/billing/subscription");
}

export interface AffiliateInfo {
  code: string;
  link: string;
  referredCount: number;
  convertedCount: number;
  rewardDays: number;
  rewardDaysPerReferral: number;
}

/** Dados do programa de indicação do usuário logado. */
export function getAffiliate(): Promise<AffiliateInfo> {
  return request<AffiliateInfo>("/api/user/affiliate");
}

// --- Utilidades de demonstração (não existiriam na API real) ---------------

export async function devSetPlan(plan: Plan): Promise<UserProfile> {
  const { user } = await postJson<{ user: ApiUser }>("/api/dev/plan", { plan });
  return toProfile(user);
}

export async function devResetUsage(): Promise<UserProfile> {
  const { user } = await postJson<{ user: ApiUser }>("/api/dev/plan", { resetUsage: true });
  return toProfile(user);
}

export { FREE_PDF_LIMIT };
