import { createFileRoute } from "@tanstack/react-router";
import { SiteShell } from "@/components/site/SiteShell";
import { Container } from "@/components/site/Container";
import { PlanCard } from "@/components/plans/PlanCard";
import { PlanComparisonTable } from "@/components/plans/PlanComparisonTable";
import { useI18n, usePageMetadata } from "@/lib/i18n";

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
  const { t, raw } = useI18n();
  usePageMetadata("metadata.planos.title", "metadata.planos.description");
  const starterFeatures = raw<string[]>("plans.features_starter") ?? [];
  const premiumFeatures = raw<string[]>("plans.features_premium") ?? [];
  const ultraFeatures = raw<string[]>("plans.features_ultra") ?? [];

  return (
    <SiteShell>
      <Container className="py-16">
        <header className="text-center max-w-2xl mx-auto mb-12">
          <h1 className="text-4xl md:text-5xl font-black text-gray-900">
            {t("plans.page_heading")}
          </h1>
          <p className="mt-4 text-gray-600">{t("plans.page_subheading")}</p>
        </header>

        <div className="grid md:grid-cols-3 gap-6">
          <PlanCard plan="starter" features={starterFeatures} />
          <PlanCard plan="premium" highlight features={premiumFeatures} />
          <PlanCard plan="ultra" features={ultraFeatures} />
        </div>

        <section className="mt-16">
          <h2 className="text-2xl font-black text-gray-900 mb-6 text-center">
            {t("plans.comparison_title")}
          </h2>
          <PlanComparisonTable />
        </section>
      </Container>
    </SiteShell>
  );
}
