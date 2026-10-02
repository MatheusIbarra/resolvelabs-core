import mongoose, { Schema, type Model } from "mongoose";
import { ROLES, type Role } from "@/lib/roles";

export interface IUser {
  email: string;
  password: string;
  /** Nível de acesso e plano: 'free' | 'pro' | 'admin' (fonte única usada por JWT, middleware e RBAC). */
  role: Role;
  /** Se definido, o acesso PRO concedido manualmente expira nesta data. Ausente = sem expiração. */
  planExpiresAt?: Date;
  usageCount: number;
  /** Celular (somente dígitos, DDD + 9 dígitos). */
  phone?: string;
  /** Aceite dos Termos de Uso no cadastro. */
  termsAccepted: boolean;
  termsAcceptedAt?: Date;
  /** Código que este usuário divulga para indicar novos cadastros (ex.: "K7M2QX"). */
  affiliateCode?: string;
  /** Código do afiliado que indicou este usuário no cadastro. */
  referredBy?: string;
  /** Cliente e assinatura no Stripe (preenchidos pelo webhook). */
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  /** Quando este usuário (indicado) gerou a recompensa para quem o indicou. Garante pagamento único. */
  /** Impressões digitais (Stripe) dos cartões usados nas assinaturas. Evita repetir o teste grátis com o mesmo cartão. */
  cardFingerprints?: string[];
  /** Última cobrança recusada (limpo quando o pagamento é regularizado ou a assinatura termina). */
  paymentFailedAt?: Date;
  referralRewardedAt?: Date;
  /** Último cupom resgatado (evita consumir o mesmo cupom duas vezes em reentregas do webhook). */
  couponCode?: string;
  /** Total de dias de PRO ganhos por indicações (como indicador). */
  referralRewardDays: number;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 254,
    },
    // select: false -> nunca vem em queries, a menos que pedido com .select("+password")
    password: { type: String, required: true, select: false },
    role: { type: String, enum: ROLES, default: "free", required: true },
    planExpiresAt: { type: Date },
    usageCount: { type: Number, default: 0, min: 0 },
    // Obrigatórios só na criação: contas anteriores ao campo continuam salvando normalmente.
    phone: {
      type: String,
      trim: true,
      required: function (this: { isNew: boolean }) {
        return this.isNew;
      },
    },
    termsAccepted: { type: Boolean, required: true, default: true },
    termsAcceptedAt: { type: Date },
    affiliateCode: { type: String, unique: true, sparse: true, uppercase: true, trim: true },
    referredBy: { type: String, uppercase: true, trim: true, index: true },
    stripeCustomerId: { type: String, index: true, sparse: true },
    stripeSubscriptionId: { type: String, index: true, sparse: true },
    cardFingerprints: { type: [String], index: true, default: undefined },
    paymentFailedAt: { type: Date },
    referralRewardedAt: { type: Date },
    couponCode: { type: String, uppercase: true, trim: true },
    referralRewardDays: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true },
);

// Em desenvolvimento o hot reload reavalia este arquivo, mas `mongoose.models` sobrevive.
// Sem descartar o model antigo, mudanças no schema são ignoradas até reiniciar o servidor.
if (process.env.NODE_ENV !== "production" && mongoose.models.User) mongoose.deleteModel("User");

export const User: Model<IUser> =
  (mongoose.models.User as Model<IUser> | undefined) ?? mongoose.model<IUser>("User", UserSchema);
