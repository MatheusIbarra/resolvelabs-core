import { apiError } from "@/lib/apiError";
import { NextResponse, type NextRequest } from "next/server";
import { User } from "@/models/User";
import { getCurrentUser, unauthenticated } from "@/lib/serverAuth";
import { getTool } from "@/lib/tools";
import { rateLimit } from "@/lib/rateLimit";
import { logActivity } from "@/lib/activityLog";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Reserva 1 uso gratuito da ferramenta ANTES do processamento (o limite é aplicado de forma atômica no banco).
 * Body { tool, refund: true } devolve 1 uso quando o processamento falhou sem entregar resultado.
 */
export async function POST(request: NextRequest) {
  let body: { tool?: unknown; refund?: unknown };
  try {
    body = await request.json();
  } catch {
    return apiError(request, "invalidBody", 400);
  }

  const tool = typeof body.tool === "string" ? getTool(body.tool) : undefined;
  if (!tool || tool.freeLimit === undefined) {
    return apiError(request, "invalidTool", 400);
  }

  try {
    const user = await getCurrentUser(request);
    if (!user) return unauthenticated(request);

    const who = { id: user.id, email: user.email, role: user.role };

    // PRO e admin não consomem cota (mas o uso entra no log).
    if (user.role !== "free") {
      if (body.refund !== true) await logActivity(request, { event: "usage", user: who, tool: tool.slug });
      return NextResponse.json({ usageCount: user.usageCount });
    }

    if (body.refund === true) {
      // Estorno limitado: evita usar o endpoint para zerar a cota repetidamente.
      const limited = rateLimit(`usage-refund:${user.id}`, 5, 10 * 60_000, request);
      if (limited) return limited;
      const refunded = await User.findOneAndUpdate(
        { _id: user._id, usageCount: { $gt: 0 } },
        { $inc: { usageCount: -1 } },
        { new: true },
      );
      return NextResponse.json({ usageCount: refunded?.usageCount ?? user.usageCount });
    }

    const updated = await User.findOneAndUpdate(
      { _id: user._id, usageCount: { $lt: tool.freeLimit } },
      { $inc: { usageCount: 1 } },
      { new: true },
    );
    if (!updated) {
      await logActivity(request, { event: "usage_blocked", user: who, tool: tool.slug });
      return apiError(request, "limitReached", 403, undefined, { code: "LIMIT_REACHED" });
    }
    await logActivity(request, { event: "usage", user: who, tool: tool.slug });
    return NextResponse.json({ usageCount: updated.usageCount });
  } catch (err) {
    console.error("[usage]", err);
    return apiError(request, "internal", 500);
  }
}
