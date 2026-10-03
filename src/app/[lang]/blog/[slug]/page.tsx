import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import { notFound } from "next/navigation";
import { compileMDX } from "next-mdx-remote/rsc";
import Header from "@/components/Header";
import Breadcrumbs from "@/components/Breadcrumbs";
import JsonLd from "@/components/seo/JsonLd";
import { createMdxComponents } from "@/components/blog/mdx-components";
import { formatPostDate, getAllPosts, getPostBySlug, postLocales } from "@/lib/blog";
import { LOCALES } from "@/i18n/config";
import { getTranslator, pageLocale } from "@/i18n/server";
import { buildAlternates, buildOpenGraph } from "@/i18n/seo";
import { blogBreadcrumbSchema, blogPostingSchema } from "@/lib/seo-schema";

export const dynamicParams = false;

type Params = { lang: string; slug: string };

export function generateStaticParams(): Params[] {
  return LOCALES.flatMap((lang) => getAllPosts(lang).map((p) => ({ lang, slug: p.slug })));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const p = await params;
  const locale = await pageLocale(Promise.resolve(p));
  const post = getPostBySlug(locale, p.slug);
  if (!post) return {};
  const title = `${post.title} | ResolveLabs`;
  const alternates = buildAlternates(locale, `/blog/${post.slug}`, { only: postLocales(post.slug) });
  return {
    title,
    description: post.description,
    alternates,
    openGraph: buildOpenGraph(locale, {
      type: "article",
      url: alternates.canonical as string,
      title,
      description: post.description,
      publishedTime: post.date,
      modifiedTime: post.updated ?? post.date,
      images: [{ url: "/og-image.png", width: 1200, height: 630, alt: post.title }],
    }),
    twitter: { card: "summary_large_image", title, description: post.description, images: ["/og-image.png"] },
  };
}

export default async function BlogPostPage({ params }: { params: Promise<Params> }) {
  const p = await params;
  const locale = await pageLocale(Promise.resolve(p));
  const { t } = getTranslator(locale);
  const post = getPostBySlug(locale, p.slug);
  if (!post) notFound();
  const { content } = await compileMDX({ source: post.content, components: createMdxComponents(locale) });
  const others = getAllPosts(locale).filter((o) => o.slug !== post.slug);

  return (
    <>
      <Header />
      <Breadcrumbs items={[t("common.nav.home"), "Blog", post.title]} hrefs={["/", "/blog", null]} />
      <main className="page-container flex-1 pb-20">
        <JsonLd data={blogPostingSchema(locale, post)} />
        <JsonLd data={blogBreadcrumbSchema(locale, post)} />
        <div className="mx-auto max-w-3xl">
          <header className="mb-8">
            <h1 className="mb-4 text-3xl font-semibold tracking-tight text-stone-900 md:text-4xl">{post.title}</h1>
            <p className="text-sm text-stone-500">
              {post.author} · <time dateTime={post.date}>{formatPostDate(post.date, locale)}</time> · {t("blog.readingMinutes", { minutes: post.readingMinutes })}
            </p>
          </header>
          <article className="prose prose-stone max-w-none prose-headings:tracking-tight prose-headings:text-stone-900 prose-a:text-teal-700 prose-a:underline-offset-2 prose-code:rounded prose-code:bg-stone-100 prose-code:px-1 prose-code:py-0.5 prose-code:font-normal prose-code:text-stone-800 prose-code:before:content-none prose-code:after:content-none [&_pre_code]:bg-transparent [&_pre_code]:p-0 prose-pre:rounded-lg prose-pre:border prose-pre:border-stone-200 prose-pre:bg-stone-100 prose-pre:text-stone-800 prose-blockquote:border-teal-700 prose-blockquote:font-normal prose-blockquote:text-stone-600">
            {content}
          </article>

          {others.length > 0 && (
            <nav className="mt-14 border-t border-stone-200 pt-8" aria-label={t("blog.moreArticles")}>
              <h2 className="section-title mb-4">{t("blog.moreArticles")}</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {others.slice(0, 4).map((o) => (
                  <Link key={o.slug} href={`/blog/${o.slug}`} className="card card-interactive p-4 hover:border-teal-600">
                    <span className="block text-sm font-medium text-stone-900">{o.title}</span>
                    <span className="mt-1 block text-xs text-stone-500">{t("blog.readingMinutes", { minutes: o.readingMinutes })}</span>
                  </Link>
                ))}
              </div>
            </nav>
          )}
        </div>
      </main>
    </>
  );
}
