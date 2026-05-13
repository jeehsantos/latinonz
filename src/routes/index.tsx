import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { WaitlistModal } from "@/components/WaitlistModal";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Latino Connect — Diretório de negócios latinos na Nova Zelândia" },
      {
        name: "description",
        content:
          "A plataforma que conecta a comunidade latina aos melhores negócios e serviços em Nova Zelândia. Entre na lista de espera.",
      },
      { property: "og:title", content: "Latino Connect — Negócios latinos na Nova Zelândia" },
      {
        property: "og:description",
        content: "Cadastre seu negócio latino e tenha acesso antecipado à plataforma Latino Connect.",
      },
      { property: "og:type", content: "website" },
    ],
  }),
  component: HomePage,
});

function HomePage() {
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
          className="fixed bottom-8 right-8 z-40 bg-[#1A5336] text-white font-bold px-6 py-4 rounded-full hover:bg-[#123F27] transition-colors animate-inflate"
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
          <span className="font-extrabold text-xl tracking-tight">
            <span className="text-[#1A5336]">Latino</span>
            <span className="text-[#EFC64E] ml-1">NZ</span>
          </span>
          <nav className="hidden md:flex items-center gap-2 text-sm font-semibold text-gray-700 bg-gray-100 rounded-full px-2 py-1.5">
            <a className="px-4 py-1.5 rounded-full bg-white shadow-sm">{t("nav.home")}</a>
            <a className="px-4 py-1.5 rounded-full"> </a>
            <a className="px-4 py-1.5 rounded-full">{t("nav.blog")}</a>
          </nav>
        </div>
      </header>

      <section>
        <div className="relative w-full overflow-hidden bg-[#0F3D24] text-white px-6 py-24 md:py-32 text-center min-h-[480px] md:min-h-[600px] flex items-center justify-center">
          <video
            className="absolute inset-0 w-full h-full object-cover"
            src="/hero-cover.mp4"
            poster="/hero-cover-poster.jpg"
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            aria-hidden="true"
          />
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "linear-gradient(180deg, rgba(15,61,36,0.55) 0%, rgba(15,61,36,0.65) 100%), radial-gradient(circle at top left, rgba(239,198,78,0.18) 0%, rgba(15,61,36,0) 45%), radial-gradient(circle at bottom right, rgba(26,83,54,0.7) 0%, rgba(15,61,36,0) 55%)",
            }}
          />
          <div className="relative">
            <div className="inline-flex items-center gap-2 bg-black/30 backdrop-blur-sm text-white text-xs font-bold px-4 py-2 rounded-full mb-8 uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-[#EFC64E]" />
              {t("hero.badge")}
            </div>
            <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-[1.05]">
              {t("hero.headline_1")}
              <br />
              <span className="text-[#EFC64E]">{t("hero.headline_highlight")}</span> {t("hero.headline_2")}
            </h1>
            <p className="mt-6 text-base md:text-lg text-white/70 max-w-2xl mx-auto">{t("hero.subheadline")}</p>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 pb-24 grid md:grid-cols-3 gap-6">
        {features.map((f) => (
          <div key={f.title} className="rounded-2xl border border-gray-100 p-6 bg-gray-50/50">
            <div className="w-10 h-10 rounded-xl bg-[#1A5336]/10 text-[#1A5336] flex items-center justify-center font-black mb-4">
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
