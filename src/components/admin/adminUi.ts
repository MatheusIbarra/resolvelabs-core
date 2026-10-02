// Identidade técnica da área admin: monoespaçada, bordas sólidas, sem sombras e sem arredondamento.
export const MONO = "font-mono text-xs uppercase tracking-widest";
export const BTN =
  "font-mono text-xs uppercase tracking-widest border border-stone-950 bg-white text-stone-950 px-3 py-2 transition-colors enabled:hover:bg-stone-950 enabled:hover:text-white disabled:cursor-not-allowed disabled:opacity-40";
export const BTN_SOLID =
  "font-mono text-xs uppercase tracking-widest border border-stone-950 bg-stone-950 text-white px-4 py-2.5 transition-colors enabled:hover:bg-white enabled:hover:text-stone-950 disabled:cursor-not-allowed disabled:opacity-40";
export const FIELD =
  "w-full border border-stone-950 bg-white px-3 py-2 font-mono text-sm text-stone-950 placeholder:text-stone-400 focus:bg-stone-100 focus:outline-none";
export const TH = "px-3 py-2 text-left font-mono text-xs font-normal uppercase tracking-widest";
export const TD = "px-3 py-2.5 align-middle";

export const fmtDate = (iso: string | null | undefined) =>
  iso ? new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" }) : "—";
