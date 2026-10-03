import { apiError } from "@/lib/apiError";
import { NextResponse, type NextRequest } from "next/server";
import { Coupon } from "@/models/Coupon";
import { serializeCoupon } from "@/lib/coupons";
import { requireAdmin } from "@/lib/serverAuth";
import { isDuplicateKeyError } from "@/lib/validation";
import { parseAffiliateCode } from "@/lib/affiliate";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const guard = await requireAdmin(request);
  if (guard.response) return guard.response;
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 }).limit(200);
    return NextResponse.json({ coupons: coupons.map(serializeCoupon) });
  } catch (err) {
    console.error("[admin/coupons GET]", err);
    return apiError(request, "internal", 500);
  }
}

export async function POST(request: NextRequest) {
  const guard = await requireAdmin(request);
  if (guard.response) return guard.response;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return apiError(request, "invalidBody", 400);
  }

  const code = parseAffiliateCode(body.code); // mesmas regras: A-Z, 0-9, _ e -, 3 a 32 caracteres
  if (!code) return apiError(request, "couponCode", 400);

  const percent = body.discountPercent;
  if (typeof percent !== "number" || !Number.isInteger(percent) || percent < 1 || percent > 100) {
    return apiError(request, "couponDiscount", 400);
  }

  const expiresAt = typeof body.expiresAt === "string" ? new Date(body.expiresAt) : null;
  if (!expiresAt || Number.isNaN(expiresAt.getTime()) || expiresAt.getTime() <= Date.now()) {
    return apiError(request, "couponExpiry", 400);
  }

  const maxUses = body.maxUses;
  if (typeof maxUses !== "number" || !Number.isInteger(maxUses) || maxUses < 1 || maxUses > 1_000_000) {
    return apiError(request, "couponMaxUses", 400);
  }

  try {
    const coupon = await Coupon.create({ code, discountPercent: percent, expiresAt, maxUses });
    return NextResponse.json({ coupon: serializeCoupon(coupon) }, { status: 201 });
  } catch (err) {
    if (isDuplicateKeyError(err)) return apiError(request, "couponExists", 409);
    console.error("[admin/coupons POST]", err);
    return apiError(request, "internal", 500);
  }
}
