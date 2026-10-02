import mongoose, { Schema, type Model } from "mongoose";

export interface ICoupon {
  code: string;
  /** 1-100. 100 = gratuito/vitalício. */
  discountPercent: number;
  expiresAt: Date;
  maxUses: number;
  usesCount: number;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CouponSchema = new Schema<ICoupon>(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true, maxlength: 32 },
    discountPercent: { type: Number, required: true, min: 1, max: 100 },
    expiresAt: { type: Date, required: true },
    maxUses: { type: Number, required: true, min: 1 },
    usesCount: { type: Number, default: 0, min: 0 },
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
);

// Ver comentário em models/User.ts: evita schema antigo em cache durante o hot reload.
if (process.env.NODE_ENV !== "production" && mongoose.models.Coupon) mongoose.deleteModel("Coupon");

export const Coupon: Model<ICoupon> =
  (mongoose.models.Coupon as Model<ICoupon> | undefined) ?? mongoose.model<ICoupon>("Coupon", CouponSchema);
