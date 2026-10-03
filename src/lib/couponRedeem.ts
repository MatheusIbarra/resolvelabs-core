import { Coupon, type ICoupon } from "@/models/Coupon";
import { parseAffiliateCode } from "./affiliate";

export type CouponCheck =
  | { ok: true; coupon: ICoupon & { id: string } }
  | { ok: false; error: "couponInvalid" | "couponExpired" | "couponExhausted" };

/** Confere código, ativação, validade e limite de usos (leitura; o consumo é feito em `consumeCoupon`). */
export async function findUsableCoupon(rawCode: unknown): Promise<CouponCheck> {
  const code = parseAffiliateCode(rawCode);
  if (!code) return { ok: false, error: "couponInvalid" };

  const coupon = await Coupon.findOne({ code });
  if (!coupon || !coupon.active) return { ok: false, error: "couponInvalid" };
  if (coupon.expiresAt.getTime() <= Date.now()) return { ok: false, error: "couponExpired" };
  if (coupon.usesCount >= coupon.maxUses) return { ok: false, error: "couponExhausted" };
  return { ok: true, coupon };
}

/** Consome 1 uso de forma atômica (sem estourar `maxUses` sob concorrência). */
export async function consumeCoupon(code: string): Promise<boolean> {
  const updated = await Coupon.findOneAndUpdate(
    {
      code,
      active: true,
      expiresAt: { $gt: new Date() },
      $expr: { $lt: ["$usesCount", "$maxUses"] },
    },
    { $inc: { usesCount: 1 } },
  );
  return updated !== null;
}
