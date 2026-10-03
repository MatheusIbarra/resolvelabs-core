import mongoose, { Schema, Types, type Model } from "mongoose";

export const ACTIVITY_EVENTS = ["pageview", "view", "use", "usage", "usage_blocked", "login", "login_failed", "register", "logout"] as const;
export type ActivityEvent = (typeof ACTIVITY_EVENTS)[number];

/** Dias que um registro fica guardado (o índice TTL apaga depois). IP é dado pessoal: não guardar para sempre. */
export const ACTIVITY_RETENTION_DAYS = 180;

/**
 * Um registro por ação (visita, uso de ferramenta, login...). Guarda quem (usuário/IP), de onde (geo aproximada
 * pelos cabeçalhos da hospedagem) e com o quê (navegador). NUNCA grava nome ou conteúdo de arquivo, senha, cookie ou token.
 */
export interface IActivityLog {
  event: ActivityEvent;
  userId?: Types.ObjectId;
  /** E-mail no momento do evento (no login que falhou é o digitado, mesmo sem conta). */
  email?: string;
  role?: string;
  /** Slug da ferramenta (eventos view/use/usage). */
  tool?: string;
  /** Tipo de arquivo aberto (nunca o nome). */
  kind?: string;
  /** Caminho da página, sem query string. */
  path?: string;
  referrer?: string;
  ip: string;
  userAgent?: string;
  language?: string;
  country?: string;
  region?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  timezone?: string;
  createdAt: Date;
}

const ActivityLogSchema = new Schema<IActivityLog>(
  {
    event: { type: String, enum: ACTIVITY_EVENTS, required: true },
    userId: { type: Schema.Types.ObjectId },
    email: { type: String, maxlength: 254 },
    role: { type: String, maxlength: 16 },
    tool: { type: String, maxlength: 80 },
    kind: { type: String, maxlength: 24 },
    path: { type: String, maxlength: 200 },
    referrer: { type: String, maxlength: 300 },
    ip: { type: String, required: true, maxlength: 64 },
    userAgent: { type: String, maxlength: 512 },
    language: { type: String, maxlength: 64 },
    country: { type: String, maxlength: 8 },
    region: { type: String, maxlength: 80 },
    city: { type: String, maxlength: 120 },
    latitude: { type: Number },
    longitude: { type: Number },
    timezone: { type: String, maxlength: 64 },
    createdAt: { type: Date, default: Date.now, required: true },
  },
  { versionKey: false },
);

ActivityLogSchema.index({ createdAt: -1 });
ActivityLogSchema.index({ userId: 1, createdAt: -1 });
ActivityLogSchema.index({ ip: 1, createdAt: -1 });
ActivityLogSchema.index({ event: 1, createdAt: -1 });
ActivityLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: ACTIVITY_RETENTION_DAYS * 86_400 });

if (process.env.NODE_ENV !== "production" && mongoose.models.ActivityLog) mongoose.deleteModel("ActivityLog");

export const ActivityLog: Model<IActivityLog> =
  (mongoose.models.ActivityLog as Model<IActivityLog> | undefined) ?? mongoose.model<IActivityLog>("ActivityLog", ActivityLogSchema);
