// Textos de apoio do blog e dos termos (só o servidor usa). Os artigos ficam em content/blog/<idioma>/.
import type { Shape } from "../types";

const en = {
  metaTitle: "Blog",
  metaDescription: "Practical guides for accountants, store owners and developers: OFX, bank statements, Google Merchant feeds, test data and more.",
  heading: "Blog",
  description: "Practical guides to solve the everyday problems of accountants, store owners and developers.",
  none: "No articles published yet.",
  readingMinutes: "{minutes} min read",
  moreArticles: "More articles",
  openTool: "Open the tool →",
};
export type BlogMessages = Shape<typeof en>;

const es: BlogMessages = {
  metaTitle: "Blog",
  metaDescription: "Guías prácticas para contadores, dueños de tiendas y desarrolladores: OFX, extractos bancarios, feeds de Google Merchant, datos de prueba y más.",
  heading: "Blog",
  description: "Guías prácticas para resolver los problemas del día a día de contadores, dueños de tiendas y desarrolladores.",
  none: "Aún no hay artículos publicados.",
  readingMinutes: "{minutes} min de lectura",
  moreArticles: "Más artículos",
  openTool: "Abrir la herramienta →",
};

const pt: BlogMessages = {
  metaTitle: "Blog",
  metaDescription: "Guias práticos para contadores, lojistas e desenvolvedores: OFX, extratos bancários, feeds do Google Merchant, dados de teste e mais.",
  heading: "Blog",
  description: "Guias práticos para resolver problemas do dia a dia de contadores, lojistas e desenvolvedores.",
  none: "Nenhum artigo publicado ainda.",
  readingMinutes: "{minutes} min de leitura",
  moreArticles: "Mais artigos",
  openTool: "Abrir a ferramenta →",
};

export default { en, es, pt };
