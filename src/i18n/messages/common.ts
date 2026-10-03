import type { Shape } from "../types";

const en = {
  meta: {
    title: "ResolveLabs — tools for accountants, store owners and developers",
    description:
      "Convert PDF to OFX, repair Google Merchant feeds, optimize images in bulk, generate test data and inspect files. All in your browser.",
    manifestDescription: "Tools that solve the everyday work of accountants, store owners and developers.",
  },
  brand: { homeAria: "ResolveLabs – home" },
  nav: {
    home: "Home",
    breadcrumb: "Breadcrumb",
    tools: "Tools",
    allTools: "All tools",
    blog: "Blog",
    pricing: "Pricing",
    subscribePro: "Get PRO",
    login: "Sign in",
    dashboard: "My dashboard",
    logout: "Sign out",
    loggingOut: "Signing out…",
  },
  language: { label: "Language", switchTo: "Change language" },
  ui: {
    loading: "Loading…",
    close: "Close",
    closeNotification: "Dismiss notification",
    cancel: "Cancel",
    save: "Save",
    tryAgain: "Try again",
    back: "Back",
  },
  pro: {
    priceLabel: "R$ 7.99/month",
    trialLabel: "{days} days free, then {price}",
    brazilOnly: "PRO can currently only be purchased in Brazil (prices in BRL). Other countries coming soon.",
    benefits: ["Unlimited PDF to OFX conversions", "Access to the XML validator", "Access to the image optimizer"],
  },
  tools: {
    badgeFree: "Free",
    badgePro: "PRO",
    openTool: "Open tool →",
    open: "Open →",
    sectionTitle: "Tools",
    items: {
      "pdf-para-ofx": {
        name: "PDF to OFX converter",
        audience: "Accountants and financial BPOs",
        description: "Convert bank statements for your accounting system.",
      },
      "reparador-xml": {
        name: "Merchant XML fixer",
        audience: "E-commerce store owners",
        description: "Validate and fix product errors in Google Shopping.",
      },
      "processador-imagens": {
        name: "Batch image optimizer",
        audience: "Real estate agents and retailers",
        description: "Resize and watermark images in bulk.",
      },
      "mock-data-br": {
        name: "Brazilian test data generator",
        audience: "Developers and QA",
        description: "Generate JSON with valid CPFs, CNPJs, postal codes and PIX keys for testing.",
      },
      "planilha-para-ofx": {
        name: "Spreadsheet to OFX converter",
        audience: "Accountants and financial BPOs",
        description: "Turn CSV or Excel into OFX by choosing the date, description and amount columns.",
      },
      "gerador-senhas": {
        name: "Password generator",
        audience: "Everyone",
        description: "Create strong, random passwords in your browser, without sending anything to a server.",
      },
      "gerador-qrcode": {
        name: "QR code generator",
        audience: "Everyone",
        description: "Generate a QR code for a link or text and download it as PNG, free and with no expiry.",
      },
      "inspetor-arquivos": {
        name: "Universal file inspector",
        audience: "Accountants, store owners and developers",
        description: "Open spreadsheets, OFX, XML, JSON, PDF and images in your browser, without sending anything to a server.",
      },
    },
  },
  toolGuard: {
    verifying: "Checking your access…",
    errorTitle: "We couldn't validate your access",
    restrictedTitle: "Access restricted to the PRO plan",
    restrictedBody: "Subscribe to PRO to use this tool.",
    validateFailed: "Failed to validate your permission.",
    viewPro: "See the PRO plan",
    backToDashboard: "Back to dashboard",
  },
  paywall: {
    authRequired: {
      tag: "Free account",
      title: "Save your progress.",
      body: "Create a free account to keep using the ResolveLabs tools. It takes less than a minute.",
      cta: "Create account",
      secondary: "Sign in",
    },
    limitReached: {
      tag: "{limit}/{limit} runs used",
      title: "Free limit reached.",
      body: "You've used your {limit} free runs. Subscribe to ResolveLabs PRO for unlimited access to this and ALL the tools on the platform.",
      cta: "See PRO plans",
    },
    proRequired: {
      tag: "PRO-only feature",
      title: "PRO-only tool.",
      body: "This advanced feature is only available to PRO subscribers. Subscribe to ResolveLabs PRO for unlimited access to ALL the tools on the platform.",
      cta: "Upgrade to PRO",
    },
    trialLine: "{trial}. Secure payment via Stripe, cancel anytime.",
  },
  home: {
    heading: "Get boring tasks done in a few clicks.",
    subheading:
      "Converters, validators and generators for accountants, store owners, real estate agents and developers. Start free, no sign-up.",
    ctaTools: "See all tools",
    ctaDashboard: "Go to my dashboard",
  },
  notFound: {
    metaTitle: "Page not found",
    badge: "Error 404",
    heading: "Page not found.",
    body: "The address you tried to reach doesn't exist or was moved. Go back home or open one of the tools below.",
    backHome: "Back to home",
    support: "Contact support",
  },
  toolsIndex: {
    metaTitle: "All tools",
    heading: "All tools",
    description: "Micro-tools for accountants, store owners, real estate agents and developers. Pick yours and start for free.",
  },
  seoLinks: { title: "Open and convert by format" },
  seoSections: {
    whatYouGet: "What you get",
    privacyTitle: "Privacy in your browser",
    privacyDefault:
      "The file is processed in your browser and never goes through our servers. You can use the tool with client statements and documents without exposing their content to third parties.",
    faq: "Frequently asked questions",
    related: "Related tools",
    offerFreePro: "Free + PRO",
    offerPro: "PRO",
    offerFree: "Free",
  },
};

