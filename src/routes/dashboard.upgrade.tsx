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
// Feature lists are intentionally read from plans.features_* (same keys as planos.tsx)

export const Route = createFileRoute("/dashboard/upgrade")({
  component: UpgradePage,
});

function UpgradePage() {
  const { t, raw } = useI18n();
  const [plan] = useCurrentPlan();
  const checkout = useServerFn(createCheckoutSession);
  const [loading, setLoading] = useState<PlanTier | null>(null);
  const starterFeatures = raw<string[]>("plans.features_starter") ?? [];
  const premiumFeatures = raw<string[]>("plans.features_premium") ?? [];
  const ultraFeatures = raw<string[]>("plans.features_ultra") ?? [];

  const select = async (p: PlanTier) => {
    if (p === "starter" || p === plan) return;
    try {
      setLoading(p);
      const res = await checkout({ data: { planTier: p } });
      if (res?.url) {
        window.location.href = res.url;
      } else {
        toast.error(t("toasts.checkout_init_error"));
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("toasts.checkout_error"));
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
          features={starterFeatures}
          ctaLabel={plan === "starter" ? t("upgrade.current_plan_label") : t("plans.cta_default")}
          onSelect={() => select("starter")}
        />
        <PlanCard
          plan="premium"
          highlight
          features={premiumFeatures}
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
          features={ultraFeatures}
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
