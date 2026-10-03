import type { NextRequest } from "next/server";
import { Types, type QueryFilter } from "mongoose";
import { ACTIVITY_EVENTS, type ActivityEvent, type IActivityLog } from "@/models/ActivityLog";

export const ACTIVITY_PERIODS = [1, 7, 30, 90, 180];

const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Texto curto de filtro: tipo, tamanho e caracteres validados (nada vai cru para a consulta). */
function text(value: string | null, max: number): string | null {
  const v = value?.trim();
  return v && v.length <= max ? v : null;
}

/** Monta o filtro do Mongo só com os parâmetros esperados da query string (admin). */
export function activityFilter(request: NextRequest): QueryFilter<IActivityLog> {
  const q = request.nextUrl.searchParams;
  const requested = Number(q.get("days"));
  const days = ACTIVITY_PERIODS.includes(requested) ? requested : 7;
  const filter: QueryFilter<IActivityLog> = { createdAt: { $gte: new Date(Date.now() - days * 86_400_000) } };

  const event = q.get("event");
  if (event && (ACTIVITY_EVENTS as readonly string[]).includes(event)) filter.event = event as ActivityEvent;

  const userId = text(q.get("userId"), 24);
  if (userId && /^[0-9a-f]{24}$/i.test(userId)) filter.userId = new Types.ObjectId(userId);

  const email = text(q.get("email"), 100);
  if (email) filter.email = { $regex: escapeRegex(email.toLowerCase()) };

  const ip = text(q.get("ip"), 64);
  if (ip && /^[0-9a-fA-F.:]+$/.test(ip)) filter.ip = { $regex: `^${escapeRegex(ip)}` };

  const tool = text(q.get("tool"), 80);
  if (tool && /^[a-z0-9-]+$/.test(tool)) filter.tool = tool;

  const country = text(q.get("country"), 2);
  if (country && /^[a-zA-Z]{2}$/.test(country)) filter.country = country.toUpperCase();

  const path = text(q.get("path"), 100);
  if (path) filter.path = { $regex: escapeRegex(path) };

  return filter;
}
