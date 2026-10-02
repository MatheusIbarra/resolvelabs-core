import type { HydratedDocument } from "mongoose";
import type { ICoupon } from "@/models/Coupon";

export function serializeCoupon(c: HydratedDocument<ICoupon>) {
  return {
    id: c.id,
    code: c.code,
    discountPercent: c.discountPercent,
    expiresAt: c.expiresAt,
    maxUses: c.maxUses,
    usesCount: c.usesCount,
    active: c.active,
    createdAt: c.createdAt,
  };
}

