import { NextResponse, type NextRequest } from "next/server";

/**
 * Limitador de janela fixa em memória (por instância do servidor).
 * Em ambiente serverless/multi-instância o limite é por instância: para garantia global, troque o `hits` por um store compartilhado (ex.: Redis).
 */
const hits = new Map<string, { count: number; resetAt: number }>();
const MAX_KEYS = 10_000;

export function clientIp(request: NextRequest): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
}

/** Retorna uma resposta 429 quando `key` excede `limit` tentativas na janela; senão, null. */
export function rateLimit(key: string, limit: number, windowMs: number): NextResponse | null {
  // Só para a suíte e2e, que cria dezenas de contas do mesmo IP. Nunca definir em produção.
  if (process.env.RATE_LIMIT_DISABLED === "true") return null;

  const now = Date.now();
  if (hits.size > MAX_KEYS) {
    for (const [k, v] of hits) if (v.resetAt <= now) hits.delete(k);
    if (hits.size > MAX_KEYS) hits.clear();
  }

  const entry = hits.get(key);
  if (!entry || entry.resetAt <= now) {
    hits.set(key, { count: 1, resetAt: now + windowMs });
    return null;
  }
  entry.count += 1;
  if (entry.count <= limit) return null;

  const retryAfter = Math.max(1, Math.ceil((entry.resetAt - now) / 1000));
  return NextResponse.json(
    { error: "Muitas tentativas. Aguarde um pouco e tente novamente." },
    { status: 429, headers: { "Retry-After": String(retryAfter) } },
  );
}
