export type ToolStatus = "live" | "soon";

export interface Tool {
  slug: string;
  /** Caminho canônico (o `Link` aplica idioma e segmentos traduzidos). Textos: `common.tools.items.<slug>`. */
  href: string;
  iconPath: string;
  status: ToolStatus;
  /** Ferramenta exclusiva do plano PRO. */
  requiresPro: boolean;
  /** Quantidade de usos gratuitos no plano FREE (ausente = sem limite próprio). */
  freeLimit?: number;
}

export const TOOLS: Tool[] = [
  {
    slug: "pdf-para-ofx",
    href: "/ferramentas/pdf-para-ofx",
    iconPath: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
    status: "live",
    requiresPro: false,
    freeLimit: 3,
  },
  {
    slug: "reparador-xml",
    href: "/ferramentas/reparador-xml",
    iconPath: "M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4",
    status: "live",
    requiresPro: true,
  },
  {
    slug: "processador-imagens",
    href: "/ferramentas/processador-imagens",
    iconPath: "M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z",
    status: "live",
    requiresPro: true,
  },
  {
    slug: "mock-data-br",
    href: "/ferramentas/mock-data-br",
    iconPath: "M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4",
    status: "live",
    requiresPro: false,
  },
  {
    slug: "planilha-para-ofx",
    href: "/ferramentas/planilha-para-ofx",
    iconPath: "M3 10h18M3 14h18M10 4v16M6 4h12a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2z",
    status: "live",
    requiresPro: false,
  },
  {
    slug: "gerador-senhas",
    href: "/ferramentas/gerador-senhas",
    iconPath: "M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z",
    status: "live",
    requiresPro: false,
  },
  {
    slug: "gerador-qrcode",
    href: "/ferramentas/gerador-qrcode",
    iconPath: "M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z",
    status: "live",
    requiresPro: false,
  },
  {
    slug: "inspetor-arquivos",
    href: "/ferramentas/inspetor-arquivos",
    iconPath: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z",
    status: "live",
    requiresPro: false,
  },
];

export function getTool(slug: string): Tool | undefined {
  return TOOLS.find((t) => t.slug === slug);
}

export interface ToolCopy {
  name: string;
  audience: string;
  description: string;
}

/** Textos da ferramenta no idioma atual: `toolCopy(raw("common.tools.items"), slug)`. */
export function toolCopy(items: Record<string, ToolCopy>, slug: string): ToolCopy {
  return items[slug] ?? { name: slug, audience: "", description: "" };
}
