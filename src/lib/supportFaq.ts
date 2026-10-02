import { FREE_PDF_LIMIT, PRO_PRICE_LABEL, PRO_TRIAL_DAYS, SUPPORTED_BANKS } from "./content";

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

export const FAQ: FaqItem[] = [
  {
    id: "trial",
    question: `Como funciona o trial de ${PRO_TRIAL_DAYS} dias?`,
    answer: `Ao assinar o PRO você usa todas as ferramentas por ${PRO_TRIAL_DAYS} dias sem pagar. Depois a cobrança passa a ser de ${PRO_PRICE_LABEL}. Você pode cancelar a qualquer momento pelo portal de assinatura, antes do fim do teste, para não ser cobrado.`,
  },
  {
    id: "ofx-import",
    question: "Como importar o OFX no meu sistema contábil?",
    answer:
      "Na maioria dos sistemas (Conta Azul, Omie, Domínio, QuickBooks etc.) o caminho é: Financeiro › Conciliação bancária › Importar extrato › selecione o arquivo .ofx gerado. Escolha a conta bancária de destino antes de confirmar.",
  },
  {
    id: "free-limit",
    question: "Qual o limite do plano gratuito?",
    answer: `O conversor de PDF para OFX tem ${FREE_PDF_LIMIT} execuções gratuitas. As demais ferramentas PRO exigem assinatura. O Gerador de Mock Data BR e o Inspetor Universal de Arquivos são gratuitos.`,
  },
  {
    id: "banks",
    question: "Quais bancos são suportados na conversão?",
    answer: `Atualmente: ${SUPPORTED_BANKS.join(", ")}. Se o seu banco não está na lista, abra um ticket enviando o layout do extrato (sem dados sensíveis).`,
  },
  {
    id: "privacy",
    question: "Meus arquivos são enviados para o servidor?",
    answer: "Não. A conversão de PDF para OFX roda localmente no seu navegador; o conteúdo do extrato não é enviado aos nossos servidores.",
  },
  {
    id: "cancel",
    question: "Como cancelo ou altero minha assinatura?",
    answer: "Acesse Painel › Minha Assinatura e abra o portal de cobrança. Lá você cancela, troca o cartão e baixa os recibos.",
  },
  {
    id: "referral",
    question: "Como funciona o programa de indicações?",
    answer: "Em Painel › Indicações você encontra seu link. Quando alguém se cadastra por ele e assina, você ganha dias de PRO.",
  },
];

export function filterFaq(query: string): FaqItem[] {
  const q = query.trim().toLowerCase();
  if (!q) return FAQ;
  const terms = q.split(/\s+/);
  return FAQ.filter((item) => {
    const haystack = `${item.question} ${item.answer}`.toLowerCase();
    return terms.every((t) => haystack.includes(t));
  });
}
