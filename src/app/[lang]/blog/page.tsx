import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import Header from "@/components/Header";
import Breadcrumbs from "@/components/Breadcrumbs";
import PageHeading from "@/components/PageHeading";
import { formatPostDate, getAllPosts } from "@/lib/blog";
import { getTranslator, pageLocale, type LangParams } from "@/i18n/server";
import { buildAlternates } from "@/i18n/seo";

export async function generateMetadata({ params }: LangParams): Promise<Metadata> {
  const locale = await pageLocale(params);
  const { t } = getTranslator(locale);
  return {
    title: `${t("blog.metaTitle")} | ResolveLabs`,
    description: t("blog.metaDescription"),
    alternates: buildAlternates(locale, "/blog"),
  };
}

export default async function BlogIndexPage({ params }: LangParams) {
  const locale = await pageLocale(params);
  const { t } = getTranslator(locale);
  const posts = getAllPosts(locale);
  return (
    <>
      <Header />
      <Breadcrumbs items={[t("common.nav.home"), "Blog"]} hrefs={["/", null]} />
      <main className="page-container flex-1 pb-20">
        <PageHeading title={t("blog.heading")} description={t("blog.description")} />
        {posts.length === 0 ? (
          <p className="text-sm text-stone-500">{t("blog.none")}</p>
        ) : (
          <div className="stagger grid gap-4 md:grid-cols-2">
            {posts.map((post) => (
              <Link key={post.slug} href={`/blog/${post.slug}`} className="card card-interactive group flex flex-col p-6 hover:border-teal-600">
                <p className="mb-3 text-xs text-stone-500">
                  <time dateTime={post.date}>{formatPostDate(post.date, locale)}</time> · {t("blog.readingMinutes", { minutes: post.readingMinutes })}
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
