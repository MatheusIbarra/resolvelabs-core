import type { Shape } from "../types";

const en = {
  page: {
    metaTitle: "Support",
    breadcrumb: "Support",
    heading: "Support",
    description: "Questions or problems with a tool? Reach out to us by email.",
  },
  status: { open: "Open", answered: "Answered", closed: "Closed" },
  widget: {
    titleFaq: "Support",
    titleTickets: "My tickets",
    titleNew: "New ticket",
    titleChat: "Conversation",
    back: "Back",
    closeSupport: "Close support",
    openSupport: "Open support",
    answeredHint: "You have a reply from support",
    searchPlaceholder: "Search the frequently asked questions…",
    searchAria: "Search the FAQ",
    nothingFound: "Nothing found for “{query}”. Contact support below.",
    contactCta: "Contact support / open a ticket",
    gateBadge: "Restricted access",
    gateBody: "You need to be signed in to open a support ticket.",
    gateLogin: "Sign in",
    empty: "No tickets yet.",
    supportPrefix: "Support: ",
    youPrefix: "You: ",
    newTicket: "+ New ticket",
    subject: "Subject",
    message: "Message",
    sending: "Sending…",
    openTicket: "Open ticket",
    createFailed: "Failed to open the ticket.",
  },
  thread: {
    loadFailed: "Failed to load the ticket.",
    sendFailed: "Failed to send.",
    senderSupport: "Support",
    senderUser: "User",
    offline: "No connection — trying again…",
    closedNote: "Ticket closed. Open a new one if you need help.",
    placeholderAdmin: "Reply to the customer…",
    placeholderUser: "Write your message…",
    messageAria: "Message",
    ctrlEnter: "Ctrl+Enter to send",
    send: "Send",
  },
  faq: {
    trial: {
      question: "How does the {days}-day trial work?",
      answer:
        "When you subscribe to PRO you use all the tools for {days} days without paying. After that you're charged {price}. You can cancel at any time in the subscription portal, before the trial ends, to avoid being charged.",
    },
    "ofx-import": {
      question: "How do I import the OFX into my accounting system?",
      answer:
        "In most systems (Conta Azul, Omie, Domínio, QuickBooks, etc.) the path is: Finance › Bank reconciliation › Import statement › select the generated .ofx file. Choose the destination bank account before confirming.",
    },
    "free-limit": {
      question: "What is the free plan limit?",
      answer:
        "The PDF to OFX converter has {limit} free runs. The other PRO tools require a subscription. The Brazilian test data generator and the Universal file inspector are free.",
    },
    banks: {
      question: "Which banks are supported for conversion?",
      answer: "Currently: {banks}. If your bank isn't on the list, open a ticket sending the statement layout (without sensitive data).",
    },
    privacy: {
      question: "Are my files sent to the server?",
      answer: "No. The PDF to OFX conversion runs locally in your browser; the statement content is not sent to our servers.",
    },
    cancel: {
      question: "How do I cancel or change my subscription?",
      answer: "Go to Dashboard › My subscription and open the billing portal. There you can cancel, change your card and download receipts.",
    },
    referral: {
      question: "How does the referral program work?",
      answer: "Under Dashboard › Referrals you'll find your link. When someone signs up through it and subscribes, you earn PRO days.",
    },
  },
};

export type SupportMessages = Shape<typeof en>;

const es: SupportMessages = {
  page: {
    metaTitle: "Soporte",
    breadcrumb: "Soporte",
    heading: "Soporte",
    description: "¿Dudas o problemas con alguna herramienta? Escríbenos por correo electrónico.",
  },
  status: { open: "Abierto", answered: "Respondido", closed: "Cerrado" },
  widget: {
    titleFaq: "Soporte",
    titleTickets: "Mis tickets",
    titleNew: "Nuevo ticket",
    titleChat: "Conversación",
    back: "Volver",
    closeSupport: "Cerrar soporte",
    openSupport: "Abrir soporte",
    answeredHint: "Tienes una respuesta del soporte",
    searchPlaceholder: "Buscar en las preguntas frecuentes…",
    searchAria: "Buscar en las preguntas frecuentes",
    nothingFound: "No se encontró nada para “{query}”. Habla con soporte abajo.",
    contactCta: "Hablar con soporte / abrir un ticket",
    gateBadge: "Acceso restringido",
    gateBody: "Debes iniciar sesión para abrir un ticket de soporte.",
    gateLogin: "Iniciar sesión",
    empty: "Aún no hay tickets.",
    supportPrefix: "Soporte: ",
    youPrefix: "Tú: ",
    newTicket: "+ Nuevo ticket",
    subject: "Asunto",
    message: "Mensaje",
    sending: "Enviando…",
    openTicket: "Abrir ticket",
    createFailed: "No se pudo abrir el ticket.",
  },
  thread: {
    loadFailed: "No se pudo cargar el ticket.",
    sendFailed: "No se pudo enviar.",
    senderSupport: "Soporte",
    senderUser: "Usuario",
    offline: "Sin conexión — reintentando…",
    closedNote: "Ticket cerrado. Abre uno nuevo si necesitas ayuda.",
    placeholderAdmin: "Responder al cliente…",
    placeholderUser: "Escribe tu mensaje…",
    messageAria: "Mensaje",
    ctrlEnter: "Ctrl+Enter envía",
    send: "Enviar",
  },
  faq: {
    trial: {
      question: "¿Cómo funciona la prueba de {days} días?",
      answer:
        "Al suscribirte a PRO usas todas las herramientas durante {days} días sin pagar. Después el cobro pasa a ser de {price}. Puedes cancelar en cualquier momento desde el portal de suscripción, antes de que termine la prueba, para no ser cobrado.",
    },
    "ofx-import": {
      question: "¿Cómo importo el OFX en mi sistema contable?",
      answer:
        "En la mayoría de los sistemas (Conta Azul, Omie, Domínio, QuickBooks, etc.) el camino es: Finanzas › Conciliación bancaria › Importar extracto › selecciona el archivo .ofx generado. Elige la cuenta bancaria de destino antes de confirmar.",
    },
    "free-limit": {
      question: "¿Cuál es el límite del plan gratuito?",
      answer:
        "El conversor de PDF a OFX tiene {limit} ejecuciones gratuitas. Las demás herramientas PRO requieren suscripción. El generador de datos de prueba de Brasil y el inspector universal de archivos son gratuitos.",
    },
    banks: {
      question: "¿Qué bancos se admiten en la conversión?",
      answer: "Actualmente: {banks}. Si tu banco no está en la lista, abre un ticket enviando el diseño del extracto (sin datos sensibles).",
    },
    privacy: {
      question: "¿Mis archivos se envían al servidor?",
      answer: "No. La conversión de PDF a OFX se ejecuta localmente en tu navegador; el contenido del extracto no se envía a nuestros servidores.",
    },
    cancel: {
      question: "¿Cómo cancelo o cambio mi suscripción?",
      answer: "Entra en Panel › Mi suscripción y abre el portal de facturación. Allí cancelas, cambias la tarjeta y descargas los recibos.",
    },
    referral: {
      question: "¿Cómo funciona el programa de referidos?",
      answer: "En Panel › Referidos encuentras tu enlace. Cuando alguien se registra con él y se suscribe, ganas días de PRO.",
    },
  },
};

