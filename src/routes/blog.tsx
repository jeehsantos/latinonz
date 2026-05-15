import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteShell } from "@/components/site/SiteShell";
import { NEWS } from "@/lib/mock/news";

export const Route = createFileRoute("/blog")({
  head: () => ({
    meta: [
      { title: "Blog — Latino Connect" },
      { name: "description", content: "Notícias, guias e dicas úteis para a comunidade latina na Nova Zelândia." },
      { property: "og:title", content: "Blog — Latino Connect" },
      { property: "og:description", content: "Vistos, finanças, comunidade e mais." },
    ],
  }),
  component: BlogPage,
});

function BlogPage() {
  return (
    <SiteShell>
      <section className="bg-[#0F3D24] text-white">
        <div className="max-w-5xl mx-auto px-6 py-16">
          <p className="text-xs font-bold uppercase tracking-wider text-amber-300">Blog</p>
          <h1 className="mt-3 text-4xl md:text-5xl font-black">Notícias da comunidade</h1>
          <p className="mt-3 text-white/70 max-w-2xl">
            Vistos, finanças, adaptação e histórias da comunidade latina em NZ.
          </p>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 py-12 grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {NEWS.map((n) => (
          <Link
            key={n.slug}
            to="/blog/$slug"
            params={{ slug: n.slug }}
            className="group bg-white border border-gray-200 hover:border-[#1A5336]/40 hover:shadow-lg rounded-3xl overflow-hidden transition"
          >
            <div className="aspect-[16/10] bg-gradient-to-br from-emerald-100 to-amber-100" />
            <div className="p-6">
              <p className="text-xs font-bold uppercase tracking-wider text-[#1A5336]">{n.category}</p>
              <h3 className="mt-2 font-extrabold text-gray-900 group-hover:text-[#1A5336]">{n.title}</h3>
              <p className="text-sm text-gray-600 mt-2 line-clamp-2">{n.excerpt}</p>
              <p className="text-xs text-gray-400 mt-3">{n.date}</p>
            </div>
          </Link>
        ))}
      </section>
    </SiteShell>
  );
}
