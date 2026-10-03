/** Leitura simples do User-Agent para exibição (navegador, sistema e tipo de aparelho). Não é exaustiva. */
export type UaDevice = "tablet" | "phone" | "desktop" | "unknown";

/** `browser`/`os` voltam "other" quando desconhecidos; `device` volta um código (traduzido na tela, em `admin.ua.*`). */
export function describeUserAgent(ua: string | null | undefined): { browser: string; os: string; device: UaDevice; bot: boolean } {
  if (!ua) return { browser: "unknown", os: "unknown", device: "unknown", bot: false };
  const bot = /bot|crawl|spider|slurp|headless|curl|wget|python-requests|axios|node-fetch|lighthouse/i.test(ua);

  const browser =
    /Edg\//.test(ua) ? "Edge"
    : /OPR\/|Opera/.test(ua) ? "Opera"
    : /SamsungBrowser/.test(ua) ? "Samsung Internet"
    : /Firefox\/|FxiOS/.test(ua) ? "Firefox"
    : /Chrome\/|CriOS/.test(ua) ? "Chrome"
    : /Safari\//.test(ua) ? "Safari"
    : "other";

  const os =
    /Windows NT/.test(ua) ? "Windows"
    : /Android/.test(ua) ? "Android"
    : /iPhone|iPad|iPod/.test(ua) ? "iOS"
    : /Mac OS X|Macintosh/.test(ua) ? "macOS"
    : /CrOS/.test(ua) ? "ChromeOS"
    : /Linux/.test(ua) ? "Linux"
    : "other";

  const device: UaDevice = /iPad|Tablet/.test(ua) ? "tablet" : /Mobi|iPhone|Android/.test(ua) ? "phone" : "desktop";
  return { browser, os, device, bot };
}
