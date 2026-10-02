// Textos padronizados de feedback (toasts e alertas). Evite strings soltas nos componentes.

export function errorMessage(err: unknown, fallback: string): string {
  return err instanceof Error && err.message ? err.message : fallback;
}

export const MSG = {
  pdf: {
    invalidFormat: "Formato inválido. Envie apenas arquivos em PDF.",
    convertedTitle: "OFX gerado",
    converted: (name: string, count: number) => `${count} transações de ${name} foram exportadas para OFX.`,
    noTransactions: "Não encontramos transações neste PDF. Use o extrato em PDF baixado direto do banco (com texto selecionável).",
    failed: "Não foi possível processar o arquivo. Tente novamente.",
    validateFailed: "Não foi possível validar sua permissão. Tente novamente.",
    limitReached: "Você atingiu o limite gratuito. Assine o PRO para continuar.",
  },
  auth: {
    profileFailed: "Não foi possível carregar seu perfil.",
  },
  billing: {
    subscribedTitle: "Plano PRO ativado",
    subscribed: "Você agora tem acesso ilimitado a todas as ferramentas.",
    confirming: "Confirmando sua assinatura…",
    stillProcessing: "Seu pagamento está sendo processado. Atualize a página em instantes.",
    checkoutCanceled: "Checkout cancelado. Nenhuma cobrança foi feita.",
    checkoutFailed: "Não foi possível iniciar o checkout. Tente novamente.",
    couponFailed: "Não foi possível validar o cupom. Tente novamente.",
    portalFailed: "Não foi possível abrir o portal de cobrança. Tente novamente.",
  },
  demo: {
    planChanged: (plan: string) => `Plano alterado para ${plan}.`,
    usageReset: "Contador de uso zerado.",
    failed: "Não foi possível concluir a ação de demonstração.",
  },
  tools: {
    validateFailed: "Não foi possível validar o acesso à ferramenta.",
  },
  xml: {
    invalidFile: "Arquivo inválido. Envie um arquivo .xml.",
    limitReached: "Limite gratuito atingido. Assine o PRO para analisar mais feeds.",
    needSource: "Envie um arquivo XML ou informe a URL do feed.",
    analyzedTitle: "Análise concluída",
    analyzed: (items: number, errors: number, fixed: number) =>
      `${items} produtos analisados: ${fixed} correções automáticas e ${errors} problemas que precisam da sua atenção.`,
    analyzeFailed: "Não foi possível analisar o feed.",
    fetchFailed: "Não foi possível ler a URL (o servidor do feed bloqueia leitura direta pelo navegador). Baixe o XML e envie o arquivo.",
    downloadedTitle: "XML corrigido",
    downloaded: "O download do feed corrigido foi iniciado.",
    notWellFormed: "O XML resultante ainda tem erros de estrutura. Revise o arquivo original.",
  },
  images: {
    onlyImages: "Alguns arquivos foram ignorados: apenas imagens são aceitas.",
    batchLimit: (max: number) => `Limite de ${max} imagens por lote.`,
    freeBatchLimit: (free: number, max: number) =>
      `O plano gratuito processa lotes de até ${free} fotos. Assine o PRO para liberar até ${max}.`,
    processedTitle: "Lote processado",
    processed: (n: number, pct: number) => `${n} imagens processadas. Tamanho total ${pct >= 0 ? `reduzido em ${pct}%` : `aumentou ${-pct}%`}.`,
    failed: "Não foi possível processar o lote. Alguma imagem pode estar corrompida.",
  },
  sheetOfx: {
    readFailed: "Não foi possível ler a planilha. Confira se o arquivo é um CSV ou Excel válido.",
    generated: (n: number) => `OFX gerado com ${n} lançamento${n === 1 ? "" : "s"}. O download foi iniciado.`,
    invalidAccount: "Código do banco e conta aceitam só letras, números e hífen (até 22 caracteres).",
    duplicateColumns: "Cada campo precisa de uma coluna diferente.",
  },
  password: {
    copied: "Senha copiada para a área de transferência.",
    copyFailed: "Não foi possível copiar. Selecione a senha e copie manualmente.",
    noRandom: "Seu navegador não oferece geração aleatória segura. Atualize o navegador para usar o gerador.",
  },
  qr: {
    tooLong: "Texto longo demais para um QR Code. Use um conteúdo menor ou um nível de correção mais baixo.",
    downloaded: "Download do QR Code iniciado.",
    exportFailed: "Não foi possível gerar a imagem PNG.",
  },
  mock: {
    limitReached: "Limite gratuito atingido. Assine o PRO para gerar sem limites.",
    emptyKeys: "Preencha o nome de todas as chaves.",
    generated: (n: number) => `${n} registro${n === 1 ? "" : "s"} gerado${n === 1 ? "" : "s"}.`,
    failed: "Não foi possível gerar os dados.",
    copied: "JSON copiado para a área de transferência.",
    copyFailed: "Não foi possível copiar para a área de transferência.",
    downloaded: "Download do arquivo iniciado.",
  },
} as const;

export const AUTH_MSG = {
  loginSuccess: "Login realizado com sucesso.",
  registerSuccess: "Conta criada! Você já está logado.",
  logoutSuccess: "Você saiu da sua conta.",
  logoutFailed: "Não foi possível sair. Tente novamente.",
  network: "Não foi possível conectar ao servidor. Tente novamente.",
} as const;

export const ADMIN_MSG = {
  loadFailed: "Não foi possível carregar os dados.",
  grantedTitle: "PRO concedido",
  granted: (email: string, days: number | null) =>
    days === null ? `${email} agora tem PRO vitalício.` : `${email} ganhou ${days} dia${days === 1 ? "" : "s"} de PRO.`,
  grantFailed: "Não foi possível conceder o PRO.",
  invalidDays: "Informe uma quantidade de dias entre 1 e 3650.",
  revoked: (email: string) => `PRO de ${email} revogado.`,
  usageReset: (email: string) => `Uso de ${email} zerado.`,
  actionFailed: "Não foi possível concluir a ação.",
  couponCreated: (code: string) => `Cupom ${code} criado.`,
  couponFailed: "Não foi possível salvar o cupom.",
  couponToggled: (code: string, active: boolean) => `Cupom ${code} ${active ? "ativado" : "desativado"}.`,
  couponDeleted: (code: string) => `Cupom ${code} excluído.`,
  couponFormInvalid: "Preencha código, desconto, validade e limite de usos.",
} as const;

export const AFFILIATE_MSG = {
  loadFailed: "Não foi possível carregar seus dados de indicação.",
  copiedTitle: "Link copiado",
  copied: "Compartilhe com colegas contadores ou devs.",
  copyFailed: "Não foi possível copiar. Selecione o link e copie manualmente.",
} as const;
