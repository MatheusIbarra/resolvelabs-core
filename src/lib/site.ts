/** URL pública do site (mesma origem usada em `metadataBase` no layout). */
export function siteUrl(): string {
  // trim antes de tirar a barra final: APP_URL com \n/espaço quebra o <loc> do sitemap.
  return (process.env.APP_URL ?? "http://localhost:3000").trim().replace(/\/+$/, "");
}

export function absoluteUrl(path: string): string {
  const clean = path.trim();
  return `${siteUrl()}${clean.startsWith("/") ? clean : `/${clean}`}`;
}
