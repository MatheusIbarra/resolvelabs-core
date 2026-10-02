import { Coupon, type ICoupon } from "@/models/Coupon";
import { parseAffiliateCode } from "./affiliate";

export type CouponCheck =
  | { ok: true; coupon: ICoupon & { id: string } }
  | { ok: false; error: string };

/** Confere código, ativação, validade e limite de usos (leitura; o consumo é feito em `consumeCoupon`). */
export async function findUsableCoupon(rawCode: unknown): Promise<CouponCheck> {
  const code = parseAffiliateCode(rawCode);
  if (!code) return { ok: false, error: "Cupom inválido." };

  const coupon = await Coupon.findOne({ code });
  if (!coupon || !coupon.active) return { ok: false, error: "Cupom inválido." };
  if (coupon.expiresAt.getTime() <= Date.now()) return { ok: false, error: "Este cupom expirou." };
  if (coupon.usesCount >= coupon.maxUses) return { ok: false, error: "Este cupom atingiu o limite de usos." };
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
