import type { MetadataRoute } from "next";
import { publicToolPaths } from "@/lib/seo-tools";
import { absoluteUrl } from "@/lib/site";
import { getAllPosts, postLocales } from "@/lib/blog";
import { HREFLANG, LOCALES, DEFAULT_LOCALE, type Locale } from "@/i18n/config";
import { localizePath } from "@/i18n/paths";

type Entry = MetadataRoute.Sitemap[number];

/** Uma entrada por idioma, cada uma listando as alternativas (hreflang + x-default). */
function entriesFor(canonicalPath: string, locales: readonly Locale[], extra: Partial<Entry>): Entry[] {
  const urlOf = (l: Locale) => absoluteUrl(localizePath(l, canonicalPath));
  const languages: Record<string, string> = Object.fromEntries(locales.map((l) => [HREFLANG[l], urlOf(l)]));
  languages["x-default"] = urlOf(locales.includes(DEFAULT_LOCALE) ? DEFAULT_LOCALE : locales[0]);
  return locales.map((l) => ({ url: urlOf(l), alternates: { languages }, ...extra }));
}

// Só entram páginas públicas e indexáveis. Ferramentas PRO (rotas protegidas) ficam de fora;
// quem ranqueia por elas é a landing pública do dicionário de SEO.
export default function sitemap(): MetadataRoute.Sitemap {
  // Só URLs que respondem 200 sem login (ver middleware). /ferramentas e as ferramentas PRO/com cota exigem login.
  const paths = ["/", ...publicToolPaths(), "/suporte", "/termos"];
  const pages = paths.flatMap((path) =>
    entriesFor(path, LOCALES, {
      changeFrequency: path === "/" ? "weekly" : "monthly",
      priority: path === "/" ? 1 : path.startsWith("/ferramentas/") ? 0.8 : 0.3,
    }),
  );

  // O índice do blog e cada artigo só listam os idiomas que realmente existem.
  const blogLocales = LOCALES.filter((l) => getAllPosts(l).length > 0);
  const latest = LOCALES.flatMap((l) => getAllPosts(l)).sort((a, b) => ((b.updated ?? b.date) > (a.updated ?? a.date) ? 1 : -1))[0];
  const blog: Entry[] = [
    ...entriesFor("/blog", blogLocales, { lastModified: latest?.updated ?? latest?.date, changeFrequency: "weekly", priority: 0.7 }),
    ...LOCALES.flatMap((l) => getAllPosts(l).map((p) => p.slug))
      .filter((slug, i, all) => all.indexOf(slug) === i)
      .flatMap((slug) => {
        const post = getAllPosts(postLocales(slug)[0]).find((p) => p.slug === slug)!;
        return entriesFor(`/blog/${slug}`, postLocales(slug), { lastModified: post.updated ?? post.date, changeFrequency: "monthly", priority: 0.6 });
      }),
  ];
  return [...pages, ...blog];
}
