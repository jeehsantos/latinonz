import { createFileRoute } from "@tanstack/react-router";
import { SiteShell } from "@/components/site/SiteShell";
import { PlanCard } from "@/components/plans/PlanCard";
import { PlanComparisonTable } from "@/components/plans/PlanComparisonTable";

export const Route = createFileRoute("/planos")({
  head: () => ({
    meta: [
      { title: "Planos — Latino Connect" },
      { name: "description", content: "Escolha o plano ideal para o seu negócio: Starter, Premium ou Ultra." },
      { property: "og:title", content: "Planos — Latino Connect" },
      { property: "og:description", content: "Cadastre seu negócio gratuitamente ou desbloqueie recursos premium." },
      { property: "og:url", content: "https://latinoconnecthub.co.nz/planos" },
    ],
    links: [{ rel: "canonical", href: "https://latinoconnecthub.co.nz/planos" }],
  }),
  component: PlanosPage,
});

function PlanosPage() {
  return (
    <SiteShell>
      <section className="bg-[#0F3D24] text-white">
        <div className="max-w-5xl mx-auto px-6 py-20 text-center">
          <p className="text-xs font-bold uppercase tracking-wider text-amber-300">Planos</p>
          <h1 className="mt-3 text-4xl md:text-5xl font-black">O plano certo para crescer</h1>
          <p className="mt-4 text-white/70 max-w-2xl mx-auto">
            Comece grátis e desbloqueie recursos avançados conforme seu negócio cresce.
          </p>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 -mt-12 pb-16 grid md:grid-cols-3 gap-6">
        <PlanCard
          plan="starter"
          features={[
            "Perfil básico no diretório",
            "3 fotos na galeria",
            "Notificações de leads por e-mail",
            "Avaliações de clientes",
          ]}
          ctaLabel="Começar grátis"
        />
        <PlanCard
          plan="premium"
          highlight
          features={[
            "Perfil completo personalizado",
            "Galeria ilimitada de fotos",
            "Leads via WhatsApp",
            "Mensagens diretas",
            "QR Code do perfil",
            "Cupons promocionais",
            "Analytics do perfil",
          ]}
          ctaLabel="Assinar Premium"
        />
        <PlanCard
          plan="ultra"
          features={[
            "Tudo do Premium",
            "Destaque no topo do diretório",
            "Criação de eventos",
            "Posts em Instagram & Facebook",
            "Posts no WhatsApp da comunidade",
            "Notificações por e-mail e WhatsApp",
          ]}
          ctaLabel="Assinar Ultra"
        />
      </section>

      <section className="max-w-6xl mx-auto px-6 pb-24">
        <h2 className="text-2xl font-black text-gray-900 mb-6 text-center">Comparativo completo</h2>
        <PlanComparisonTable />
      </section>
    </SiteShell>
  );
}
