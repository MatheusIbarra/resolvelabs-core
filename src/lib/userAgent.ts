/** Leitura simples do User-Agent para exibição (navegador, sistema e tipo de aparelho). Não é exaustiva. */
export function describeUserAgent(ua: string | null | undefined): { browser: string; os: string; device: string; bot: boolean } {
  if (!ua) return { browser: "—", os: "—", device: "—", bot: false };
  const bot = /bot|crawl|spider|slurp|headless|curl|wget|python-requests|axios|node-fetch|lighthouse/i.test(ua);

  const browser =
    /Edg\//.test(ua) ? "Edge"
    : /OPR\/|Opera/.test(ua) ? "Opera"
    : /SamsungBrowser/.test(ua) ? "Samsung Internet"
    : /Firefox\/|FxiOS/.test(ua) ? "Firefox"
    : /Chrome\/|CriOS/.test(ua) ? "Chrome"
    : /Safari\//.test(ua) ? "Safari"
    : "Outro";

  const os =
    /Windows NT/.test(ua) ? "Windows"
    : /Android/.test(ua) ? "Android"
    : /iPhone|iPad|iPod/.test(ua) ? "iOS"
    : /Mac OS X|Macintosh/.test(ua) ? "macOS"
    : /CrOS/.test(ua) ? "ChromeOS"
    : /Linux/.test(ua) ? "Linux"
    : "Outro";

  const device = /iPad|Tablet/.test(ua) ? "Tablet" : /Mobi|iPhone|Android/.test(ua) ? "Celular" : "Computador";
  return { browser, os, device, bot };
}
