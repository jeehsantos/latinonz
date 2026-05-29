import { createFileRoute, Link } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";
import { SiteShell } from "@/components/site/SiteShell";
import { NEWS, getLocalizedNewsItem } from "@/lib/mock/news";
import { useI18n, usePageMetadata } from "@/lib/i18n";

export const Route = createFileRoute("/blog")({
  head: () => ({
    meta: [
      { title: "Blog — Latino Connect" },
      {
        name: "description",
        content: "Notícias, guias e dicas úteis para a comunidade latina na Nova Zelândia.",
      },
      { property: "og:title", content: "Blog — Latino Connect" },
      { property: "og:description", content: "Vistos, finanças, comunidade e mais." },
      { property: "og:url", content: "https://latinoconnecthub.co.nz/blog" },
    ],
    links: [{ rel: "canonical", href: "https://latinoconnecthub.co.nz/blog" }],
  }),
  component: BlogPage,
});

function BlogPage() {
  const { t } = useI18n();
  usePageMetadata("metadata.blog.title", "metadata.blog.description");
  
  return (
    <SiteShell>
      <section className="bg-black border-b border-white/10">
        <div className="max-w-5xl mx-auto px-6 py-16">
          <p className="text-xs font-bold uppercase tracking-wider text-[#facc15]">
            {t("blog.badge")}
          </p>
          <h1 className="mt-3 text-4xl md:text-5xl font-black text-white">{t("blog.title")}</h1>
          <p className="mt-3 text-white/70 max-w-2xl">{t("blog.subtitle")}</p>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-6 py-16 md:py-24">
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-neutral-900 via-black to-neutral-900 border border-white/10 shadow-2xl group">
          {/* Glow */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,#facc15,transparent_60%)] opacity-15 group-hover:opacity-25 transition-opacity duration-1000"></div>

          <div className="relative p-12 md:p-24 text-center">
            <div className="inline-flex items-center justify-center p-4 bg-[#facc15]/10 rounded-2xl mb-8 ring-1 ring-[#facc15]/30 backdrop-blur-md">
              <Sparkles className="w-10 h-10 text-[#facc15]" />
            </div>

            <h2 className="text-4xl md:text-6xl font-black text-white tracking-tight mb-6">
              {t("blog.coming_soon_title")}
            </h2>

            <p className="text-lg md:text-xl text-white/70 max-w-2xl mx-auto font-medium leading-relaxed">
              {t("blog.coming_soon_desc")}
            </p>

            <div className="mt-12 flex items-center justify-center gap-3">
              <div className="w-2.5 h-2.5 rounded-full bg-[#facc15] animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-2.5 h-2.5 rounded-full bg-[#facc15] animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-2.5 h-2.5 rounded-full bg-[#facc15] animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
          </div>
        </div>
      </section>

    </SiteShell>
  );
}
