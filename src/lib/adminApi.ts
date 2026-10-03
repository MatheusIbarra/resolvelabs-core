// Cliente da API administrativa (/api/admin/*). Todas as rotas validam o role admin no servidor.
import { activeTranslator, apiFetch } from "@/i18n/active";

export interface AdminUser {
  id: string;
  email: string;
  role: "admin" | "free" | "pro";
  usageCount: number;
  planExpiresAt: string | null;
  affiliateCode: string | null;
  referredBy: string | null;
  createdAt: string;
}

export interface AdminCoupon {
  id: string;
  code: string;
  discountPercent: number;
  expiresAt: string;
  maxUses: number;
  usesCount: number;
  active: boolean;
}

export interface AdminAffiliate {
  code: string;
  ownerEmail: string | null;
  signups: number;
  conversions: number;
  lastSignupAt: string;
}

export interface AdminToolStatRow {
  tool: string;
  event: "view" | "use";
  kind: string;
  count: number;
}

export type ActivityEventName = "pageview" | "view" | "use" | "usage" | "usage_blocked" | "login" | "login_failed" | "register" | "logout";

export interface AdminActivityLog {
  id: string;
  createdAt: string;
  event: ActivityEventName;
  userId: string | null;
  email: string | null;
  role: string | null;
  tool: string | null;
  kind: string | null;
  path: string | null;
  referrer: string | null;
  ip: string;
  userAgent: string | null;
  language: string | null;
  country: string | null;
  region: string | null;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
  timezone: string | null;
}

export interface ActivityFilters {
  days: number;
  event?: string;
  email?: string;
  userId?: string;
  ip?: string;
  tool?: string;
  country?: string;
  path?: string;
}

export interface AdminActivitySummary {
  totals: { events: number; users: number; ips: number; logins: number; failedLogins: number };
  byEvent: { event: ActivityEventName; count: number }[];
  byDay: { day: string; count: number }[];
  topUsers: { userId: string; email: string; count: number; ips: number; last: string }[];
  topIps: { ip: string; count: number; users: number; country: string | null; city: string | null }[];
  topPlaces: { country: string; region: string | null; city: string | null; count: number }[];
  topTools: { tool: string; count: number }[];
  topPaths: { path: string; count: number }[];
}

function activityQuery(filters: ActivityFilters, cursor?: string | null): string {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(filters)) if (v !== undefined && v !== "") params.set(k, String(v));
  if (cursor) params.set("cursor", cursor);
  return params.toString();
}

async function adminRequest<T>(url: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await apiFetch(url, {
      cache: "no-store",
      ...init,
      headers: init?.body ? { "Content-Type": "application/json", ...init.headers } : init?.headers,
    });
  } catch {
    throw new Error(activeTranslator().t("msg.api.network"));
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error ?? activeTranslator().t("msg.api.requestFailed"));
  return data as T;
}

const json = (method: string, body: unknown): RequestInit => ({ method, body: JSON.stringify(body) });

export const adminApi = {
  listUsers: () => adminRequest<{ users: AdminUser[]; limit: number }>("/api/admin/users"),
  grantPro: (id: string, days: number | null) =>
    adminRequest<{ ok: true }>(`/api/admin/users/${id}/grant-pro`, json("POST", { days })),
  revokePro: (id: string) => adminRequest<{ ok: true }>(`/api/admin/users/${id}`, json("PATCH", { role: "free" })),
  resetUsage: (id: string) => adminRequest<{ ok: true }>(`/api/admin/users/${id}`, json("PATCH", { resetUsage: true })),

  listCoupons: () => adminRequest<{ coupons: AdminCoupon[] }>("/api/admin/coupons"),
  createCoupon: (input: { code: string; discountPercent: number; expiresAt: string; maxUses: number }) =>
    adminRequest<{ coupon: AdminCoupon }>("/api/admin/coupons", json("POST", input)),
  setCouponActive: (id: string, active: boolean) =>
    adminRequest<{ ok: true }>(`/api/admin/coupons/${id}`, json("PATCH", { active })),
  deleteCoupon: (id: string) => adminRequest<{ ok: true }>(`/api/admin/coupons/${id}`, { method: "DELETE" }),

  toolStats: (days: number) => adminRequest<{ days: number; rows: AdminToolStatRow[] }>(`/api/admin/stats?days=${days}`),

  activity: (filters: ActivityFilters, cursor?: string | null) =>
    adminRequest<{ total: number | null; nextCursor: string | null; logs: AdminActivityLog[] }>(`/api/admin/activity?${activityQuery(filters, cursor)}`),
  activitySummary: (filters: ActivityFilters) => adminRequest<AdminActivitySummary>(`/api/admin/activity/summary?${activityQuery(filters)}`),

  listAffiliates: () => adminRequest<{ affiliates: AdminAffiliate[] }>("/api/admin/affiliates"),
};
