import type { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/Header";
import Breadcrumbs from "@/components/Breadcrumbs";
import PageHeading from "@/components/PageHeading";
import { formatPostDate, getAllPosts } from "@/lib/blog";

export const metadata: Metadata = {
  title: "Blog | ResolveLabs",
  description: "Guias práticos para contadores, lojistas e desenvolvedores: OFX, extratos bancários, feeds do Google Merchant, dados de teste e mais.",
  alternates: { canonical: "/blog" },
};

export default function BlogIndexPage() {
  const posts = getAllPosts();
  return (
    <>
      <Header />
      <Breadcrumbs items={["Home", "Blog"]} hrefs={["/", null]} />
      <main className="page-container flex-1 pb-20">
        <PageHeading
          title="Blog"
          description="Guias práticos para resolver problemas do dia a dia de contadores, lojistas e desenvolvedores."
        />
        {posts.length === 0 ? (
          <p className="text-sm text-stone-500">Nenhum artigo publicado ainda.</p>
        ) : (
          <div className="stagger grid gap-4 md:grid-cols-2">
            {posts.map((post) => (
              <Link key={post.slug} href={`/blog/${post.slug}`} className="card card-interactive group flex flex-col p-6 hover:border-teal-600">
                <p className="mb-3 text-xs text-stone-500">
                  <time dateTime={post.date}>{formatPostDate(post.date)}</time> · {post.readingMinutes} min de leitura
                </p>
                <h2 className="mb-2 text-lg font-semibold tracking-tight text-stone-900 group-hover:text-teal-800">{post.title}</h2>
                <p className="mb-4 flex-1 text-sm leading-relaxed text-stone-600">{post.description}</p>
                <p className="text-xs text-stone-500">{post.author}</p>
              </Link>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
