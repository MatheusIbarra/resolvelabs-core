import mongoose, { Schema, type Model } from "mongoose";

/** Contador diário agregado por ferramenta/evento/tipo. Sem usuário, IP ou conteúdo: só contagens. */
export interface IToolStat {
  /** Dia em UTC (AAAA-MM-DD). */
  day: string;
  tool: string;
  event: "view" | "use";
  /** Tipo de arquivo aberto no Inspetor ("" quando não se aplica). */
  kind: string;
  count: number;
}

const ToolStatSchema = new Schema<IToolStat>({
  day: { type: String, required: true },
  tool: { type: String, required: true },
  event: { type: String, enum: ["view", "use"], required: true },
  kind: { type: String, default: "" },
  count: { type: Number, default: 0, min: 0 },
});
ToolStatSchema.index({ day: 1, tool: 1, event: 1, kind: 1 }, { unique: true });

if (process.env.NODE_ENV !== "production" && mongoose.models.ToolStat) mongoose.deleteModel("ToolStat");

export const ToolStat: Model<IToolStat> =
  (mongoose.models.ToolStat as Model<IToolStat> | undefined) ?? mongoose.model<IToolStat>("ToolStat", ToolStatSchema);