export type CommonMessages = Shape<typeof en>;

const es: CommonMessages = {
  meta: {
    title: "ResolveLabs — herramientas para contadores, dueños de tiendas y desarrolladores",
    description:
      "Convierte PDF a OFX, repara feeds de Google Merchant, optimiza imágenes por lotes, genera datos de prueba e inspecciona archivos. Todo en tu navegador.",
    manifestDescription: "Herramientas que resuelven el día a día de contadores, dueños de tiendas y desarrolladores.",
  },
  brand: { homeAria: "ResolveLabs – inicio" },
  nav: {
    home: "Inicio",
    breadcrumb: "Ruta de navegación",
    tools: "Herramientas",
    allTools: "Todas las herramientas",
    blog: "Blog",
    pricing: "Precios",
    subscribePro: "Suscribirse a PRO",
    login: "Iniciar sesión",
    dashboard: "Mi panel",
    logout: "Cerrar sesión",
    loggingOut: "Cerrando sesión…",
  },
  language: { label: "Idioma", switchTo: "Cambiar idioma" },
  ui: {
    loading: "Cargando…",
    close: "Cerrar",
    closeNotification: "Cerrar notificación",
    cancel: "Cancelar",
    save: "Guardar",
    tryAgain: "Intentar de nuevo",
    back: "Volver",
  },
  pro: {
    priceLabel: "R$ 7,99/mes",
    trialLabel: "{days} días gratis, luego {price}",
    brazilOnly: "Por ahora PRO solo se puede comprar en Brasil (precios en BRL). Otros países próximamente.",
    benefits: ["Conversiones ilimitadas de PDF a OFX", "Acceso al validador de XML", "Acceso al optimizador de imágenes"],
  },
  tools: {
    badgeFree: "Gratis",
    badgePro: "PRO",
    openTool: "Abrir herramienta →",
    open: "Abrir →",
    sectionTitle: "Herramientas",
    items: {
      "pdf-para-ofx": {
        name: "Conversor de PDF a OFX",
        audience: "Contadores y BPOs financieros",
        description: "Convierte extractos bancarios para tu sistema contable.",
      },
      "reparador-xml": {
        name: "Reparador de XML de Merchant",
        audience: "Dueños de tiendas online",
        description: "Valida y corrige errores de productos en Google Shopping.",
      },
      "processador-imagens": {
        name: "Optimizador de imágenes por lotes",
        audience: "Agentes inmobiliarios y minoristas",
        description: "Redimensiona y aplica marca de agua en masa.",
      },
      "mock-data-br": {
        name: "Generador de datos de prueba de Brasil",
        audience: "Desarrolladores y QA",
        description: "Genera JSON con CPF, CNPJ, códigos postales válidos y claves PIX para pruebas.",
      },
      "planilha-para-ofx": {
        name: "Conversor de hoja de cálculo a OFX",
        audience: "Contadores y BPOs financieros",
        description: "Convierte CSV o Excel a OFX eligiendo las columnas de fecha, descripción e importe.",
      },
      "gerador-senhas": {
        name: "Generador de contraseñas",
        audience: "Para todos",
        description: "Crea contraseñas fuertes y aleatorias en el navegador, sin enviar nada a un servidor.",
      },
      "gerador-qrcode": {
        name: "Generador de códigos QR",
        audience: "Para todos",
        description: "Genera un código QR de un enlace o texto y descárgalo en PNG, gratis y sin caducidad.",
      },
      "inspetor-arquivos": {
        name: "Inspector universal de archivos",
        audience: "Contadores, tiendas online y desarrolladores",
        description: "Abre hojas de cálculo, OFX, XML, JSON, PDF e imágenes en el navegador, sin enviar nada a un servidor.",
      },
    },
  },
  toolGuard: {
    verifying: "Verificando tu acceso…",
    errorTitle: "No se pudo validar el acceso",
    restrictedTitle: "Acceso restringido al plan PRO",
    restrictedBody: "Suscríbete a PRO para usar esta herramienta.",
    validateFailed: "No se pudo validar tu permiso.",
    viewPro: "Ver el plan PRO",
    backToDashboard: "Volver al panel",
  },
  paywall: {
    authRequired: {
      tag: "Cuenta gratuita",
      title: "Guarda tu progreso.",
      body: "Crea una cuenta gratuita para seguir usando las herramientas de ResolveLabs. Toma menos de un minuto.",
      cta: "Crear cuenta",
      secondary: "Iniciar sesión",
    },
    limitReached: {
      tag: "{limit}/{limit} usos utilizados",
      title: "Límite gratuito alcanzado.",
      body: "Has usado tus {limit} ejecuciones gratuitas. Suscríbete a ResolveLabs PRO y obtén acceso ilimitado a esta y a TODAS las herramientas de la plataforma.",
      cta: "Ver planes PRO",
    },
    proRequired: {
      tag: "Función exclusiva PRO",
      title: "Herramienta exclusiva PRO.",
      body: "Esta función avanzada solo está disponible para suscriptores PRO. Suscríbete a ResolveLabs PRO y obtén acceso ilimitado a TODAS las herramientas de la plataforma.",
      cta: "Pasar a PRO",
    },
    trialLine: "{trial}. Pago seguro con Stripe, cancela cuando quieras.",
  },
  home: {
    heading: "Resuelve tareas aburridas en pocos clics.",
    subheading:
      "Conversores, validadores y generadores para contadores, dueños de tiendas, agentes inmobiliarios y desarrolladores. Empieza gratis, sin registro.",
    ctaTools: "Ver todas las herramientas",
    ctaDashboard: "Ir a mi panel",
  },
  notFound: {
    metaTitle: "Página no encontrada",
    badge: "Error 404",
    heading: "Página no encontrada.",
    body: "La dirección que intentaste abrir no existe o fue movida. Vuelve al inicio o abre una de las herramientas de abajo.",
    backHome: "Volver al inicio",
    support: "Hablar con soporte",
  },
  toolsIndex: {
    metaTitle: "Todas las herramientas",
    heading: "Todas las herramientas",
    description: "Microherramientas para contadores, dueños de tiendas, agentes inmobiliarios y desarrolladores. Elige la tuya y empieza gratis.",
  },
  seoLinks: { title: "Abrir y convertir por formato" },
  seoSections: {
    whatYouGet: "Lo que obtienes",
    privacyTitle: "Privacidad en tu navegador",
    privacyDefault:
      "El archivo se procesa en tu navegador y no pasa por nuestros servidores. Puedes usar la herramienta con extractos y documentos de clientes sin exponer su contenido a terceros.",
    faq: "Preguntas frecuentes",
    related: "Herramientas relacionadas",
    offerFreePro: "Gratis + PRO",
    offerPro: "PRO",
    offerFree: "Gratis",
  },
};

