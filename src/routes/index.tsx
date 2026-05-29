import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { WaitlistModal } from "@/components/WaitlistModal";
import { useI18n, usePageMetadata } from "@/lib/i18n";
import { useSiteMode } from "@/lib/site-mode";
import { DirectoryHome } from "@/components/directory/DirectoryHome";
import logo from "@/assets/logo.png";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Latino Connect — Negócios latinos na Nova Zelândia" },
      {
        name: "description",
        content:
          "A plataforma que conecta a comunidade latina aos melhores negócios e serviços em Nova Zelândia. Entre na lista de espera.",
      },
      { property: "og:title", content: "Latino Connect — Negócios latinos na Nova Zelândia" },
      {
        property: "og:description",
        content:
          "Cadastre seu negócio latino e tenha acesso antecipado à plataforma Latino Connect.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://latinoconnecthub.co.nz/" },
    ],
    links: [{ rel: "canonical", href: "https://latinoconnecthub.co.nz/" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "Latino Connect",
          url: "https://latinoconnecthub.co.nz/",
          inLanguage: "pt-BR",
        }),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Organization",
          name: "Latino Connect",
          url: "https://latinoconnecthub.co.nz/",
          logo: "https://latinoconnecthub.co.nz/favicon.ico",
        }),
      },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  const { mode } = useSiteMode();
  usePageMetadata("metadata.home.title", "metadata.home.description");
  if (mode === "live") return <DirectoryHome />;
  return <WaitlistLanding />;
}

function WaitlistLanding() {
  const [isWaitlistOpen, setIsWaitlistOpen] = useState(true);
  const { t } = useI18n();

  return (
    <div className="relative min-h-screen bg-white font-sans text-gray-800">
      <div
        className={`transition-all duration-500 ${
          isWaitlistOpen ? "filter blur-md brightness-75 pointer-events-none select-none" : ""
        }`}
        aria-hidden={isWaitlistOpen}
      >
        <Landing />
      </div>

      {isWaitlistOpen && <WaitlistModal onClose={() => setIsWaitlistOpen(false)} />}

      {!isWaitlistOpen && (
        <button
          onClick={() => setIsWaitlistOpen(true)}
          className="fixed bottom-4 right-4 sm:bottom-8 sm:right-8 z-40 bg-[#df991b] text-white font-bold px-5 py-3 sm:px-6 sm:py-4 rounded-full hover:bg-[#c4861a] transition-colors animate-inflate text-sm sm:text-base"
        >
          {t("waitlist_button")}
        </button>
      )}
    </div>
  );
}

function Landing() {
  const { t } = useI18n();

  const features = [
    { title: t("features.visibility_title"), body: t("features.visibility_body") },
    { title: t("features.leads_title"), body: t("features.leads_body") },
    { title: t("features.community_title"), body: t("features.community_body") },
  ];

  return (
    <div>
      <header className="bg-white">
        <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
          <img src={logo} alt="Latino Connect Hub" className="h-6 md:h-12 w-auto" />

          <nav className="hidden md:flex items-center gap-2 text-sm font-semibold text-gray-700 bg-gray-100 rounded-full px-2 py-1.5">
            <a className="px-4 py-1.5 rounded-full bg-white shadow-sm">{t("nav.home")}</a>
            <a className="px-4 py-1.5 rounded-full"> </a>
            <a className="px-4 py-1.5 rounded-full">{t("nav.blog")}</a>
          </nav>
        </div>
      </header>

      <section>
        <div className="relative w-full overflow-hidden bg-black text-[#facc15] px-5 sm:px-6 py-16 sm:py-24 text-center">
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "radial-gradient(circle at top left, rgba(223,153,27,0.28) 0%, rgba(0,0,0,0) 45%), radial-gradient(circle at bottom right, rgba(223,153,27,0.18) 0%, rgba(0,0,0,0) 55%)",
            }}
          />
          <div className="relative">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm text-white text-[10px] sm:text-xs font-bold px-3 sm:px-4 py-1.5 sm:py-2 rounded-full mb-5 sm:mb-8 uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-[#df991b]" />
              {t("hero.badge")}
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-7xl font-black tracking-tight leading-[1.05]">
              {t("hero.headline_1")}{" "}
              <span className="text-[#df991b]">{t("hero.headline_highlight")}</span>
              <br />
              {t("hero.headline_2")}
            </h1>
            <p className="mt-4 sm:mt-6 text-sm sm:text-base md:text-lg text-white/70 max-w-2xl mx-auto">
              {t("hero.subheadline")}
            </p>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-5 sm:px-6 py-12 sm:pb-24 grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        {features.map((f) => (
          <div key={f.title} className="rounded-2xl border border-gray-100 p-5 sm:p-6 bg-gray-50/50">
            <div className="w-10 h-10 rounded-xl bg-[#df991b]/15 text-[#df991b] flex items-center justify-center font-black mb-4">
              ★
            </div>
            <h3 className="font-extrabold text-gray-900 mb-1">{f.title}</h3>
            <p className="text-sm text-gray-600">{f.body}</p>
          </div>
        ))}
      </section>

      <footer className="border-t border-gray-100 py-8 text-center text-xs text-gray-400">
        © {new Date().getFullYear()} {t("footer")}
      </footer>
    </div>
  );
}
