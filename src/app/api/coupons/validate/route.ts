import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser, unauthenticated } from "@/lib/serverAuth";
import { findUsableCoupon } from "@/lib/couponRedeem";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Body: { code }. Informa o desconto de um cupom válido, sem consumi-lo. */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) return unauthenticated();

    let body: { code?: unknown };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Corpo da requisição inválido." }, { status: 400 });
    }

    const result = await findUsableCoupon(body.code);
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
    return NextResponse.json({ code: result.coupon.code, discountPercent: result.coupon.discountPercent });
  } catch (err) {
    console.error("[coupons/validate]", err);
    return NextResponse.json({ error: "Não foi possível validar o cupom." }, { status: 500 });
  }
}