const pt: SupportMessages = {
  page: {
    metaTitle: "Suporte",
    breadcrumb: "Suporte",
    heading: "Suporte",
    description: "Dúvidas ou problemas com alguma ferramenta? Fale com a gente por e-mail.",
  },
  status: { open: "Aberto", answered: "Respondido", closed: "Fechado" },
  widget: {
    titleFaq: "Suporte",
    titleTickets: "Meus tickets",
    titleNew: "Novo ticket",
    titleChat: "Conversa",
    back: "Voltar",
    closeSupport: "Fechar suporte",
    openSupport: "Abrir suporte",
    answeredHint: "Você tem uma resposta do suporte",
    searchPlaceholder: "Buscar nas perguntas frequentes…",
    searchAria: "Buscar no FAQ",
    nothingFound: "Nada encontrado para “{query}”. Fale com o suporte abaixo.",
    contactCta: "Falar com suporte / abrir ticket",
    gateBadge: "Acesso restrito",
    gateBody: "Você precisa estar autenticado para abrir um ticket de suporte.",
    gateLogin: "Entrar",
    empty: "Nenhum ticket ainda.",
    supportPrefix: "Suporte: ",
    youPrefix: "Você: ",
    newTicket: "+ Novo ticket",
    subject: "Assunto",
    message: "Mensagem",
    sending: "Enviando…",
    openTicket: "Abrir ticket",
    createFailed: "Falha ao abrir o ticket.",
  },
  thread: {
    loadFailed: "Falha ao carregar o ticket.",
    sendFailed: "Falha ao enviar.",
    senderSupport: "Suporte",
    senderUser: "Usuário",
    offline: "Sem conexão — tentando de novo…",
    closedNote: "Ticket fechado. Abra um novo se precisar de ajuda.",
    placeholderAdmin: "Responder ao cliente…",
    placeholderUser: "Escreva sua mensagem…",
    messageAria: "Mensagem",
    ctrlEnter: "Ctrl+Enter envia",
    send: "Enviar",
  },
  faq: {
    trial: {
      question: "Como funciona o trial de {days} dias?",
      answer:
        "Ao assinar o PRO você usa todas as ferramentas por {days} dias sem pagar. Depois a cobrança passa a ser de {price}. Você pode cancelar a qualquer momento pelo portal de assinatura, antes do fim do teste, para não ser cobrado.",
    },
    "ofx-import": {
      question: "Como importar o OFX no meu sistema contábil?",
      answer:
        "Na maioria dos sistemas (Conta Azul, Omie, Domínio, QuickBooks etc.) o caminho é: Financeiro › Conciliação bancária › Importar extrato › selecione o arquivo .ofx gerado. Escolha a conta bancária de destino antes de confirmar.",
    },
    "free-limit": {
      question: "Qual o limite do plano gratuito?",
      answer:
        "O conversor de PDF para OFX tem {limit} execuções gratuitas. As demais ferramentas PRO exigem assinatura. O Gerador de Mock Data BR e o Inspetor Universal de Arquivos são gratuitos.",
    },
    banks: {
      question: "Quais bancos são suportados na conversão?",
      answer: "Atualmente: {banks}. Se o seu banco não está na lista, abra um ticket enviando o layout do extrato (sem dados sensíveis).",
    },
    privacy: {
      question: "Meus arquivos são enviados para o servidor?",
      answer: "Não. A conversão de PDF para OFX roda localmente no seu navegador; o conteúdo do extrato não é enviado aos nossos servidores.",
    },
    cancel: {
      question: "Como cancelo ou altero minha assinatura?",
      answer: "Acesse Painel › Minha Assinatura e abra o portal de cobrança. Lá você cancela, troca o cartão e baixa os recibos.",
    },
    referral: {
      question: "Como funciona o programa de indicações?",
      answer: "Em Painel › Indicações você encontra seu link. Quando alguém se cadastra por ele e assina, você ganha dias de PRO.",
    },
  },
};

export default { en, es, pt };
