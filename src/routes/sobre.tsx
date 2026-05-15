import { createFileRoute } from "@tanstack/react-router";
import { SiteShell } from "@/components/site/SiteShell";

export const Route = createFileRoute("/sobre")({
  head: () => ({
    meta: [
      { title: "Sobre — Latino Connect" },
      { name: "description", content: "Conheça a missão da Latino Connect Hub: conectar a comunidade latina em NZ." },
      { property: "og:title", content: "Sobre a Latino Connect" },
      { property: "og:description", content: "Missão, visão e valores da plataforma." },
    ],
  }),
  component: SobrePage,
});

function SobrePage() {
  return (
    <SiteShell>
      <section className="max-w-3xl mx-auto px-6 py-20">
        <p className="text-xs font-bold uppercase tracking-wider text-[#1A5336]">Sobre</p>
        <h1 className="mt-3 text-4xl md:text-5xl font-black text-gray-900">Conectando a comunidade latina em NZ</h1>
        <p className="mt-6 text-lg text-gray-600 leading-relaxed">
          A Latino Connect Hub nasceu da vontade de tornar a comunidade latina mais visível,
          forte e próspera na Nova Zelândia. Conectamos pessoas que buscam serviços
          aos negócios e profissionais que falam o seu idioma e entendem a sua cultura.
        </p>
        <div className="mt-10 grid sm:grid-cols-2 gap-6">
          <div className="bg-gray-50 border border-gray-200 rounded-3xl p-6">
            <p className="font-extrabold text-gray-900">Missão</p>
            <p className="mt-2 text-sm text-gray-600">Empoderar empreendedores latinos e facilitar o acesso a serviços para nossa comunidade.</p>
          </div>
          <div className="bg-gray-50 border border-gray-200 rounded-3xl p-6">
            <p className="font-extrabold text-gray-900">Visão</p>
            <p className="mt-2 text-sm text-gray-600">Ser a principal referência de negócios latinos em toda a Nova Zelândia.</p>
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
