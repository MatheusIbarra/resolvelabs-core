// Conteúdo e constantes de UI. Nada disso deve ficar solto em JSX.

export const FREE_PDF_LIMIT = 3;
export const AFFILIATE_REWARD_DAYS = 15;
export const PRO_PRICE_CENTS = 799;
export const PRO_TRIAL_DAYS = 7;
export const PRO_PRICE_LABEL = "R$ 7,99/mês";
export const PRO_TRIAL_LABEL = `${PRO_TRIAL_DAYS} dias grátis, depois ${PRO_PRICE_LABEL}`;

export const SUPPORTED_BANKS = ["Nubank", "Inter", "Itaú", "Bradesco"];

export const CONVERTER_SPECS: [label: string, value: string][] = [
  ["ENTRADA", "PDF"],
  ["SAÍDA", "OFX"],
  ["PROCESSAMENTO", "LOCAL / NAVEGADOR"],
  ["ENVIO AO SERVIDOR", "NENHUM"],
];

export const PRO_BENEFITS = [
  "Conversões infinitas de PDF para OFX",
  "Acesso ao Validador de XML",
  "Acesso ao Otimizador de Imagens",
];

export type DenyReason = "LIMIT_REACHED" | "PRO_REQUIRED";

export const PAYWALL_COPY: Record<DenyReason, { tag: string; title: string; body: string }> = {
  LIMIT_REACHED: {
    tag: `${FREE_PDF_LIMIT}/${FREE_PDF_LIMIT} execuções utilizadas`,
    title: "Limite gratuito atingido.",
    body: `Você usou suas ${FREE_PDF_LIMIT} execuções gratuitas. Assine o ResolveLabs PRO e ganhe acesso ilimitado a esta e a TODAS as ferramentas da plataforma.`,
  },
  PRO_REQUIRED: {
    tag: "Recurso exclusivo PRO",
    title: "Ferramenta exclusiva PRO.",
    body: "Esta ferramenta faz parte do plano PRO. Assine o ResolveLabs PRO e ganhe acesso ilimitado a TODAS as ferramentas da plataforma.",
  },
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
