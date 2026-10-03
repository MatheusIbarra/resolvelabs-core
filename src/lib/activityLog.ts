import type { NextRequest } from "next/server";
import { Types } from "mongoose";
import { connectDB } from "./mongodb";
import { clientIp } from "./rateLimit";
import { ActivityLog, type ActivityEvent } from "@/models/ActivityLog";

export interface ActivityInput {
  event: ActivityEvent;
  /** Usuário resolvido NO SERVIDOR (getCurrentUser). Nunca um id vindo do body. */
  user?: { id: string; email: string; role: string } | null;
  /** Só para eventos sem usuário resolvido (ex.: login que falhou: e-mail digitado). */
  email?: string;
  tool?: string;
  kind?: string;
  path?: string;
  referrer?: string;
}

/** Corta e limpa um texto vindo de cabeçalho/cliente: é sempre dado não confiável. */
function clean(value: string | null | undefined, max: number): string | undefined {
  if (!value) return undefined;
  // eslint-disable-next-line no-control-regex
  const text = value.replace(/[\u0000-\u001f\u007f]/g, " ").trim().slice(0, max);
  return text || undefined;
}

function decoded(value: string | null, max: number): string | undefined {
  if (!value) return undefined;
  try {
    return clean(decodeURIComponent(value), max);
  } catch {
    return clean(value, max);
  }
}

function coordinate(value: string | null, limit: number): number | undefined {
  const n = value === null ? NaN : Number(value);
  return Number.isFinite(n) && Math.abs(n) <= limit ? n : undefined;
}

/** Caminho sem query/hash (a query pode carregar códigos e tokens) e só em formato de caminho. */
export function cleanPath(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const path = value.split(/[?#]/)[0].slice(0, 200);
  return path.startsWith("/") && !path.startsWith("//") ? clean(path, 200) : undefined;
}

/** Origem + caminho do referrer, sem query (também pode ter tokens). */
export function cleanReferrer(value: unknown): string | undefined {
  if (typeof value !== "string" || !value) return undefined;
  try {
    const url = new URL(value);
    if (url.protocol !== "http:" && url.protocol !== "https:") return undefined;
    return clean(`${url.origin}${url.pathname}`, 300);
  } catch {
    return undefined;
  }
}

/**
 * Registra uma ação com IP, local aproximado e navegador. A localização vem dos cabeçalhos da Vercel
 * (nenhum IP é enviado a serviço externo); fora dela (dev local) esses campos ficam vazios.
 * Falhas são engolidas: o log nunca pode quebrar nem atrasar a requisição.
 */
export async function logActivity(request: NextRequest, input: ActivityInput): Promise<void> {
  try {
    const h = request.headers;
    const userId = input.user && Types.ObjectId.isValid(input.user.id) ? new Types.ObjectId(input.user.id) : undefined;
    await connectDB();
    await ActivityLog.create({
      event: input.event,
      userId,
      email: clean(input.user?.email ?? input.email, 254),
      role: input.user?.role,
      tool: clean(input.tool, 80),
      kind: clean(input.kind, 24),
      path: input.path,
      referrer: input.referrer,
      ip: clean(clientIp(request), 64) ?? "unknown",
      userAgent: clean(h.get("user-agent"), 512),
      language: clean(h.get("accept-language"), 64),
      country: clean(h.get("x-vercel-ip-country"), 8),
      region: clean(h.get("x-vercel-ip-country-region"), 80),
      city: decoded(h.get("x-vercel-ip-city"), 120),
      latitude: coordinate(h.get("x-vercel-ip-latitude"), 90),
      longitude: coordinate(h.get("x-vercel-ip-longitude"), 180),
      timezone: clean(h.get("x-vercel-ip-timezone"), 64),
    });
  } catch (err) {
    console.error("[activityLog]", err);
  }
}
