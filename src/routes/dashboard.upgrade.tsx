import { createFileRoute } from "@tanstack/react-router";
import { PlanCard } from "@/components/plans/PlanCard";
import { PlanComparisonTable } from "@/components/plans/PlanComparisonTable";
import { useCurrentPlan } from "@/lib/dev-plan";
import type { PlanTier } from "@/lib/plans";

export const Route = createFileRoute("/dashboard/upgrade")({
  component: UpgradePage,
});

function UpgradePage() {
  const [plan, setPlan] = useCurrentPlan();
  const select = (p: PlanTier) => setPlan(p);
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black text-gray-900">Escolha o seu plano</h1>
        <p className="text-gray-500 mt-1">Plano atual: <span className="font-bold capitalize">{plan}</span></p>
      </div>
      <div className="grid md:grid-cols-3 gap-6">
        <PlanCard plan="starter" features={["Perfil básico", "3 fotos", "Leads por e-mail"]} ctaLabel={plan === "starter" ? "Plano atual" : "Selecionar"} onSelect={() => select("starter")} />
        <PlanCard plan="premium" highlight features={["Perfil completo", "Galeria ilimitada", "Leads via WhatsApp", "Cupons", "Analytics"]} ctaLabel={plan === "premium" ? "Plano atual" : "Assinar Premium"} onSelect={() => select("premium")} />
        <PlanCard plan="ultra" features={["Tudo do Premium", "Destaque no topo", "Eventos", "Posts em redes sociais"]} ctaLabel={plan === "ultra" ? "Plano atual" : "Assinar Ultra"} onSelect={() => select("ultra")} />
      </div>
      <PlanComparisonTable />
    </div>
  );
}
