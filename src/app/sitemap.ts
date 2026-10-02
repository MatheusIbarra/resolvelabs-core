import type { MetadataRoute } from "next";
import { publicToolPaths } from "@/lib/seo-tools";
import { absoluteUrl } from "@/lib/site";
import { getAllPosts } from "@/lib/blog";

// Só entram páginas públicas e indexáveis. Ferramentas PRO (rotas protegidas) ficam de fora;
// quem ranqueia por elas é a landing pública do dicionário de SEO.
export default function sitemap(): MetadataRoute.Sitemap {
  // Só URLs que respondem 200 sem login (ver middleware). /ferramentas e as ferramentas PRO/com cota exigem login.
  const paths = ["/", ...publicToolPaths(), "/suporte", "/termos"];
  const pages: MetadataRoute.Sitemap = paths.map((path) => ({
    url: absoluteUrl(path),
    changeFrequency: path === "/" ? "weekly" : "monthly",
    priority: path === "/" ? 1 : path.startsWith("/ferramentas/") ? 0.8 : 0.3,
  }));
  const posts = getAllPosts();
  const blog: MetadataRoute.Sitemap = [
    { url: absoluteUrl("/blog"), lastModified: posts[0]?.updated ?? posts[0]?.date, changeFrequency: "weekly", priority: 0.7 },
    ...posts.map((p) => ({ url: absoluteUrl(`/blog/${p.slug}`), lastModified: p.updated ?? p.date, changeFrequency: "monthly" as const, priority: 0.6 })),
  ];
  return [...pages, ...blog];
}