const pt: CommonMessages = {
  meta: {
    title: "ResolveLabs — ferramentas para contadores, lojistas e devs",
    description:
      "Converta PDF para OFX, repare feeds do Google Merchant, otimize imagens em lote, gere dados de teste e inspecione arquivos. Tudo no seu navegador.",
    manifestDescription: "Ferramentas que resolvem o dia a dia de contadores, lojistas e desenvolvedores.",
  },
  brand: { homeAria: "ResolveLabs – início" },
  nav: {
    home: "Home",
    breadcrumb: "Navegação estrutural",
    tools: "Ferramentas",
    allTools: "Todas as ferramentas",
    blog: "Blog",
    pricing: "Preços",
    subscribePro: "Assinar PRO",
    login: "Entrar",
    dashboard: "Meu painel",
    logout: "Sair",
    loggingOut: "Saindo…",
  },
  language: { label: "Idioma", switchTo: "Mudar idioma" },
  ui: {
    loading: "Carregando…",
    close: "Fechar",
    closeNotification: "Fechar notificação",
    cancel: "Cancelar",
    save: "Salvar",
    tryAgain: "Tentar novamente",
    back: "Voltar",
  },
  pro: {
    priceLabel: "R$ 7,99/mês",
    trialLabel: "{days} dias grátis, depois {price}",
    brazilOnly: "Por enquanto, o PRO só pode ser comprado no Brasil (preços em BRL). Outros países em breve.",
    benefits: ["Conversões infinitas de PDF para OFX", "Acesso ao Validador de XML", "Acesso ao Otimizador de Imagens"],
  },
  tools: {
    badgeFree: "Grátis",
    badgePro: "PRO",
    openTool: "Abrir ferramenta →",
    open: "Abrir →",
    sectionTitle: "Ferramentas",
    items: {
      "pdf-para-ofx": {
        name: "Conversor de PDF para OFX",
        audience: "Contadores e BPOs financeiros",
        description: "Converta extratos bancários para o seu sistema contábil.",
      },
      "reparador-xml": {
        name: "Reparador de XML Merchant",
        audience: "Lojistas de E-commerce",
        description: "Valide e corrija erros de produtos no Google Shopping.",
      },
      "processador-imagens": {
        name: "Otimizador de Imagens em Lote",
        audience: "Corretores e Varejistas",
        description: "Redimensione e aplique marca d'água em massa.",
      },
      "mock-data-br": {
        name: "Gerador de Mock Data BR",
        audience: "Desenvolvedores e QA",
        description: "Gere JSON com CPFs, CNPJs, CEPs válidos e chaves PIX para testes.",
      },
      "planilha-para-ofx": {
        name: "Conversor de Planilha para OFX",
        audience: "Contadores e BPOs financeiros",
        description: "Transforme CSV ou Excel em OFX escolhendo as colunas de data, descrição e valor.",
      },
      "gerador-senhas": {
        name: "Gerador de Senhas",
        audience: "Para todos",
        description: "Crie senhas fortes e aleatórias no navegador, sem enviar nada a servidor.",
      },
      "gerador-qrcode": {
        name: "Gerador de QR Code",
        audience: "Para todos",
        description: "Gere QR Code de link ou texto e baixe em PNG, grátis e sem validade.",
      },
      "inspetor-arquivos": {
        name: "Inspetor Universal de Arquivos",
        audience: "Contadores, lojistas e desenvolvedores",
        description: "Abra planilhas, OFX, XML, JSON, PDF e imagens no navegador, sem enviar nada a servidor.",
      },
    },
  },
  toolGuard: {
    verifying: "Verificando seu acesso…",
    errorTitle: "Não foi possível validar o acesso",
    restrictedTitle: "Acesso restrito ao plano PRO",
    restrictedBody: "Assine o PRO para usar esta ferramenta.",
    validateFailed: "Falha ao validar permissão.",
    viewPro: "Ver plano PRO",
    backToDashboard: "Voltar ao painel",
  },
  paywall: {
    authRequired: {
      tag: "Conta gratuita",
      title: "Salve seu progresso.",
      body: "Crie uma conta gratuita para continuar usando as ferramentas do ResolveLabs. Leva menos de um minuto.",
      cta: "Criar conta",
      secondary: "Entrar",
    },
    limitReached: {
      tag: "{limit}/{limit} execuções utilizadas",
      title: "Limite gratuito atingido.",
      body: "Você usou suas {limit} execuções gratuitas. Assine o ResolveLabs PRO e ganhe acesso ilimitado a esta e a TODAS as ferramentas da plataforma.",
      cta: "Ver planos PRO",
    },
    proRequired: {
      tag: "Recurso exclusivo PRO",
      title: "Ferramenta exclusiva PRO.",
      body: "Esta funcionalidade avançada está disponível apenas para assinantes PRO. Assine o ResolveLabs PRO e ganhe acesso ilimitado a TODAS as ferramentas da plataforma.",
      cta: "Fazer upgrade para PRO",
    },
    trialLine: "{trial}. Pagamento seguro via Stripe, cancele quando quiser.",
  },
  home: {
    heading: "Resolva tarefas chatas em poucos cliques.",
    subheading:
      "Conversores, validadores e geradores para contadores, lojistas, corretores e desenvolvedores. Comece grátis, sem cadastro.",
    ctaTools: "Ver todas as ferramentas",
    ctaDashboard: "Acessar meu painel",
  },
  notFound: {
    metaTitle: "Página não encontrada",
    badge: "Erro 404",
    heading: "Página não encontrada.",
    body: "O endereço que você tentou acessar não existe ou foi movido. Volte para o início ou abra uma das ferramentas abaixo.",
    backHome: "Voltar ao início",
    support: "Falar com o suporte",
  },
  toolsIndex: {
    metaTitle: "Todas as ferramentas",
    heading: "Todas as ferramentas",
    description: "Micro-ferramentas para contadores, lojistas, corretores e desenvolvedores. Escolha a sua e comece gratuitamente.",
  },
  seoLinks: { title: "Abrir e converter por formato" },
  seoSections: {
    whatYouGet: "O que você ganha",
    privacyTitle: "Privacidade no navegador",
    privacyDefault:
      "O arquivo é processado no seu navegador e não passa pelos nossos servidores. Você pode usar a ferramenta com extratos e documentos de clientes sem expor o conteúdo a terceiros.",
    faq: "Perguntas frequentes",
    related: "Ferramentas relacionadas",
    offerFreePro: "Grátis + PRO",
    offerPro: "PRO",
    offerFree: "Gratuito",
  },
};

export default { en, es, pt };
