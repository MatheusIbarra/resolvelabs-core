// Visual do Inspetor: o mesmo padrão claro do resto do site (cartões brancos, tons de pedra e verde-azulado).
// A fonte monoespaçada fica só nos dados (células, árvore, código).
export const BAR = "flex flex-wrap items-center gap-x-4 gap-y-1 border-b border-stone-200 px-4 py-2.5 text-sm";
export const DIM = "text-stone-500";
export const BTN = "btn-secondary !px-3 !py-1.5";
export const TABLIST = "flex flex-wrap border-b border-stone-200 px-2";
export const SECTION_LABEL = "border-b border-stone-200 bg-stone-50 px-4 py-2 text-xs font-medium uppercase tracking-wide text-stone-500";

export const tabClass = (active: boolean) =>
  `-mb-px border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
    active ? "border-teal-700 text-teal-800" : "border-transparent text-stone-500 hover:text-stone-800"
  }`;
