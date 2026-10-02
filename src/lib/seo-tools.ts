// Dicionário de SEO: uma entrada por página pública, cada uma para UMA intenção de busca real.
// Sinônimos ("abrir", "ler", "ver") entram no texto e no FAQ, nunca em páginas separadas.
// Preços e limites vêm de lib/content; nada de avaliações inventadas.
import { FREE_PDF_LIMIT, PRO_PRICE_CENTS, PRO_PRICE_LABEL, PRO_TRIAL_DAYS } from "./content";

export type SeoKind = "viewer" | "converter" | "repair";

export interface SeoFaq {
  q: string;
  a: string;
}

export interface SeoOffer {
  name: string;
  /** Preço em reais (0 = gratuito). */
  price: number;
  description: string;
}

export interface SeoTool {
  slug: string;
  /** Caminho público desta landing. */
  path: string;
  /** "inspector" embute o Inspetor Universal (público, 100% client-side); "cta" leva à ferramenta protegida. */
  render: "inspector" | "cta";
  kind: SeoKind;
  /** <title> da página (a marca é adicionada no fim). */
  title: string;
  description: string;
  h1: string;
  intro: string;
  /** Nome curto usado no breadcrumb e nos links internos. */
  shortName: string;
  features: string[];
  /** Passos opcionais (ex.: como baixar o extrato em cada banco). */
  steps?: { title: string; items: string[] };
  faq: SeoFaq[];
  related: string[];
  /** Termos pesquisados que a página cobre. Só documentação interna; o Google ignora meta keywords. */
  keywords: string[];
  offers: SeoOffer[];
  /** CTA para ferramentas que não rodam dentro da página. */
  cta?: { label: string; href: string; note: string };
}

const FREE_OFFER: SeoOffer = { name: "Gratuito", price: 0, description: "Uso gratuito, sem cadastro." };
const PRIVACY = "O arquivo é processado no seu navegador e não passa pelos nossos servidores.";

const BANK_STEPS_NOTE = "Os nomes dos menus mudam conforme a versão do app ou do internet banking.";

interface BankPage {
  slug: string;
  bank: string;
  steps: string[];
  extra: SeoFaq;
}

const BANK_PAGES: BankPage[] = [
  {
    slug: "pdf-para-ofx-nubank",
    bank: "Nubank",
    steps: [
      "No app do Nubank, abra a conta (NuConta) e procure a opção de pedir ou exportar o extrato.",
      "Escolha o período e, se o app oferecer, o formato OFX. Se só houver PDF, baixe o PDF.",
      "Com o PDF em mãos, use o conversor do ResolveLabs para gerar o OFX no navegador.",
      "Importe o OFX no seu sistema contábil ou financeiro.",
    ],
    extra: {
      q: "Como baixar o extrato do Nubank em OFX?",
      a: "No app, abra a NuConta e use a opção de pedir o extrato, escolhendo o período e o formato. Quando o OFX não estiver disponível para o período que você precisa, baixe o PDF e converta aqui. " + BANK_STEPS_NOTE,
    },
  },
  {
    slug: "pdf-para-ofx-itau",
    bank: "Itaú",
    steps: [
      "No internet banking ou no app do Itaú, abra a tela de extrato da conta.",
      "Selecione o período e procure a opção de salvar o extrato em outros formatos (OFX). Se só houver PDF, baixe o PDF.",
      "Converta o PDF no ResolveLabs para gerar o OFX direto no navegador.",
      "Importe o OFX no seu sistema contábil.",
    ],
    extra: {
      q: "Como gerar o extrato do Itaú em OFX?",
      a: "Na tela de extrato do internet banking, procure a opção de salvar ou exportar em outros formatos e escolha OFX. Se o período ou a conta não oferecer OFX, baixe o PDF e converta aqui. " + BANK_STEPS_NOTE,
    },
  },
  {
    slug: "pdf-para-ofx-bradesco",
    bank: "Bradesco",
    steps: [
      "No internet banking ou no app do Bradesco, abra o extrato da conta.",
      "Defina o período e procure a opção de exportar ou salvar o extrato em OFX. Se só houver PDF, baixe o PDF.",
      "Converta o PDF no ResolveLabs para gerar o OFX direto no navegador.",
      "Importe o OFX no seu sistema contábil.",
    ],
    extra: {
      q: "Como baixar o extrato do Bradesco em OFX?",
      a: "No extrato do internet banking ou do app, use a opção de exportar ou salvar e escolha OFX. Quando não houver OFX para o período, baixe o PDF e converta aqui. " + BANK_STEPS_NOTE,
    },
  },
];

