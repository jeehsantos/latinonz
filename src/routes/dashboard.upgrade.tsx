import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { PlanCard } from "@/components/plans/PlanCard";
import { PlanComparisonTable } from "@/components/plans/PlanComparisonTable";
import { useCurrentPlan } from "@/lib/dev-plan";
import type { PlanTier } from "@/lib/plans";
import { useI18n } from "@/lib/i18n";
import { createCheckoutSession } from "@/lib/stripe.functions";

export const Route = createFileRoute("/dashboard/upgrade")({
  component: UpgradePage,
});

function UpgradePage() {
  const { t } = useI18n();
  const [plan] = useCurrentPlan();
  const checkout = useServerFn(createCheckoutSession);
  const [loading, setLoading] = useState<PlanTier | null>(null);

  const select = async (p: PlanTier) => {
    if (p === "starter" || p === plan) return;
    try {
      setLoading(p);
      const res = await checkout({ data: { planTier: p } });
      if (res?.url) {
        window.location.href = res.url;
      } else {
        toast.error("Não foi possível iniciar o checkout.");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro no checkout");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black text-white">{t("upgrade.title")}</h1>
        <p className="text-neutral-400 mt-1">
          {t("upgrade.current_plan")} <span className="font-bold capitalize">{plan}</span>
        </p>
      </div>
      <div className="grid md:grid-cols-3 gap-6">
        <PlanCard
          plan="starter"
          features={t("upgrade.starter_features") as unknown as string[]}
          ctaLabel={plan === "starter" ? t("upgrade.current_plan_label") : t("plans.cta_default")}
          onSelect={() => select("starter")}
        />
        <PlanCard
          plan="premium"
          highlight
          features={t("upgrade.premium_features") as unknown as string[]}
          ctaLabel={
            plan === "premium"
              ? t("upgrade.current_plan_label")
              : loading === "premium"
                ? t("upgrade.redirecting")
                : t("upgrade.subscribe_premium")
          }
          onSelect={() => select("premium")}
        />
        <PlanCard
          plan="ultra"
          features={t("upgrade.ultra_features") as unknown as string[]}
          ctaLabel={
            plan === "ultra"
              ? t("upgrade.current_plan_label")
              : loading === "ultra"
                ? t("upgrade.redirecting")
                : t("upgrade.subscribe_ultra")
          }
          onSelect={() => select("ultra")}
        />
      </div>
      <PlanComparisonTable />
    </div>
  );
}
