import { NextResponse, type NextRequest } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { ToolStat } from "@/models/ToolStat";
import { clientIp, rateLimit } from "@/lib/rateLimit";
import { isTrackEvent, isTrackKind, isTrackedTool } from "@/lib/trackEvents";
import { getCurrentUser } from "@/lib/serverAuth";
import { logActivity } from "@/lib/activityLog";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Uso das páginas públicas. Aceita só { tool, event, kind? } de listas fixas (o resto do body é ignorado):
 * incrementa o contador diário (ToolStat, anônimo) e grava um registro detalhado (ActivityLog) com o usuário
 * logado (resolvido no servidor pelo cookie), IP, local aproximado e navegador. Nunca grava nome ou conteúdo de arquivo.
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

  // Visitas já entram no log pela rota /api/activity; aqui só o uso (evita contar a mesma visita duas vezes).
  if (body.event === "use") {
    const user = await getCurrentUser(request).catch(() => null);
    await logActivity(request, {
      event: "use",
      user: user && { id: user.id, email: user.email, role: user.role },
      tool: body.tool,
      kind: kind || undefined,
    });
  }
  return new NextResponse(null, { status: 204 });
}
