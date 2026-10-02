import { NextResponse, type NextRequest } from "next/server";
import { isValidObjectId } from "mongoose";
import { User } from "@/models/User";
import { requireAdmin } from "@/lib/serverAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Ações simples sobre um usuário: rebaixar para free (revogar PRO) e zerar uso. Admin só é criado via script. */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin(request);
  if (guard.response) return guard.response;

  const { id } = await params;
  if (!isValidObjectId(id)) return NextResponse.json({ error: "ID inválido." }, { status: 400 });

  let body: { role?: unknown; resetUsage?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corpo da requisição inválido." }, { status: 400 });
  }
  if (body.role !== undefined && body.role !== "free") {
    return NextResponse.json({ error: "Só é possível rebaixar para 'free'. Use grant-pro para conceder PRO." }, { status: 400 });
  }

  try {
    const user = await User.findById(id);
    if (!user) return NextResponse.json({ error: "Usuário não encontrado." }, { status: 404 });
    if (user.role === "admin") return NextResponse.json({ error: "Contas admin não podem ser alteradas aqui." }, { status: 400 });

    if (body.role === "free") {
      user.role = "free";
      user.planExpiresAt = undefined;
    }
    if (body.resetUsage === true) user.usageCount = 0;
    await user.save();
    return NextResponse.json({ ok: true, role: user.role, usageCount: user.usageCount });
  } catch (err) {
    console.error("[admin/users/:id]", err);
    return NextResponse.json({ error: "Erro interno. Tente novamente." }, { status: 500 });
  }
}
