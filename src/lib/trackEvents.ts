// Contrato dos eventos de uso (cliente e servidor). O servidor valida tudo contra estas listas.
import { publicToolPaths } from "./seo-tools";

export const TRACK_EVENTS = ["view", "use"] as const;
export type TrackEvent = (typeof TRACK_EVENTS)[number];

/** Tipos de arquivo que o Inspetor reconhece (espelha FileKind). Nunca o nome ou o conteúdo do arquivo. */
export const TRACK_KINDS = ["spreadsheet", "ofx", "xml", "json", "pdf", "image"] as const;
export type TrackKind = (typeof TRACK_KINDS)[number];

/** Slug (último segmento da URL) de cada página pública rastreada. */
export const TRACKED_TOOLS: string[] = publicToolPaths().map((p) => p.split("/").pop()!);

export const isTrackedTool = (v: unknown): v is string => typeof v === "string" && TRACKED_TOOLS.includes(v);
export const isTrackEvent = (v: unknown): v is TrackEvent => typeof v === "string" && (TRACK_EVENTS as readonly string[]).includes(v);
export const isTrackKind = (v: unknown): v is TrackKind => typeof v === "string" && (TRACK_KINDS as readonly string[]).includes(v);
