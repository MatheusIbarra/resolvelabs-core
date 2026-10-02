// Estilos compartilhados do painel admin e do suporte: o mesmo padrão claro do resto do site
// (classes `btn-*`, `input`, `card` e `badge-*` ficam em app/globals.css).
/** Rótulo pequeno (a cor é definida por quem usa). */
export const MONO = "text-xs font-medium";
export const BTN = "btn-secondary !px-3 !py-1.5 text-xs";
export const BTN_SOLID = "btn-primary";
export const FIELD = "input";
export const TH = "px-4 py-2.5 text-left text-xs font-medium text-stone-500";
export const TD = "px-4 py-3 align-middle text-sm text-stone-800";

export const fmtDate = (iso: string | null | undefined) =>
  iso ? new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" }) : "—";
