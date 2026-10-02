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
  /** "inspector" embute o Inspetor Universal; "cta" leva à ferramenta protegida; "page" = a ferramenta tem rota própria (app/ferramentas/<slug>). */
  render: "inspector" | "cta" | "page";
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
  /** Categoria do schema.org (padrão: BusinessApplication). */
  applicationCategory?: string;
  /** Texto do cartão de privacidade (padrão: arquivos e documentos processados no navegador). */
  privacy?: string;
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
    related: ["conversor-pdf-para-ofx", "planilha-para-ofx", "visualizador-xml", "visualizador-planilhas"],
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
    related: ["planilha-para-ofx", "pdf-para-ofx-nubank", "pdf-para-ofx-itau", "pdf-para-ofx-bradesco", "visualizador-ofx"],
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
    slug: "planilha-para-ofx",
    path: "/ferramentas/planilha-para-ofx",
    render: "page",
    kind: "converter",
    shortName: "Conversor de planilha para OFX",
    title: "Converter planilha (CSV ou Excel) para OFX online grátis",
    description:
      "Converta CSV, XLSX ou XLS em arquivo OFX para conciliação bancária: escolha as colunas de data, descrição e valor e baixe o OFX. Grátis, no navegador, sem enviar a planilha.",
    h1: "Converter planilha para OFX",
    intro:
      "Tem o extrato em CSV ou Excel e precisa do OFX para o sistema contábil? Envie a planilha, indique quais colunas são data, descrição e valor e baixe o arquivo. Sua planilha não passa pelos nossos servidores: o processamento é 100% no navegador.",
    features: [
      "Lê CSV, XLSX, XLS e ODS, inclusive CSV brasileiro (separador ponto e vírgula, números 1.234,56)",
      "Mapeamento de colunas: você escolhe qual é a data, a descrição e o valor",
      "Aceita uma coluna de valor com sinal ou colunas separadas de débito e crédito",
      "Prévia, total de entradas e saídas e lista de linhas ignoradas antes de baixar",
      "Processamento 100% no navegador: a planilha não passa pelos nossos servidores",
      "Gratuito e sem cadastro",
    ],
    faq: [
      {
        q: "Como converter planilha para OFX?",
        a: "Envie o arquivo CSV ou Excel, escolha nas listas qual coluna é a data, a descrição e o valor, confira a prévia e clique em gerar. O OFX é criado no seu navegador e o download começa na hora.",
      },
      {
        q: "Quais formatos de planilha são aceitos?",
        a: "CSV, TSV, XLSX, XLSM, XLS e ODS, com até 20 MB e 50 mil linhas. Em CSV, o ponto e vírgula, a vírgula e o tab são detectados automaticamente, assim como a codificação UTF-8 ou Windows-1252.",
      },
      {
        q: "Como a planilha deve estar organizada?",
        a: "Uma linha por lançamento, com pelo menos uma coluna de data e uma de valor. A descrição é opcional, mas ajuda na conciliação. Se a primeira linha for o cabeçalho, a ferramenta sugere as colunas pelo nome (Data, Histórico, Valor).",
      },
      {
        q: "Quais formatos de data e valor funcionam?",
        a: "Datas como 31/01/2026, 31/01/26, 2026-01-31 e datas do Excel. Valores como 1.234,56, 1,234.56, R$ 1.234,56, (1.234,56) para negativo e com sufixo D ou C. O formato do número é detectado pela coluna inteira, e você pode escolher manualmente.",
      },
      {
        q: "Minha planilha tem débito e crédito em colunas separadas. Funciona?",
        a: "Sim. Troque a opção de valores para colunas separadas e indique a coluna de débito (vira saída) e a de crédito (vira entrada).",
      },
      {
        q: "O que acontece com linhas inválidas?",
        a: "Linhas em branco são ignoradas sem aviso. Linhas com data ou valor inválidos também ficam de fora do OFX, e a ferramenta mostra quantas foram e o número das primeiras, para você corrigir a planilha se quiser.",
      },
      {
        q: "O OFX gerado inclui o saldo da conta?",
        a: "Não. O arquivo traz os lançamentos, o período e os dados da conta que você informar. Confira a importação no seu sistema contábil antes de usar em produção.",
      },
      {
        q: "Minha planilha é enviada para algum servidor?",
        a: "Não. A leitura da planilha e a geração do OFX acontecem no seu navegador e o arquivo não passa pelos nossos servidores.",
      },
    ],
    related: ["conversor-pdf-para-ofx", "visualizador-ofx", "visualizador-planilhas", "pdf-para-ofx-nubank"],
    keywords: [
      "converter planilha para ofx",
      "csv para ofx",
      "excel para ofx",
      "xlsx para ofx",
      "converter csv para ofx online grátis",
    ],
    offers: [FREE_OFFER],
    privacy:
      "A planilha é lida e convertida no seu navegador e não passa pelos nossos servidores. Você pode usar extratos de clientes sem expor o conteúdo a terceiros.",
  },
  {
    slug: "gerador-senhas",
    path: "/ferramentas/gerador-senhas",
    render: "page",
    kind: "viewer",
    shortName: "Gerador de senhas",
    title: "Gerador de senhas fortes e aleatórias online grátis",
    description:
      "Gere senhas fortes e aleatórias de 8 a 64 caracteres, com letras, números e símbolos. Grátis, sem cadastro, e a senha nunca sai do seu navegador.",
    h1: "Gerador de senhas fortes",
    intro:
      "Crie uma senha aleatória e forte em um clique: escolha o tamanho e os tipos de caractere. A senha é gerada no seu navegador e não é enviada nem guardada em lugar nenhum.",
    features: [
      "Tamanho de 8 a 64 caracteres, com letras maiúsculas, minúsculas, números e símbolos",
      "Aleatoriedade segura do navegador (crypto.getRandomValues), sem Math.random",
      "Opção para evitar caracteres parecidos, como O e 0 ou I e l",
      "Estimativa de força em bits de entropia",
      "A senha não é enviada nem armazenada: fica só na sua tela",
      "Gratuito e sem cadastro",
    ],
    faq: [
      {
        q: "Como gerar uma senha forte e aleatória?",
        a: "Ajuste o tamanho, marque os tipos de caractere e copie a senha. Para contas importantes, use 16 caracteres ou mais, com os quatro tipos, e uma senha diferente para cada serviço.",
      },
      {
        q: "A senha gerada é enviada ou salva em algum servidor?",
        a: "Não. Ela é criada no seu navegador e some quando você fecha ou recarrega a página. Nenhum valor de senha é enviado, e nós só contamos que a ferramenta foi usada, sem o conteúdo.",
      },
      {
        q: "Essa senha é realmente aleatória?",
        a: "Sim. O gerador usa a geração de números aleatórios criptograficamente segura do navegador e sorteia cada caractere sem viés. Garantimos pelo menos um caractere de cada tipo marcado.",
      },
      {
        q: "Qual o tamanho ideal de senha?",
        a: "Quanto maior, mais forte. Para a maioria das contas, 16 caracteres aleatórios já são difíceis de quebrar. A estimativa de força mostra a entropia em bits: acima de 80 bits é considerada muito forte.",
      },
      {
        q: "Como guardar tantas senhas?",
        a: "Use um gerenciador de senhas. Ele guarda cada senha única de forma criptografada e preenche os formulários por você.",
      },
      {
        q: "Posso usar para a senha do Wi-Fi?",
        a: "Pode. Para digitar com facilidade no celular, desmarque os símbolos e marque a opção de evitar caracteres parecidos, e use um tamanho maior para compensar.",
      },
    ],
    related: ["gerador-qrcode", "visualizador-json", "visualizador-ofx"],
    keywords: ["gerador de senhas", "gerador de senha forte", "gerar senha aleatória", "gerador de senhas online grátis"],
    offers: [FREE_OFFER],
    applicationCategory: "SecurityApplication",
    privacy:
      "A senha é gerada no seu navegador com geração aleatória segura. Ela não é enviada, salva nem registrada: some quando você fecha a página.",
  },
  {
    slug: "gerador-qrcode",
    path: "/ferramentas/gerador-qrcode",
    render: "page",
    kind: "viewer",
    shortName: "Gerador de QR Code",
    title: "Gerador de QR Code grátis: crie e baixe em PNG",
    description:
      "Crie QR Code de link ou texto na hora e baixe em PNG de alta resolução. Grátis, sem cadastro, sem validade, e o conteúdo não sai do seu navegador.",
    h1: "Gerador de QR Code grátis",
    intro:
      "Digite um link ou texto e o QR Code aparece na hora. Baixe em PNG nítido para imprimir ou compartilhar. O QR é gerado no seu navegador: o conteúdo não passa pelos nossos servidores.",
    features: [
      "QR Code instantâneo enquanto você digita",
      "Download em PNG de 512, 1024 ou 2048 pixels, com margem de segurança",
      "Escolha do nível de correção de erros (L, M, Q ou H)",
      "QR estático: o conteúdo fica gravado no próprio código, sem redirecionamento nem expiração",
      "Processamento 100% no navegador, sem enviar o conteúdo",
      "Gratuito e sem cadastro",
    ],
    faq: [
      {
        q: "Como gerar um QR Code grátis?",
        a: "Digite ou cole o link ou texto no campo. O QR Code é desenhado na hora e o botão Baixar PNG salva a imagem no seu computador.",
      },
      {
        q: "O QR Code expira?",
        a: "O QR em si não expira: ele é estático e guarda o conteúdo direto no desenho, sem passar por um serviço de redirecionamento. Se ele aponta para um link, o link ainda pode sair do ar, então confira se o destino continua válido.",
      },
      {
        q: "Posso gerar QR Code de Pix?",
        a: "Você pode colar o código Pix copia e cola gerado pelo seu banco e o QR vai representar exatamente esse texto. Não geramos nem validamos o Pix, então teste a leitura no app do seu banco antes de imprimir ou divulgar.",
      },
      {
        q: "Qual tamanho de PNG devo escolher?",
        a: "1024 pixels serve para a maioria dos usos. Use 2048 para impressão em tamanho grande e 512 para telas pequenas.",
      },
      {
        q: "O que é o nível de correção de erros?",
        a: "É quanto do QR pode estar sujo ou danificado e ainda ser lido. Níveis mais altos toleram mais dano, mas deixam o código mais denso e limitam o tamanho do texto.",
      },
      {
        q: "Posso mudar o destino depois de imprimir?",
        a: "Não. Como o QR é estático, o conteúdo não pode ser alterado depois. Se o destino mudar, é preciso gerar um novo QR Code.",
      },
      {
        q: "O conteúdo do meu QR Code é enviado para algum servidor?",
        a: "Não. O QR Code é gerado no seu navegador e o texto não passa pelos nossos servidores.",
      },
    ],
    related: ["gerador-senhas", "visualizador-json", "visualizador-xml"],
    keywords: ["gerador de qr code", "gerar qr code grátis", "qr code png", "gerador de qr code sem validade"],
    offers: [FREE_OFFER],
    applicationCategory: "UtilitiesApplication",
    privacy: "O QR Code é gerado no seu navegador. O texto ou link que você digita não é enviado nem armazenado.",
  },
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

/** Slugs gerados pela rota dinâmica (as ferramentas com rota própria ficam de fora). */
export function dynamicSeoSlugs(): string[] {
  return SEO_TOOLS.filter((t) => t.render !== "page").map((t) => t.slug);
}

export function relatedTools(tool: SeoTool): SeoTool[] {
  return tool.related.map(getSeoTool).filter((t): t is SeoTool => Boolean(t));
}
