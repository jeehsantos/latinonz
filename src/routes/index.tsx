import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { WaitlistModal } from "@/components/WaitlistModal";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "LatinoNZ — Diretório de negócios latinos na Nova Zelândia" },
      {
        name: "description",
        content:
          "A plataforma que conecta a comunidade latina aos melhores negócios e serviços em Nova Zelândia. Entre na lista de espera.",
      },
      { property: "og:title", content: "LatinoNZ — Negócios latinos na Nova Zelândia" },
      {
        property: "og:description",
        content:
          "Cadastre seu negócio latino e tenha acesso antecipado à plataforma LatinoNZ.",
      },
      { property: "og:type", content: "website" },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  const [isWaitlistOpen, setIsWaitlistOpen] = useState(true);

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
          className="fixed bottom-8 right-8 z-40 bg-[#1A5336] text-white font-bold px-6 py-4 rounded-full shadow-2xl hover:bg-[#123F27] hover:scale-105 transition-all animate-in slide-in-from-bottom-10 duration-500"
        >
          Entrar na Lista de Espera
        </button>
      )}
    </div>
  );
}

function Landing() {
  return (
    <div>
      <header className="bg-white">
        <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
          <span className="font-extrabold text-xl tracking-tight">
            <span className="text-[#1A5336]">Latino</span>
            <span className="text-[#EFC64E] ml-1">NZ</span>
          </span>
          <nav className="hidden md:flex items-center gap-2 text-sm font-semibold text-gray-700 bg-gray-100 rounded-full px-2 py-1.5">
            <a className="px-4 py-1.5 rounded-full bg-white shadow-sm">Início</a>
            <a className="px-4 py-1.5 rounded-full">Planos & Preços</a>
            <a className="px-4 py-1.5 rounded-full">Blog & Notícias</a>
          </nav>
          <button className="bg-[#1A5336] text-white font-bold text-sm px-5 py-2.5 rounded-xl hover:bg-[#123F27] transition-colors">
            Anunciar Negócio
          </button>
        </div>
      </header>

      <section className="px-4">
        <div className="relative max-w-7xl mx-auto rounded-3xl overflow-hidden bg-[#0F3D24] text-white px-6 py-24 text-center">
          <div
            className="absolute inset-0 opacity-60 pointer-events-none"
            style={{
              background:
                "radial-gradient(ellipse at top, rgba(26,83,54,0.8) 0%, rgba(15,61,36,0) 70%)",
            }}
          />
          <div className="relative">
            <div className="inline-flex items-center gap-2 bg-black/30 backdrop-blur-sm text-white text-xs font-bold px-4 py-2 rounded-full mb-8 uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-[#EFC64E]" />
              Comunidade Latina na NZ
            </div>
            <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-[1.05]">
              Encontre negócios
              <br />
              <span className="text-[#EFC64E]">latinos</span> na Nova Zelândia
            </h1>
            <p className="mt-6 text-base md:text-lg text-white/70 max-w-2xl mx-auto">
              O diretório moderno de profissionais e empresas latinas. De autônomos a grandes
              negócios, tudo em um só lugar.
            </p>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 pb-24 grid md:grid-cols-3 gap-6">
        {[
          {
            title: "Mais visibilidade",
            body: "Apareça em buscas locais e seja encontrado pela comunidade latina em toda a NZ.",
          },
          {
            title: "Leads qualificados",
            body: "Receba contatos diretos via WhatsApp de pessoas procurando seu serviço.",
          },
          {
            title: "Comunidade forte",
            body: "Faça parte de uma rede que valoriza e apoia negócios latinos.",
          },
        ].map((f) => (
          <div
            key={f.title}
            className="rounded-2xl border border-gray-100 p-6 bg-gray-50/50"
          >
            <div className="w-10 h-10 rounded-xl bg-[#1A5336]/10 text-[#1A5336] flex items-center justify-center font-black mb-4">
              ★
            </div>
            <h3 className="font-extrabold text-gray-900 mb-1">{f.title}</h3>
            <p className="text-sm text-gray-600">{f.body}</p>
          </div>
        ))}
      </section>

      <footer className="border-t border-gray-100 py-8 text-center text-xs text-gray-400">
        © {new Date().getFullYear()} LatinoNZ — Feito para a comunidade latina na Nova Zelândia.
      </footer>
    </div>
  );
}
