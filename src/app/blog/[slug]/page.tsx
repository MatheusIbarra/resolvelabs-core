import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { compileMDX } from "next-mdx-remote/rsc";
import Header from "@/components/Header";
import Breadcrumbs from "@/components/Breadcrumbs";
import JsonLd from "@/components/seo/JsonLd";
import { mdxComponents } from "@/components/blog/mdx-components";
import { formatPostDate, getAllPosts, getPostBySlug } from "@/lib/blog";
import { blogBreadcrumbSchema, blogPostingSchema } from "@/lib/seo-schema";

export const dynamicParams = false;

type Params = { slug: string };

export function generateStaticParams(): Params[] {
  return getAllPosts().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const post = getPostBySlug((await params).slug);
  if (!post) return {};
  const title = `${post.title} | ResolveLabs`;
  return {
    title,
    description: post.description,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      type: "article",
      siteName: "ResolveLabs",
      locale: "pt_BR",
      url: `/blog/${post.slug}`,
      title,
      description: post.description,
      publishedTime: post.date,
      modifiedTime: post.updated ?? post.date,
      images: [{ url: "/og-image.png", width: 1200, height: 630, alt: post.title }],
    },
    twitter: { card: "summary_large_image", title, description: post.description, images: ["/og-image.png"] },
  };
}

export default async function BlogPostPage({ params }: { params: Promise<Params> }) {
  const post = getPostBySlug((await params).slug);
  if (!post) notFound();
  const { content } = await compileMDX({ source: post.content, components: mdxComponents });
  const others = getAllPosts().filter((p) => p.slug !== post.slug);

  return (
    <>
      <Header />
      <Breadcrumbs items={["Home", "Blog", post.title]} hrefs={["/", "/blog", null]} />
      <main className="page-container flex-1 pb-20">
        <JsonLd data={blogPostingSchema(post)} />
        <JsonLd data={blogBreadcrumbSchema(post)} />
        <div className="mx-auto max-w-3xl">
          <header className="mb-8">
            <h1 className="mb-4 text-3xl font-semibold tracking-tight text-stone-900 md:text-4xl">{post.title}</h1>
            <p className="text-sm text-stone-500">
              {post.author} · <time dateTime={post.date}>{formatPostDate(post.date)}</time> · {post.readingMinutes} min de leitura
            </p>
          </header>
          <article className="prose prose-stone max-w-none prose-headings:tracking-tight prose-headings:text-stone-900 prose-a:text-teal-700 prose-a:underline-offset-2 prose-code:rounded prose-code:bg-stone-100 prose-code:px-1 prose-code:py-0.5 prose-code:font-normal prose-code:text-stone-800 prose-code:before:content-none prose-code:after:content-none prose-pre:rounded-lg prose-pre:border prose-pre:border-stone-200 prose-pre:bg-stone-100 prose-pre:text-stone-800 prose-blockquote:border-teal-700 prose-blockquote:font-normal prose-blockquote:text-stone-600">
            {content}
          </article>

          {others.length > 0 && (
            <nav className="mt-14 border-t border-stone-200 pt-8" aria-label="Mais artigos">
              <h2 className="section-title mb-4">Mais artigos</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {others.slice(0, 4).map((o) => (
                  <Link key={o.slug} href={`/blog/${o.slug}`} className="card card-interactive p-4 hover:border-teal-600">
                    <span className="block text-sm font-medium text-stone-900">{o.title}</span>
                    <span className="mt-1 block text-xs text-stone-500">{o.readingMinutes} min de leitura</span>
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
