import { NextResponse, type NextRequest } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/serverAuth";
import { ToolStat } from "@/models/ToolStat";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PERIODS = [7, 30, 90];

/** Visitas e usos por ferramenta no período (?days=7|30|90). */
export async function GET(request: NextRequest) {
  const guard = await requireAdmin(request);
  if (guard.response) return guard.response;

  const requested = Number(request.nextUrl.searchParams.get("days"));
  const days = PERIODS.includes(requested) ? requested : 30;
  const since = new Date(Date.now() - (days - 1) * 86_400_000).toISOString().slice(0, 10);

  try {
    await connectDB();
    const rows = await ToolStat.aggregate<{ _id: { tool: string; event: string; kind: string }; count: number }>([
      { $match: { day: { $gte: since } } },
      { $group: { _id: { tool: "$tool", event: "$event", kind: "$kind" }, count: { $sum: "$count" } } },
    ]);
    return NextResponse.json({
      days,
      rows: rows.map((r) => ({ tool: r._id.tool, event: r._id.event, kind: r._id.kind, count: r.count })),
    });
  } catch (err) {
    console.error("[admin/stats]", err);
    return NextResponse.json({ error: "Erro interno. Tente novamente." }, { status: 500 });
  }
}
