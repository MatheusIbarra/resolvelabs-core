import { NextResponse, type NextRequest } from "next/server";
import { Types } from "mongoose";
import { connectDB } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/serverAuth";
import { ActivityLog } from "@/models/ActivityLog";
import { activityFilter } from "@/lib/activityQuery";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PAGE_SIZE = 50;

/** Registros de atividade, do mais novo ao mais antigo, com filtros e paginação por cursor (?cursor=<id do último>). */
export async function GET(request: NextRequest) {
  const guard = await requireAdmin(request);
  if (guard.response) return guard.response;

  try {
    await connectDB();
    const filter = activityFilter(request);
    const cursor = request.nextUrl.searchParams.get("cursor");
    const paged = cursor && /^[0-9a-f]{24}$/i.test(cursor) ? { ...filter, _id: { $lt: new Types.ObjectId(cursor) } } : filter;

    const [docs, total] = await Promise.all([
      ActivityLog.find(paged).sort({ _id: -1 }).limit(PAGE_SIZE + 1).lean(),
      cursor ? Promise.resolve(null) : ActivityLog.countDocuments(filter),
    ]);
    const hasMore = docs.length > PAGE_SIZE;
    const page = hasMore ? docs.slice(0, PAGE_SIZE) : docs;

    return NextResponse.json({
      total,
      nextCursor: hasMore ? String(page[page.length - 1]._id) : null,
      logs: page.map((d) => ({
        id: String(d._id),
        createdAt: d.createdAt,
        event: d.event,
        userId: d.userId ? String(d.userId) : null,
        email: d.email ?? null,
        role: d.role ?? null,
        tool: d.tool ?? null,
        kind: d.kind ?? null,
        path: d.path ?? null,
        referrer: d.referrer ?? null,
        ip: d.ip,
        userAgent: d.userAgent ?? null,
        language: d.language ?? null,
        country: d.country ?? null,
        region: d.region ?? null,
        city: d.city ?? null,
        latitude: d.latitude ?? null,
        longitude: d.longitude ?? null,
        timezone: d.timezone ?? null,
      })),
    });
  } catch (err) {
    console.error("[admin/activity]", err);
    return NextResponse.json({ error: "Erro interno. Tente novamente." }, { status: 500 });
  }
}
