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
      <header className="border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-[#1A5336] flex items-center justify-center text-white font-black">
              L
            </div>
            <span className="font-extrabold text-lg tracking-tight">
              Latino<span className="text-[#1A5336]">NZ</span>
            </span>
          </div>
          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-gray-600">
            <a>Sobre</a>
            <a>Negócios</a>
            <a>Categorias</a>
            <a>Contato</a>
          </nav>
          <button className="bg-[#1A5336] text-white font-bold text-sm px-4 py-2 rounded-xl">
            Entrar
          </button>
        </div>
      </header>

      <section className="max-w-6xl mx-auto px-6 py-24 text-center">
        <div className="inline-block bg-[#EFC64E]/20 text-[#8a6a16] text-xs font-bold px-3 py-1 rounded-full mb-5 uppercase tracking-wider">
          Em breve na Nova Zelândia
        </div>
        <h1 className="text-5xl md:text-6xl font-black tracking-tight text-gray-900 leading-tight">
          O diretório da comunidade
          <br />
          <span className="text-[#1A5336]">Latina na Nova Zelândia</span>
        </h1>
        <p className="mt-6 text-lg text-gray-600 max-w-2xl mx-auto">
          Encontre restaurantes, serviços e negócios latinos perto de você — ou cadastre seu
          próprio negócio e alcance milhares de clientes.
        </p>
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
