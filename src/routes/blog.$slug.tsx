import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { SiteShell } from "@/components/site/SiteShell";
import { getNewsBySlug } from "@/lib/mock/news";

export const Route = createFileRoute("/blog/$slug")({
  loader: ({ params }) => {
    const article = getNewsBySlug(params.slug);
    if (!article) throw notFound();
    return { article };
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.article.title ?? "Artigo"} — Latino Connect` },
      { name: "description", content: loaderData?.article.excerpt ?? "" },
      { property: "og:title", content: loaderData?.article.title ?? "" },
      { property: "og:description", content: loaderData?.article.excerpt ?? "" },
    ],
  }),
  notFoundComponent: () => (
    <SiteShell>
      <div className="max-w-3xl mx-auto px-6 py-24 text-center">
        <h1 className="text-3xl font-black">Artigo não encontrado</h1>
        <Link to="/blog" className="inline-flex mt-6 bg-[#1A5336] text-white font-bold px-5 py-2.5 rounded-xl">
          Voltar ao blog
        </Link>
      </div>
    </SiteShell>
  ),
  errorComponent: ({ error }) => (
    <SiteShell><div className="max-w-3xl mx-auto px-6 py-24 text-center text-red-600">{error.message}</div></SiteShell>
  ),
  component: BlogArticle,
});

function BlogArticle() {
  const { article } = Route.useLoaderData();
  return (
    <SiteShell>
      <article className="max-w-3xl mx-auto px-6 py-16">
        <Link to="/blog" className="text-sm text-gray-500 hover:text-[#1A5336]">← Voltar ao blog</Link>
        <p className="mt-6 text-xs font-bold uppercase tracking-wider text-[#1A5336]">{article.category}</p>
        <h1 className="mt-2 text-4xl font-black text-gray-900">{article.title}</h1>
        <p className="text-sm text-gray-400 mt-2">{article.date}</p>
        <div className="aspect-[16/9] mt-8 rounded-3xl bg-gradient-to-br from-emerald-100 to-amber-100" />
        <p className="mt-8 text-lg text-gray-700 leading-relaxed">{article.excerpt}</p>
        <div className="mt-6 space-y-4 text-gray-700 leading-relaxed">
          <p>Este é um conteúdo placeholder. O artigo completo será publicado em breve com informações práticas e atualizadas para a comunidade latina em Nova Zelândia.</p>
          <p>Inscreva-se na nossa newsletter para receber novidades sobre vistos, oportunidades de trabalho, dicas financeiras e histórias da comunidade.</p>
        </div>
      </article>
    </SiteShell>
  );
}
