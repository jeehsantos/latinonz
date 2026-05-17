import { createFileRoute } from "@tanstack/react-router";
import { SiteShell } from "@/components/site/SiteShell";
import { Container } from "@/components/site/Container";
import { PlanCard } from "@/components/plans/PlanCard";
import { PlanComparisonTable } from "@/components/plans/PlanComparisonTable";

export const Route = createFileRoute("/planos")({
  head: () => ({
    meta: [
      { title: "Planos — Latino Connect" },
      {
        name: "description",
        content:
          "Conheça os planos Starter, Premium e Ultra do Latino Connect e escolha o ideal para o seu negócio na Nova Zelândia.",
      },
      { property: "og:title", content: "Planos — Latino Connect" },
      {
        property: "og:description",
        content:
          "Compare os planos Starter, Premium e Ultra do Latino Connect para divulgar seu negócio latino na Nova Zelândia.",
      },
      { property: "og:url", content: "https://latinoconnecthub.co.nz/planos" },
    ],
    links: [{ rel: "canonical", href: "https://latinoconnecthub.co.nz/planos" }],
  }),
  component: PlanosPage,
});

function PlanosPage() {
  return (
    <SiteShell>
      <Container className="py-16">
        <header className="text-center max-w-2xl mx-auto mb-12">
          <h1 className="text-4xl md:text-5xl font-black text-gray-900">Escolha o seu plano</h1>
          <p className="mt-4 text-gray-600">
            Comece grátis e evolua conforme o seu negócio cresce na comunidade latina da Nova Zelândia.
          </p>
        </header>

        <div className="grid md:grid-cols-3 gap-6">
          <PlanCard
            plan="starter"
            features={[
              "Perfil básico no diretório",
              "Até 3 fotos",
              "Contatos por email",
              "Avaliações de clientes",
            ]}
          />
          <PlanCard
            plan="premium"
            highlight
            features={[
              "Perfil completo destacado",
              "Galeria ilimitada de fotos",
              "Leads via WhatsApp",
              "Cupons e promoções",
              "QR Code do negócio",
              "Analytics do perfil",
            ]}
          />
          <PlanCard
            plan="ultra"
            features={[
              "Tudo do Premium",
              "Destaque no topo do diretório",
              "Eventos e comunidade",
              "Publicações em redes sociais",
              "Suporte prioritário",
            ]}
          />
        </div>

        <section className="mt-16">
          <h2 className="text-2xl font-black text-gray-900 mb-6 text-center">Compare os planos</h2>
          <PlanComparisonTable />
        </section>
      </Container>
    </SiteShell>
  );
}
