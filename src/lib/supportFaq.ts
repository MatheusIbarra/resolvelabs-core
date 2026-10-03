import { FREE_PDF_LIMIT, PRO_TRIAL_DAYS, SUPPORTED_BANKS } from "./content";
import type { ClientTranslator } from "@/i18n/I18nProvider";

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

const FAQ_IDS = ["trial", "ofx-import", "free-limit", "banks", "privacy", "cancel", "referral"] as const;

/** Perguntas frequentes no idioma atual (textos em i18n/messages/support.ts). */
export function buildFaq(tr: ClientTranslator): FaqItem[] {
  const vars = { days: PRO_TRIAL_DAYS, price: tr.t("common.pro.priceLabel"), limit: FREE_PDF_LIMIT, banks: SUPPORTED_BANKS.join(", ") };
  return FAQ_IDS.map((id) => ({
    id,
    question: tr.t(`support.faq.${id}.question`, vars),
    answer: tr.t(`support.faq.${id}.answer`, vars),
  }));
}

export function filterFaq(items: FaqItem[], query: string): FaqItem[] {
  const q = query.trim().toLowerCase();
  if (!q) return items;
  const terms = q.split(/\s+/);
  return items.filter((item) => {
    const haystack = `${item.question} ${item.answer}`.toLowerCase();
    return terms.every((t) => haystack.includes(t));
  });
}
