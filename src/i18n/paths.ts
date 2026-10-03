// Caminhos localizados. As pastas de `src/app/[lang]` usam os nomes "canônicos" (os de português);
// o middleware reescreve a URL localizada (/en/tools/pdf-to-ofx) para o caminho canônico (/en/ferramentas/pdf-para-ofx).
// Todo link do app passa por `localizePath` (via `Link`/`useRouter`), então a tabela abaixo é o único lugar a editar.
import { DEFAULT_LOCALE, LOCALES, isLocale, type Locale } from "./config";

type Names = Record<Locale, string>;

/** Segmentos de URL traduzidos. Chave = nome canônico (pasta em `src/app/[lang]`). */
const SEGMENTS: Record<string, Names> = {
  ferramentas: { en: "tools", es: "herramientas", pt: "ferramentas" },
  suporte: { en: "support", es: "soporte", pt: "suporte" },
  termos: { en: "terms", es: "terminos", pt: "termos" },
  afiliados: { en: "affiliates", es: "afiliados", pt: "afiliados" },
};

/** Slugs de ferramentas (segmento depois de /ferramentas). Chave = slug canônico. */
const TOOL_SLUGS: Record<string, Names> = {
  "pdf-para-ofx": { en: "pdf-to-ofx", es: "pdf-a-ofx", pt: "pdf-para-ofx" },
  "reparador-xml": { en: "xml-repair", es: "reparador-xml", pt: "reparador-xml" },
  "processador-imagens": { en: "image-optimizer", es: "optimizador-imagenes", pt: "processador-imagens" },
  "mock-data-br": { en: "brazil-test-data", es: "datos-de-prueba-br", pt: "mock-data-br" },
  "planilha-para-ofx": { en: "spreadsheet-to-ofx", es: "hoja-de-calculo-a-ofx", pt: "planilha-para-ofx" },
  "gerador-senhas": { en: "password-generator", es: "generador-contrasenas", pt: "gerador-senhas" },
  "gerador-qrcode": { en: "qr-code-generator", es: "generador-qr", pt: "gerador-qrcode" },
  "inspetor-arquivos": { en: "file-inspector", es: "inspector-archivos", pt: "inspetor-arquivos" },
  "pdf-para-ofx-nubank": { en: "nubank-pdf-to-ofx", es: "nubank-pdf-a-ofx", pt: "pdf-para-ofx-nubank" },
  "pdf-para-ofx-itau": { en: "itau-pdf-to-ofx", es: "itau-pdf-a-ofx", pt: "pdf-para-ofx-itau" },
  "pdf-para-ofx-bradesco": { en: "bradesco-pdf-to-ofx", es: "bradesco-pdf-a-ofx", pt: "pdf-para-ofx-bradesco" },
  "visualizador-ofx": { en: "ofx-viewer", es: "visor-ofx", pt: "visualizador-ofx" },
  "visualizador-xml": { en: "xml-viewer", es: "visor-xml", pt: "visualizador-xml" },
  "visualizador-planilhas": { en: "spreadsheet-viewer", es: "visor-hojas-de-calculo", pt: "visualizador-planilhas" },
  "visualizador-json": { en: "json-viewer", es: "visor-json", pt: "visualizador-json" },
  "conversor-pdf-para-ofx": { en: "pdf-to-ofx-converter", es: "convertidor-pdf-a-ofx", pt: "conversor-pdf-para-ofx" },
  "reparador-xml-merchant": { en: "google-merchant-xml-fixer", es: "reparador-xml-merchant", pt: "reparador-xml-merchant" },
};

const TOOLS_SEGMENT = "ferramentas";

function invert(table: Record<string, Names>, locale: Locale): Map<string, string> {
  return new Map(Object.entries(table).map(([canonical, names]) => [names[locale], canonical]));
}

const SEGMENTS_BACK = Object.fromEntries(LOCALES.map((l) => [l, invert(SEGMENTS, l)])) as Record<Locale, Map<string, string>>;
const SLUGS_BACK = Object.fromEntries(LOCALES.map((l) => [l, invert(TOOL_SLUGS, l)])) as Record<Locale, Map<string, string>>;

