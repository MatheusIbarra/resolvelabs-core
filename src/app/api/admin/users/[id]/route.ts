import { apiError } from "@/lib/apiError";
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
  if (!isValidObjectId(id)) return apiError(request, "invalidId", 400);

  let body: { role?: unknown; resetUsage?: unknown };
  try {
    body = await request.json();
  } catch {
    return apiError(request, "invalidBody", 400);
  }
  if (body.role !== undefined && body.role !== "free") {
    return apiError(request, "onlyDowngrade", 400);
  }

  try {
    const user = await User.findById(id);
    if (!user) return apiError(request, "userNotFound", 404);
    if (user.role === "admin") return apiError(request, "adminNotEditable", 400);

    if (body.role === "free") {
      user.role = "free";
      user.planExpiresAt = undefined;
    }
    if (body.resetUsage === true) user.usageCount = 0;
    await user.save();
    return NextResponse.json({ ok: true, role: user.role, usageCount: user.usageCount });
  } catch (err) {
    console.error("[admin/users/:id]", err);
    return apiError(request, "internal", 500);
  }
}