function bankTool(b: BankPage): SeoTool {
  return {
    slug: b.slug,
    path: `/ferramentas/${b.slug}`,
    render: "cta",
    kind: "converter",
    shortName: `Extrato ${b.bank} em OFX`,
    title: `Converter extrato ${b.bank} em PDF para OFX online`,
    description: `Transforme o extrato do ${b.bank} em PDF em arquivo OFX para conciliação bancária. Conversão no navegador, sem enviar o PDF aos nossos servidores. ${FREE_PDF_LIMIT} conversões grátis.`,
    h1: `Converter extrato do ${b.bank} de PDF para OFX`,
    intro: `Baixou o extrato do ${b.bank} em PDF e precisa do OFX para o sistema contábil? Converta aqui. ${PRIVACY}`,
    features: [
      `Lê o layout de extrato em PDF do ${b.bank}`,
      "Gera OFX pronto para importar em sistemas contábeis e ERPs",
      "Processamento 100% no navegador: o PDF não passa pelos nossos servidores",
      `${FREE_PDF_LIMIT} conversões gratuitas; depois, plano PRO`,
    ],
    steps: { title: `Como gerar o OFX do extrato do ${b.bank}`, items: b.steps },
    faq: [
      b.extra,
      {
        q: `Posso converter o extrato do ${b.bank} de PDF para OFX de graça?`,
        a: `Sim, você tem ${FREE_PDF_LIMIT} conversões gratuitas. Depois disso, o plano PRO (${PRO_PRICE_LABEL}, com ${PRO_TRIAL_DAYS} dias grátis no início) libera conversões ilimitadas.`,
      },
      {
        q: `O PDF do meu extrato do ${b.bank} é enviado para algum servidor?`,
        a: "Não. A leitura do PDF e a geração do OFX acontecem no seu navegador. Só registramos o contador de usos da sua conta, nunca o conteúdo do arquivo.",
      },
      {
        q: "Qual a diferença entre extrato em PDF e em OFX?",
        a: "O PDF é só visual. O OFX traz data, valor, descrição e tipo de cada lançamento de forma estruturada, por isso sistemas contábeis conseguem importar e conciliar automaticamente.",
      },
    ],
    related: ["conversor-pdf-para-ofx", "visualizador-ofx", ...BANK_PAGES.filter((o) => o.slug !== b.slug).map((o) => o.slug)],
    keywords: [
      `extrato ${b.bank.toLowerCase()} ofx`,
      `converter extrato ${b.bank.toLowerCase()} pdf para ofx`,
      `como baixar extrato ofx ${b.bank.toLowerCase()}`,
    ],
    offers: [
      { name: "Gratuito", price: 0, description: `${FREE_PDF_LIMIT} conversões gratuitas.` },
      { name: "PRO", price: PRO_PRICE_CENTS / 100, description: `Conversões ilimitadas. ${PRO_TRIAL_DAYS} dias grátis no início.` },
    ],
    cta: {
      label: "Converter meu extrato agora",
      href: "/ferramentas/pdf-para-ofx",
      note: "Crie uma conta gratuita ou entre para converter. O PDF continua no seu navegador.",
    },
  };
}

