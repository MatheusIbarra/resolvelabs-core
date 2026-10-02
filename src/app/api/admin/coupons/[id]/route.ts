import { NextResponse, type NextRequest } from "next/server";
import { isValidObjectId } from "mongoose";
import { Coupon } from "@/models/Coupon";
import { requireAdmin } from "@/lib/serverAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Ativa/desativa o cupom: body { active: boolean }. */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin(request);
  if (guard.response) return guard.response;

  const { id } = await params;
  if (!isValidObjectId(id)) return NextResponse.json({ error: "ID inválido." }, { status: 400 });

  let body: { active?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corpo da requisição inválido." }, { status: 400 });
  }
  if (typeof body.active !== "boolean") return NextResponse.json({ error: "Informe active (boolean)." }, { status: 400 });

  try {
    const coupon = await Coupon.findByIdAndUpdate(id, { active: body.active }, { new: true });
    if (!coupon) return NextResponse.json({ error: "Cupom não encontrado." }, { status: 404 });
    return NextResponse.json({ ok: true, active: coupon.active });
  } catch (err) {
    console.error("[admin/coupons PATCH]", err);
    return NextResponse.json({ error: "Erro interno. Tente novamente." }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin(request);
  if (guard.response) return guard.response;

  const { id } = await params;
  if (!isValidObjectId(id)) return NextResponse.json({ error: "ID inválido." }, { status: 400 });

  try {
    const coupon = await Coupon.findByIdAndDelete(id);
    if (!coupon) return NextResponse.json({ error: "Cupom não encontrado." }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[admin/coupons DELETE]", err);
    return NextResponse.json({ error: "Erro interno. Tente novamente." }, { status: 500 });
  }
}