/** Slug de ferramenta no idioma pedido (slugs desconhecidos voltam iguais). */
export function toolSlug(locale: Locale, canonicalSlug: string): string {
  return TOOL_SLUGS[canonicalSlug]?.[locale] ?? canonicalSlug;
}

function splitSuffix(path: string): [string, string] {
  const i = path.search(/[?#]/);
  return i === -1 ? [path, ""] : [path.slice(0, i), path.slice(i)];
}

/** Troca cada segmento; o segmento logo depois de /ferramentas é tratado como slug de ferramenta. */
function mapSegments(path: string, toCanonical: boolean, locale: Locale): string {
  const segments = toCanonical ? SEGMENTS_BACK[locale] : null;
  const slugs = toCanonical ? SLUGS_BACK[locale] : null;
  let afterTools = false;
  return path
    .split("/")
    .map((part) => {
      if (!part) return part;
      if (afterTools) {
        afterTools = false;
        return (toCanonical ? slugs!.get(part) : TOOL_SLUGS[part]?.[locale]) ?? part;
      }
      const canonical = toCanonical ? (segments!.get(part) ?? part) : part;
      afterTools = canonical === TOOLS_SEGMENT;
      return toCanonical ? canonical : (SEGMENTS[part]?.[locale] ?? part);
    })
    .join("/");
}

/** Caminho canônico (sem idioma) → caminho localizado, ainda sem o prefixo do idioma. */
export function localizeSegments(locale: Locale, canonicalPath: string): string {
  const [path, suffix] = splitSuffix(canonicalPath);
  return mapSegments(path, false, locale) + suffix;
}

/** Caminho localizado (sem o prefixo do idioma) → caminho canônico. */
export function canonicalizeSegments(locale: Locale, localizedPath: string): string {
  const [path, suffix] = splitSuffix(localizedPath);
  return mapSegments(path, true, locale) + suffix;
}

/** "/ferramentas/pdf-para-ofx" + "en" → "/en/tools/pdf-to-ofx". "/" → "/en". */
export function localizePath(locale: Locale, canonicalPath: string): string {
  const path = canonicalPath.startsWith("/") ? canonicalPath : `/${canonicalPath}`;
  const localized = localizeSegments(locale, path);
  if (localized === "/") return `/${locale}`;
  if (localized.startsWith("/?") || localized.startsWith("/#")) return `/${locale}${localized.slice(1)}`;
  return `/${locale}${localized}`;
}

/** Caminhos que nunca recebem o prefixo (API, arquivos estáticos e links externos). */
export function isUnlocalizable(href: string): boolean {
  return (
    !href.startsWith("/") ||
    href.startsWith("//") ||
    href === "/api" ||
    href.startsWith("/api/") ||
    /^\/[^/?#]*\.[a-z0-9]+(?:[?#]|$)/i.test(href)
  );
}

export interface ParsedPath {
  /** Idioma do prefixo (null se a URL não tem prefixo de idioma). */
  locale: Locale | null;
  /** Caminho depois do prefixo, como veio na URL (já localizado, ou não). */
  rest: string;
}

/** Separa o prefixo de idioma: "/en/tools/x" → { locale: "en", rest: "/tools/x" }. */
export function parsePath(pathname: string): ParsedPath {
  const [, first, ...tail] = pathname.split("/");
  if (isLocale(first)) return { locale: first, rest: tail.length ? `/${tail.join("/")}` : "/" };
  return { locale: null, rest: pathname };
}

/** Pathname do navegador (com prefixo e segmentos localizados) → caminho canônico sem prefixo. */
export function toCanonicalPath(pathname: string): string {
  const { locale, rest } = parsePath(pathname);
  return locale ? canonicalizeSegments(locale, rest) : rest;
}

/** Mesmo caminho em outro idioma (usado pelo seletor de idioma). */
export function switchLocalePath(pathname: string, to: Locale): string {
  return localizePath(to, toCanonicalPath(pathname));
}

export { DEFAULT_LOCALE };
