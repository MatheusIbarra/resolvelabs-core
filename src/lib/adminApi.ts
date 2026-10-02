// Cliente da API administrativa (/api/admin/*). Todas as rotas validam o role admin no servidor.

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

async function adminRequest<T>(url: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, {
      cache: "no-store",
      ...init,
      headers: init?.body ? { "Content-Type": "application/json", ...init.headers } : init?.headers,
    });
  } catch {
    throw new Error("Não foi possível conectar ao servidor.");
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error ?? "Falha na requisição.");
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

  listAffiliates: () => adminRequest<{ affiliates: AdminAffiliate[] }>("/api/admin/affiliates"),
};
