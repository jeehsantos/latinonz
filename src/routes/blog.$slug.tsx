import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { SiteShell } from "@/components/site/SiteShell";
import { getNewsBySlug, getLocalizedNewsItem } from "@/lib/mock/news";
import { useI18n, usePageMetadata } from "@/lib/i18n";

export const Route = createFileRoute("/blog/$slug")({
  loader: ({ params }) => {
    const article = getNewsBySlug(params.slug);
    if (!article) throw notFound();
    return { article };
  },
  head: ({ params, loaderData }) => ({
    meta: [
      { title: `${loaderData?.article.title ?? "Artigo"} — Latino Connect` },
      { name: "description", content: loaderData?.article.excerpt ?? "" },
      { property: "og:title", content: loaderData?.article.title ?? "" },
      { property: "og:description", content: loaderData?.article.excerpt ?? "" },
      { property: "og:type", content: "article" },
      { property: "og:url", content: `https://latinoconnecthub.co.nz/blog/${params.slug}` },
    ],
    links: [{ rel: "canonical", href: `https://latinoconnecthub.co.nz/blog/${params.slug}` }],
    scripts: loaderData
      ? [
          {
            type: "application/ld+json",
            children: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Article",
              headline: loaderData.article.title,
              description: loaderData.article.excerpt,
              datePublished: loaderData.article.date,
              author: { "@type": "Organization", name: "Latino Connect" },
              mainEntityOfPage: `https://latinoconnecthub.co.nz/blog/${params.slug}`,
            }),
          },
        ]
      : [],
  }),
  notFoundComponent: BlogNotFound,
  errorComponent: ({ error }) => (
    <SiteShell>
      <div className="max-w-3xl mx-auto px-6 py-24 text-center text-red-600">{error.message}</div>
    </SiteShell>
  ),
  component: BlogArticle,
});

function BlogNotFound() {
  const { t } = useI18n();
  return (
    <SiteShell>
      <div className="max-w-3xl mx-auto px-6 py-24 text-center">
        <h1 className="text-3xl font-black">{t("blog.not_found_title")}</h1>
        <Link
          to="/blog"
          className="inline-flex mt-6 bg-black text-[#facc15] font-bold px-5 py-2.5 rounded-xl"
        >
          {t("blog.back_to_blog")}
        </Link>
      </div>
    </SiteShell>
  );
}

function BlogArticle() {
  const { locale, t } = useI18n();
  const { article } = Route.useLoaderData();
  const item = getLocalizedNewsItem(article, locale);
  usePageMetadata(
    undefined,
    undefined,
    `${item.title ?? t("blog.article_title_fallback")} — Latino Connect`,
    item.excerpt,
  );

  return (
    <SiteShell>
      <article className="max-w-3xl mx-auto px-6 py-16">
        <Link to="/blog" className="text-sm text-gray-500 hover:text-[#facc15]">
          {t("blog.back_to_blog")}
        </Link>
        <p className="mt-6 text-xs font-bold uppercase tracking-wider text-[#facc15]">
          {item.category}
        </p>
        <h1 className="mt-2 text-4xl font-black text-gray-900">{item.title}</h1>
        <p className="text-sm text-gray-400 mt-2">{item.date}</p>
        <div className="aspect-[16/9] mt-8 rounded-3xl bg-gradient-to-br from-emerald-100 to-amber-100" />
        <p className="mt-8 text-lg text-gray-700 leading-relaxed">{item.excerpt}</p>
        <div className="mt-6 space-y-4 text-gray-700 leading-relaxed">
          <p>{t("blog.placeholder_body")}</p>
          <p>{t("blog.placeholder_cta")}</p>
        </div>
      </article>
    </SiteShell>
  );
}
