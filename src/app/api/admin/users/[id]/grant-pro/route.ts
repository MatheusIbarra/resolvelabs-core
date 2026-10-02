import { NextResponse, type NextRequest } from "next/server";
import { isValidObjectId } from "mongoose";
import { User } from "@/models/User";
import { requireAdmin } from "@/lib/serverAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_DAYS = 3650;
const DAY_MS = 24 * 60 * 60 * 1000;

/** Body: { days: number | null }. null = PRO permanente (sem expiração). */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin(request);
  if (guard.response) return guard.response;

  const { id } = await params;
  if (!isValidObjectId(id)) return NextResponse.json({ error: "ID inválido." }, { status: 400 });

  let body: { days?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corpo da requisição inválido." }, { status: 400 });
  }

  const days = body.days;
  const permanent = days === null;
  if (!permanent && !(typeof days === "number" && Number.isInteger(days) && days >= 1 && days <= MAX_DAYS)) {
    return NextResponse.json({ error: `Informe days entre 1 e ${MAX_DAYS}, ou null para permanente.` }, { status: 400 });
  }

  try {
    const user = await User.findById(id);
    if (!user) return NextResponse.json({ error: "Usuário não encontrado." }, { status: 404 });
    if (user.role === "admin") return NextResponse.json({ error: "Contas admin já têm acesso total." }, { status: 400 });

    user.role = "pro";
    if (permanent) {
      user.planExpiresAt = undefined;
    } else {
      // Soma à data atual; se o PRO atual ainda vale, os dias se acumulam a partir do vencimento.
      const now = Date.now();
      const current = user.planExpiresAt && user.planExpiresAt.getTime() > now ? user.planExpiresAt.getTime() : now;
      user.planExpiresAt = new Date(current + (days as number) * DAY_MS);
    }
    await user.save();

    return NextResponse.json({ ok: true, role: user.role, planExpiresAt: user.planExpiresAt ?? null });
  } catch (err) {
    console.error("[admin/grant-pro]", err);
    return NextResponse.json({ error: "Erro interno. Tente novamente." }, { status: 500 });
  }
}
