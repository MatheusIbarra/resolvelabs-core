// Conteúdo e constantes de UI. Nada disso deve ficar solto em JSX.

export const FREE_PDF_LIMIT = 3;
export const AFFILIATE_REWARD_DAYS = 15;
export const PRO_PRICE_CENTS = 799;
export const PRO_TRIAL_DAYS = 7;
// Textos (rótulo de preço, benefícios, paywall) ficam em i18n/messages/common.ts.

export const SUPPORTED_BANKS = ["Nubank", "Inter", "Itaú", "Bradesco"];

export type DenyReason = "AUTH_REQUIRED" | "LIMIT_REACHED" | "PRO_REQUIRED";

export interface PaywallAction {
  href: string;
  /** Leva o caminho atual em `?next=` para voltar à ferramenta depois do login/cadastro. */
  returnHere?: boolean;
}

/** Destinos e comportamento de cada motivo de paywall. Os textos vêm de `common.paywall.<chave>`. */
export const PAYWALL_CONFIG: Record<
  DenyReason,
  { textKey: "authRequired" | "limitReached" | "proRequired"; cta: PaywallAction; secondary?: PaywallAction; showPro: boolean }
> = {
  AUTH_REQUIRED: {
    textKey: "authRequired",
    cta: { href: "/register", returnHere: true },
    secondary: { href: "/login", returnHere: true },
    showPro: false,
  },
  LIMIT_REACHED: { textKey: "limitReached", cta: { href: "/checkout" }, showPro: true },
  PRO_REQUIRED: { textKey: "proRequired", cta: { href: "/checkout" }, showPro: true },
};

// --- Dados de demonstração das ferramentas (substituir por respostas da API) ---

export const IMAGE_MOCK_THUMBS = [
  { name: "casa-01.jpg", gradient: "from-stone-200 to-stone-400" },
  { name: "sala-02.jpg", gradient: "from-stone-100 to-stone-300" },
  { name: "cozinha-03.jpg", gradient: "from-stone-300 to-stone-500" },
  { name: "fachada-04.jpg", gradient: "from-stone-200 to-stone-300" },
  { name: "produto-05.jpg", gradient: "from-stone-100 to-stone-400" },
  { name: "produto-06.jpg", gradient: "from-stone-300 to-stone-400" },
];
