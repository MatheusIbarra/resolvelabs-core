import { NextResponse, type NextRequest } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { ToolStat } from "@/models/ToolStat";
import { clientIp, rateLimit } from "@/lib/rateLimit";
import { isTrackEvent, isTrackKind, isTrackedTool } from "@/lib/trackEvents";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Contagem anônima de uso das páginas públicas. Aceita só { tool, event, kind? } de listas fixas
 * (o resto do body é ignorado) e incrementa um contador diário. Não grava IP, usuário nem arquivo.
 */
export async function POST(request: NextRequest) {
  const limited = rateLimit(`track:${clientIp(request)}`, 120, 10 * 60_000);
  if (limited) return limited;

  let body: { tool?: unknown; event?: unknown; kind?: unknown };
  try {
    body = await request.json();
  } catch {
    return new NextResponse(null, { status: 400 });
  }
  if (!isTrackedTool(body.tool) || !isTrackEvent(body.event)) return new NextResponse(null, { status: 400 });
  const kind = body.event === "use" && isTrackKind(body.kind) ? body.kind : "";

  try {
    await connectDB();
    await ToolStat.updateOne(
      { day: new Date().toISOString().slice(0, 10), tool: body.tool, event: body.event, kind },
      { $inc: { count: 1 } },
      { upsert: true },
    );
  } catch (err) {
    console.error("[track]", err); // métrica nunca deve afetar o usuário
  }
  return new NextResponse(null, { status: 204 });
}
