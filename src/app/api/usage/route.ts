import { NextResponse, type NextRequest } from "next/server";
import { User } from "@/models/User";
import { getCurrentUser, unauthenticated } from "@/lib/serverAuth";
import { getTool } from "@/lib/tools";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Consome 1 uso gratuito da ferramenta. O limite é aplicado de forma atômica no banco. */
export async function POST(request: NextRequest) {
  let body: { tool?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corpo da requisição inválido." }, { status: 400 });
  }

  const tool = typeof body.tool === "string" ? getTool(body.tool) : undefined;
  if (!tool || tool.freeLimit === undefined) {
    return NextResponse.json({ error: "Ferramenta inválida." }, { status: 400 });
  }

  try {
    const user = await getCurrentUser(request);
    if (!user) return unauthenticated();

    // PRO e admin não consomem cota.
    if (user.role !== "free") return NextResponse.json({ usageCount: user.usageCount });

    const updated = await User.findOneAndUpdate(
      { _id: user._id, usageCount: { $lt: tool.freeLimit } },
      { $inc: { usageCount: 1 } },
      { new: true },
    );
    if (!updated) {
      return NextResponse.json({ error: "Limite gratuito atingido.", code: "LIMIT_REACHED" }, { status: 403 });
    }
    return NextResponse.json({ usageCount: updated.usageCount });
  } catch (err) {
    console.error("[usage]", err);
    return NextResponse.json({ error: "Erro interno. Tente novamente." }, { status: 500 });
  }
}