export const SEO_TOOLS: SeoTool[] = [
  {
    slug: "visualizador-ofx",
    path: "/ferramentas/visualizador-ofx",
    render: "inspector",
    kind: "viewer",
    shortName: "Visualizador de OFX",
    title: "Visualizador de OFX online grátis: abrir arquivo OFX",
    description:
      "Abra e visualize qualquer arquivo OFX online: veja saldo, conta e todos os lançamentos do extrato. Grátis, sem cadastro e sem enviar o arquivo a servidores.",
    h1: "Visualizador de OFX online",
    intro: `Abra um arquivo OFX e veja a conta, o saldo e cada lançamento do extrato em segundos. Seu arquivo OFX não passa pelos nossos servidores: o processamento é 100% no navegador.`,
    features: [
      "Abre arquivos OFX e QFX de qualquer banco",
      "Mostra conta, período, saldo e todos os lançamentos em tabela",
      "Funciona no computador e no celular, sem instalar programa",
      "Processamento 100% no navegador: o arquivo não passa pelos nossos servidores",
      "Gratuito e sem cadastro",
    ],
    faq: [
      {
        q: "O que é um arquivo OFX?",
        a: "OFX (Open Financial Exchange) é o formato que bancos usam para exportar extratos de forma estruturada. Ele traz data, valor, descrição e tipo de cada lançamento, e é o padrão para importar extratos em sistemas contábeis e de conciliação bancária.",
      },
      {
        q: "Como abrir um arquivo OFX?",
        a: "Escolha o arquivo na caixa acima ou arraste-o para ela. O ResolveLabs lê o OFX no seu navegador e mostra o extrato em tabela, sem instalar nada e sem enviar o arquivo.",
      },
      {
        q: "Meu arquivo OFX é enviado para algum servidor?",
        a: "Não. A leitura acontece inteiramente no seu navegador e o arquivo não passa pelos nossos servidores.",
      },
      {
        q: "Dá para abrir OFX no celular?",
        a: "Sim. A página funciona no navegador do celular: toque em escolher arquivo e selecione o OFX baixado.",
      },
      {
        q: "Como abrir OFX no Excel ou converter para CSV?",
        a: "Este visualizador mostra o conteúdo do OFX e permite copiar os dados, mas não gera planilha. Para ver o extrato com colunas, você pode abrir o OFX aqui e copiar os lançamentos para a sua planilha.",
      },
      {
        q: "Qual a diferença entre OFX e CSV?",
        a: "O OFX segue um padrão com campos definidos (data, valor, ID da transação), o que facilita a importação automática. O CSV é uma tabela simples e cada banco monta as colunas do seu jeito.",
      },
      {
        q: "O visualizador altera o meu arquivo OFX?",
        a: "Não. Ele apenas lê e exibe o conteúdo; o arquivo original não é modificado.",
      },
    ],
    related: ["conversor-pdf-para-ofx", "visualizador-xml", "visualizador-planilhas", "pdf-para-ofx-nubank"],
    keywords: [
      "abrir arquivo ofx",
      "visualizar ofx online",
      "ler arquivo ofx",
      "arquivo ofx o que é",
      "abrir ofx no celular",
      "ofx para excel",
      "ofx ou csv",
    ],
    offers: [FREE_OFFER],
  },
  {
    slug: "visualizador-xml",
    path: "/ferramentas/visualizador-xml",
    render: "inspector",
    kind: "viewer",
    shortName: "Visualizador de XML",
    title: "Visualizador de XML online grátis: abrir e ver estrutura do XML",
    description:
      "Abra arquivos XML online e navegue pela estrutura em árvore, inclusive o XML de NF-e. Grátis, sem cadastro e sem enviar o arquivo a servidores.",
    h1: "Visualizador de XML online",
    intro:
      "Abra um arquivo XML e navegue pela estrutura em árvore, com tags, atributos e valores. Serve para ver o conteúdo do XML de uma NF-e, de um feed de produtos ou de qualquer outro arquivo. O arquivo não passa pelos nossos servidores.",
    features: [
      "Mostra o XML em árvore, com tags, atributos e valores",
      "Útil para conferir o conteúdo do XML de NF-e, NFC-e e CT-e",
      "Aponta XML mal formado, com a mensagem de erro",
      "Copia um nó ou o XML inteiro formatado",
      "Processamento 100% no navegador, sem enviar o arquivo",
    ],
    faq: [
      {
        q: "Como abrir um arquivo XML?",
        a: "Escolha o arquivo na caixa acima ou arraste-o até ela. O XML é lido no seu navegador e exibido em árvore, sem instalar nada.",
      },
      {
        q: "Dá para ver o conteúdo do XML de uma NF-e?",
        a: "Sim, você consegue navegar por todos os campos do XML da NF-e (emitente, destinatário, itens, impostos, chave de acesso). Esta ferramenta mostra a estrutura e os dados do XML; ela não gera o DANFE em PDF.",
      },
      {
        q: "O XML é enviado para algum servidor?",
        a: "Não. A leitura acontece no seu navegador e o arquivo não passa pelos nossos servidores.",
      },
      {
        q: "Como saber se meu XML está mal formado?",
        a: "Ao abrir, a ferramenta tenta interpretar o XML. Se houver tag aberta e não fechada ou caractere inválido, ela mostra o erro encontrado. Ela verifica se o XML está bem formado; não valida contra um schema (XSD).",
      },
      {
        q: "Funciona com XML grande?",
        a: "Arquivos de texto grandes são carregados na memória do navegador, com limite de 60 MB. Acima disso, a ferramenta avisa.",
      },
    ],
    related: ["visualizador-ofx", "visualizador-json", "reparador-xml-merchant", "visualizador-planilhas"],
    keywords: [
      "visualizar xml online",
      "abrir arquivo xml",
      "ver estrutura xml nfe",
      "visualizar xml nfe online",
      "validar xml online",
    ],
    offers: [FREE_OFFER],
  },
  {
    slug: "visualizador-planilhas",
    path: "/ferramentas/visualizador-planilhas",
    render: "inspector",
    kind: "viewer",
    shortName: "Visualizador de XLSX e CSV",
    title: "Abrir XLSX e CSV online grátis: visualizador de planilhas",
    description:
      "Abra planilhas XLSX, XLS, CSV e ODS online, sem Excel. Veja abas e células direto no navegador, grátis e sem enviar o arquivo a servidores.",
    h1: "Abrir XLSX e CSV online",
    intro:
      "Veja o conteúdo de planilhas XLSX, XLS, CSV, TSV e ODS sem precisar do Excel. O arquivo é aberto no seu navegador e não passa pelos nossos servidores.",
    features: [
      "Abre XLSX, XLSM, XLS, CSV, TSV e ODS",
      "Navega entre abas e rola planilhas grandes",
      "Copia células individuais",
      "Detecta o tipo real do arquivo pelo conteúdo, não só pela extensão",
      "Processamento 100% no navegador, sem enviar o arquivo",
    ],
    faq: [
      {
        q: "Como abrir um arquivo XLSX sem o Excel?",
        a: "Escolha o arquivo na caixa acima ou arraste-o. A planilha é lida no navegador e exibida com as abas e células, sem instalar programa.",
      },
      {
        q: "Como abrir um CSV online?",
        a: "Use a mesma caixa: o CSV é aberto em formato de tabela. Isso evita o problema de colunas coladas quando o Excel interpreta o separador errado.",
      },
      {
        q: "Meu arquivo é enviado para algum servidor?",
        a: "Não. A planilha é lida no seu navegador e não passa pelos nossos servidores.",
      },
      {
        q: "Este visualizador edita planilhas?",
        a: "Não. Ele serve para ler e copiar o conteúdo. O arquivo original não é modificado.",
      },
    ],
    related: ["visualizador-ofx", "visualizador-json", "visualizador-xml"],
    keywords: ["abrir xlsx online", "abrir csv online", "visualizar csv online", "abrir planilha sem excel"],
    offers: [FREE_OFFER],
  },
  {
    slug: "visualizador-json",
    path: "/ferramentas/visualizador-json",
    render: "inspector",
    kind: "viewer",
    shortName: "Visualizador de JSON",
    title: "Visualizador de JSON online grátis: abrir arquivo JSON",
    description:
      "Abra e visualize arquivos JSON em árvore, formatado e legível. Grátis, sem cadastro e sem enviar o arquivo a servidores.",
    h1: "Visualizador de JSON online",
    intro:
      "Abra um arquivo JSON e navegue pela estrutura em árvore, com objetos, listas e valores. O arquivo é lido no seu navegador e não passa pelos nossos servidores.",
    features: [
      "Mostra o JSON em árvore, expandindo e recolhendo níveis",
      "Aponta JSON inválido com a mensagem de erro",
      "Copia um nó ou o JSON inteiro formatado",
      "Processamento 100% no navegador, sem enviar o arquivo",
    ],
    faq: [
      {
        q: "Como abrir um arquivo JSON?",
        a: "Escolha o arquivo na caixa acima ou arraste-o até ela. O JSON é lido no navegador e exibido em árvore.",
      },
      {
        q: "O JSON é enviado para algum servidor?",
        a: "Não. A leitura acontece no seu navegador e o arquivo não passa pelos nossos servidores.",
      },
      {
        q: "Como saber se um JSON é válido?",
        a: "Ao abrir, a ferramenta tenta interpretar o conteúdo. Se houver vírgula sobrando, aspas faltando ou outro erro de sintaxe, ela mostra a mensagem do erro.",
      },
    ],
    related: ["visualizador-xml", "visualizador-planilhas", "visualizador-ofx"],
    keywords: ["visualizar json online", "abrir arquivo json", "abrir json online"],
    offers: [FREE_OFFER],
  },
  {
    slug: "conversor-pdf-para-ofx",
    path: "/ferramentas/conversor-pdf-para-ofx",
    render: "cta",
    kind: "converter",
    shortName: "Conversor de PDF para OFX",
    title: "Converter PDF para OFX online: extrato bancário para conciliação",
    description: `Converta extrato bancário em PDF para OFX direto no navegador, sem enviar o PDF aos nossos servidores. ${FREE_PDF_LIMIT} conversões grátis, depois plano PRO.`,
    h1: "Converter extrato PDF para OFX",
    intro: `Transforme o extrato bancário em PDF em um arquivo OFX pronto para importar no sistema contábil. Seu PDF não passa pelos nossos servidores: o processamento é 100% no navegador.`,
    features: [
      "Converte extratos em PDF de Nubank, Inter, Itaú e Bradesco",
      "Gera OFX pronto para importar em sistemas contábeis e ERPs",
      "Processamento 100% no navegador: o PDF não passa pelos nossos servidores",
      `${FREE_PDF_LIMIT} conversões gratuitas; depois, plano PRO com conversões ilimitadas`,
    ],
    faq: [
      {
        q: "Como converter PDF para OFX?",
        a: "Entre na sua conta gratuita, abra o conversor e envie o extrato em PDF. O arquivo é lido no seu navegador, os lançamentos são identificados e o OFX é gerado para você baixar.",
      },
      {
        q: "Dá para converter PDF para OFX de graça?",
        a: `Sim. Você tem ${FREE_PDF_LIMIT} conversões gratuitas. Depois, o plano PRO (${PRO_PRICE_LABEL}, com ${PRO_TRIAL_DAYS} dias grátis no início) libera conversões ilimitadas.`,
      },
      {
        q: "O meu PDF é enviado para algum servidor?",
        a: "Não. A leitura do PDF e a geração do OFX acontecem no seu navegador. Só registramos o contador de usos da sua conta, nunca o conteúdo do arquivo.",
      },
      {
        q: "Quais bancos são aceitos?",
        a: "Nubank, Inter, Itaú e Bradesco. Se o seu banco não estiver na lista, abra um ticket pelo suporte enviando o layout do extrato, sem dados sensíveis.",
      },
      {
        q: "Qual a diferença entre extrato em PDF e em OFX?",
        a: "O PDF é só visual. O OFX traz data, valor, descrição e tipo de cada lançamento de forma estruturada, por isso sistemas contábeis conseguem importar e conciliar automaticamente.",
      },
      {
        q: "Como conferir o OFX gerado?",
        a: "Abra o arquivo no visualizador de OFX do ResolveLabs para conferir saldo e lançamentos antes de importar no sistema.",
      },
    ],
    related: ["pdf-para-ofx-nubank", "pdf-para-ofx-itau", "pdf-para-ofx-bradesco", "visualizador-ofx"],
    keywords: [
      "converter pdf para ofx",
      "pdf para ofx grátis",
      "converter extrato pdf para ofx",
      "extrato pdf para ofx online",
    ],
    offers: [
      { name: "Gratuito", price: 0, description: `${FREE_PDF_LIMIT} conversões gratuitas.` },
      { name: "PRO", price: PRO_PRICE_CENTS / 100, description: `Conversões ilimitadas. ${PRO_TRIAL_DAYS} dias grátis no início.` },
    ],
    cta: {
      label: "Abrir o conversor",
      href: "/ferramentas/pdf-para-ofx",
      note: "Crie uma conta gratuita ou entre para converter. O PDF continua no seu navegador.",
    },
  },
  ...BANK_PAGES.map(bankTool),
  {
    slug: "reparador-xml-merchant",
    path: "/ferramentas/reparador-xml-merchant",
    render: "cta",
    kind: "repair",
    shortName: "Reparador de XML do Google Merchant",
    title: "Corrigir XML do Google Merchant Center: erros de feed e GTIN",
    description:
      "Valide e corrija o feed XML do Google Merchant Center: HTML nas descrições, preços fora do padrão e GTIN inválido que bloqueiam produtos no Google Shopping. Plano PRO.",
    h1: "Corrigir feed XML do Google Merchant Center",
    intro:
      "Produtos reprovados no Google Merchant Center por XML quebrado, HTML nas descrições ou GTIN inválido? Valide o feed, limpe o HTML e veja os GTINs com problema em um clique. Seu feed é tratado no navegador.",
    features: [
      "Valida o XML do feed e corrige preços fora do padrão, \"&\" soltos e IDs ausentes",
      "Remove o HTML das descrições e títulos",
      "Remove a máscara do GTIN e aponta os GTINs com dígito verificador inválido",
      "Aceita o arquivo XML ou a URL do feed",
      "Tratamento no navegador: o conteúdo do feed não passa pelos nossos servidores",
    ],
    faq: [
      {
        q: "O que causa erro no feed XML do Google Merchant Center?",
        a: "Os motivos mais comuns são XML mal formado, HTML solto nas descrições, preços fora do padrão e GTINs com máscara ou dígito verificador inválido.",
      },
      {
        q: "Como corrigir GTIN inválido no Google Merchant?",
        a: "O GTIN precisa ter 8, 12, 13 ou 14 dígitos e dígito verificador correto. A ferramenta remove máscaras (pontos e traços) automaticamente e aponta os GTINs com dígito verificador inválido, que você precisa conferir com o fabricante.",
      },
      {
        q: "O meu feed é enviado para os servidores do ResolveLabs?",
        a: "Não. O XML é tratado no seu navegador. Ao carregar por URL, quem busca o feed é o seu próprio navegador, então o servidor do feed precisa permitir o acesso (CORS).",
      },
      {
        q: "Essa ferramenta é gratuita?",
        a: `Ela faz parte do plano PRO (${PRO_PRICE_LABEL}), com ${PRO_TRIAL_DAYS} dias grátis no início. Para só conferir a estrutura de um XML, use o visualizador de XML, que é gratuito.`,
      },
    ],
    related: ["visualizador-xml", "visualizador-planilhas", "visualizador-json"],
    keywords: [
      "corrigir xml google merchant",
      "erro gtin google merchant",
      "google merchant center xml feed",
      "validar feed xml google shopping",
    ],
    offers: [{ name: "PRO", price: PRO_PRICE_CENTS / 100, description: `${PRO_TRIAL_DAYS} dias grátis no início.` }],
    cta: {
      label: "Abrir o Reparador de XML",
      href: "/ferramentas/reparador-xml",
      note: "Requer o plano PRO. Se ainda não tiver, você será levado para ver o plano.",
    },
  },
];

/** Ferramentas 100% client-side (sem chamar API) liberadas sem login, além das landings acima. */
export const PUBLIC_CLIENT_TOOL_PATHS = ["/ferramentas/inspetor-arquivos", "/ferramentas/mock-data-br"];

/** Todo caminho de ferramenta acessível sem login (match exato). */
export function publicToolPaths(): string[] {
  return [...SEO_TOOLS.map((t) => t.path), ...PUBLIC_CLIENT_TOOL_PATHS];
}

export function getSeoTool(slug: string): SeoTool | undefined {
  return SEO_TOOLS.find((t) => t.slug === slug);
}

/** Slugs gerados pela rota dinâmica; também são as únicas URLs de ferramenta liberadas sem login. */
export function dynamicSeoSlugs(): string[] {
  return SEO_TOOLS.map((t) => t.slug);
}

export function relatedTools(tool: SeoTool): SeoTool[] {
  return tool.related.map(getSeoTool).filter((t): t is SeoTool => Boolean(t));
}
